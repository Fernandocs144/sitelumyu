import crypto from 'crypto';
import { evaluateFollowUp } from '../admin/admin-followup-engine.js';
import { bulkGetLeadCadenceReadModels } from '../admin/admin-followup-cadence-service.js';
import { buildFollowUpContextFingerprint } from '../admin/admin-followup-state-service.js';
import { syncZohoInboundMessages } from '../zoho/zoho-inbound-sync.js';
import { generateFollowUpDraft } from '../admin/admin-followup-draft-service.js';
import { approveFollowUpCommunication } from '../admin/admin-followup-approval-service.js';
import { dispatchApprovedFollowUpCommunication } from '../admin/admin-followup-dispatch-service.js';
import { sendInternalHandoffNotification } from '../email/internal-handoff-notification-service.js';
import { sendInternalCriticalAlertNotification } from '../email/internal-critical-alert-service.js';

/**
 * FASE 8 (PASSO 2) — COMMERCIAL AUTOMATION SCHEDULER SERVICE
 *
 * Serviço central de agendamento automático para acompanhamento comercial.
 * Adquire lease de lock persistente, executa sincronização Zoho inbound,
 * percorre leads em batches determinísticos por keyset pagination com limite temporal snapshot,
 * constrói o contexto idêntico ao Admin, classifica decisões e materializa tarefas automáticas.
 *
 * Configuração por defeito (FAIL-CLOSED):
 * - dryRun = true
 * - enableAutomaticTasks = false
 * - enableAutomaticOutbound = false
 */

export const AUTOMATIC_TASK_REASON_ALLOWLIST = new Set([
  'meeting_outcome_pending',
  'meeting_follow_up',
  'negotiation_stale',
  'cadence_exhausted',
  'dispatch_status_unknown',
  'human_contact_requested'
]);

export const AUTOMATIC_TASK_TITLE_MAP = {
  meeting_outcome_pending: 'Registar resultado da reunião realizada',
  meeting_follow_up: 'Acompanhamento pós-reunião',
  negotiation_stale: 'Revisão comercial da fase de negociação',
  cadence_exhausted: 'Revisão comercial após esgotamento de cadência',
  dispatch_status_unknown: 'Verificação manual de envio com estado incerto',
  human_contact_requested: 'Contacto humano solicitado pelo visitante'
};

export const ALLOWED_OUTBOUND_PIPELINE_STAGES = new Set([
  'new',
  'qualified',
  'proposal'
]);

/**
 * Mapeia deterministicamente a fase comercial de uma conversa abandonada para o resultado primário correspondente.
 *
 * @param {string} stage Fase comercial da conversa ('discovery', 'exploring_need', 'qualifying', 'suggesting_booking', 'booking_in_progress', 'closed')
 * @returns {string|null} Resultado primário de abandono ou null se a fase não for elegível para abandono
 */
export function mapCommercialStageToAbandonmentOutcome(stage) {
  if (stage === 'discovery') {
    return 'abandoned_before_contact';
  }
  if (stage === 'exploring_need' || stage === 'qualifying') {
    return 'abandoned_during_qualification';
  }
  if (stage === 'suggesting_booking' || stage === 'booking_in_progress') {
    return 'abandoned_during_booking';
  }
  return null;
}

/**
 * Resolve factual, determinística e fail-closed o responsável comercial da lead.
 *
 * Precedência Obrigatória:
 * 1. LEADS.ASSIGNED_TO (se preenchido e resolvível para public.admin_users)
 * 2. TAREFAS MANUAIS ABERTAS (status = 'open' e creation_mode manual/null -> exatamente 1 assignee único)
 * 3. FALLBACK DE ADMIN ÚNICO (se existir exatamente 1 admin em public.admin_users)
 * 4. UNRESOLVED (null)
 */
export function resolveLeadCommercialOwnerId(context, { adminUsers = [] } = {}) {
  const validAdminUserIds = Array.from(new Set(
    (adminUsers || [])
      .map(a => (typeof a === 'string' ? a.trim() : (a?.user_id || a?.id)?.toString().trim()))
      .filter(isValidUuid)
  ));

  // 1. LEADS.ASSIGNED_TO
  const leadAssignedTo = context?.lead?.assigned_to;
  if (leadAssignedTo && typeof leadAssignedTo === 'string' && leadAssignedTo.trim()) {
    const trimmedLeadAssignedTo = leadAssignedTo.trim();
    if (isValidUuid(trimmedLeadAssignedTo)) {
      if (validAdminUserIds.includes(trimmedLeadAssignedTo)) {
        return { assignedTo: trimmedLeadAssignedTo, source: 'lead_assignment' };
      }
    } else {
      // Se for email ou texto livre, verificar se corresponde inequivocamente a UM admin
      const matchingAdmins = (adminUsers || []).filter(a => {
        if (typeof a === 'object' && a !== null) {
          const emailMatch = a.email && a.email.toLowerCase() === trimmedLeadAssignedTo.toLowerCase();
          const nameMatch = a.name && a.name.toLowerCase() === trimmedLeadAssignedTo.toLowerCase();
          return emailMatch || nameMatch;
        }
        return false;
      });

      if (matchingAdmins.length === 1) {
        const adminId = matchingAdmins[0].user_id || matchingAdmins[0].id;
        if (isValidUuid(adminId)) {
          return { assignedTo: adminId, source: 'lead_assignment' };
        }
      }
    }
  }

  // 2. TAREFAS MANUAIS ABERTAS
  const tasks = context?.tasks || [];
  const manualOpenTasks = tasks.filter(t => {
    if (!t || t.status !== 'open') return false;
    const mode = t.creation_mode;
    return mode === 'manual' || mode === null || mode === undefined;
  });

  const distinctManualAssignees = Array.from(new Set(
    manualOpenTasks
      .map(t => t?.assigned_to)
      .filter(isValidUuid)
  ));

  if (distinctManualAssignees.length === 1) {
    return { assignedTo: distinctManualAssignees[0], source: 'manual_open_task' };
  }

  // 3. FALLBACK DE ADMIN ÚNICO
  if (validAdminUserIds.length === 1) {
    return { assignedTo: validAdminUserIds[0], source: 'single_admin_fallback' };
  }

  // 4. UNRESOLVED
  return { assignedTo: null, source: 'unresolved' };
}

export function isValidUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Valida e resolve a data de corte de ativação do outbound automático (SCHEDULER_OUTBOUND_ACTIVATED_AT).
 *
 * Fail-Closed:
 * - Ausente ou vazia -> { configured: false, valid: false, cutoffDate: null, error: false }
 * - Inválida -> { configured: true, valid: false, cutoffDate: null, error: true }
 * - Válida -> { configured: true, valid: true, cutoffDate: Date, error: false }
 */
export function resolveOutboundActivationCutoff(rawActivatedAt) {
  const envVal = rawActivatedAt !== undefined && rawActivatedAt !== null
    ? rawActivatedAt
    : (typeof process !== 'undefined' && process.env ? process.env.SCHEDULER_OUTBOUND_ACTIVATED_AT : null);

  if (!envVal || typeof envVal !== 'string' || !envVal.trim()) {
    return { configured: false, valid: false, cutoffDate: null, error: false };
  }

  const trimmed = envVal.trim();
  const dateObj = new Date(trimmed);
  const timeMs = dateObj.getTime();

  if (isNaN(timeMs)) {
    return { configured: true, valid: false, cutoffDate: null, error: true };
  }

  return { configured: true, valid: true, cutoffDate: dateObj, error: false };
}

/**
 * Avalia se uma lead (com base no seu created_at) cumpre o cutoff de ativação do outbound automático.
 */
export function evaluateLeadOutboundActivation(leadCreatedAt, cutoffDate) {
  if (!cutoffDate || !(cutoffDate instanceof Date) || isNaN(cutoffDate.getTime())) {
    return { eligible: false, status: 'pre_activation_backlog' };
  }

  if (!leadCreatedAt) {
    return { eligible: false, status: 'pre_activation_backlog' };
  }

  const createdAtMs = new Date(leadCreatedAt).getTime();
  if (isNaN(createdAtMs)) {
    return { eligible: false, status: 'pre_activation_backlog' };
  }

  const cutoffMs = cutoffDate.getTime();
  if (createdAtMs < cutoffMs) {
    return { eligible: false, status: 'pre_activation_backlog' };
  }

  return { eligible: true, status: 'post_activation_eligible' };
}

export function deriveAutomaticTaskTitle(reasonCode) {
  return AUTOMATIC_TASK_TITLE_MAP[reasonCode] || 'Ação comercial pendente';
}

export function normalizeTaskPriority(priority) {
  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'normal';
}

export async function runCommercialScheduler({
  supabaseClient,
  dryRun = true,
  enableAutomaticTasks = false,
  enableAutomaticOutbound = false,
  outboundActivatedAt = null,
  outboundProvider = 'resend',
  outboundSimulateMode = 'accepted',
  now = new Date(),
  ownerId = null,
  batchSize = 100,
  fetchMessagesFn = null,
  adminUsers = null,
  resendClient = null
} = {}) {
  if (!supabaseClient) {
    throw new Error('supabaseClient é obrigatório em runCommercialScheduler');
  }

  const isDryRun = dryRun !== false;
  const isEnableAutomaticTasks = enableAutomaticTasks === true;
  const isEnableAutomaticOutbound = enableAutomaticOutbound === true;
  const evaluationDate = typeof now === 'string' ? new Date(now) : now;
  const snapshotUpperBound = evaluationDate.toISOString();
  const effectiveOwnerId = ownerId || `scheduler_${crypto.randomUUID()}`;
  const jobName = 'commercial_scheduler';

  const cutoffInfo = resolveOutboundActivationCutoff(outboundActivatedAt);

  const metrics = {
    status: 'completed',
    dry_run: isDryRun,
    enable_automatic_tasks: isEnableAutomaticTasks,
    enable_automatic_outbound: isEnableAutomaticOutbound,
    lock_acquired: false,
    lock_released: false,
    outbound_blocked_reason: null,
    zoho: {
      scanned: 0,
      processed: 0,
      duplicates: 0,
      unmatched: 0,
      ambiguous: 0,
      self_filtered: 0,
      invalid: 0,
      errors: 0,
      has_more: false
    },
    leads: {
      scanned: 0,
      batches: 0
    },
    decisions: {
      no_action: 0,
      external_contact: 0,
      internal_action: 0,
      human_review: 0,
      blocked: 0
    },
    tasks: {
      eligible: 0,
      created: 0,
      existing: 0,
      assignment_unresolved: 0,
      skipped_unmapped: 0,
      errors: 0
    },
    task_assignment: {
      from_lead: 0,
      from_manual_task: 0,
      from_single_admin_fallback: 0,
      unresolved: 0
    },
    outbound_activation: {
      configured: cutoffInfo.configured,
      valid: cutoffInfo.valid,
      pre_activation_backlog: 0,
      post_activation_eligible: 0,
      configuration_error: cutoffInfo.error ? 1 : 0
    },
    outbound: {
      eligible: 0,
      drafts_generated: 0,
      approved: 0,
      dispatched: 0,
      failed: 0,
      unknown: 0,
      skipped: 0
    },
    abandoned_conversations_evaluated: 0,
    abandoned_conversations_classified: 0,
    abandoned_conversations_failed: 0,
    abandoned_conversations: {
      evaluated: 0,
      classified: 0,
      failed: 0
    },
    errors: 0
  };

  // 1. Adquirir Lease Persistente do Scheduler
  try {
    const { data: lockResult, error: lockErr } = await supabaseClient.rpc('try_acquire_scheduler_lock', {
      p_job_name: jobName,
      p_owner_id: effectiveOwnerId,
      p_lease_seconds: 300
    });

    if (lockErr || !lockResult || lockResult.acquired !== true) {
      metrics.status = 'skipped_locked';
      metrics.lock_acquired = false;
      return metrics;
    }

    metrics.lock_acquired = true;
  } catch (lockEx) {
    metrics.status = 'skipped_locked';
    metrics.lock_acquired = false;
    return metrics;
  }

  try {
    // 2. Sincronizar Zoho Inbound ANTES de avaliar leads (com política FAIL-CLOSED)
    if (typeof fetchMessagesFn === 'function') {
      try {
        const zohoResult = await syncZohoInboundMessages({
          supabaseClient,
          fetchMessagesFn,
          limit: 50,
          maxPages: 5
        });

        metrics.zoho = {
          scanned: zohoResult.scanned || 0,
          processed: zohoResult.processed || 0,
          duplicates: zohoResult.duplicates || 0,
          unmatched: zohoResult.unmatched || 0,
          ambiguous: zohoResult.ambiguous || 0,
          self_filtered: zohoResult.self_filtered || 0,
          invalid: zohoResult.invalid || 0,
          errors: zohoResult.errors || 0,
          has_more: Boolean(zohoResult.has_more)
        };
      } catch (zohoErr) {
        console.error('Falha na sincronização Zoho no início do scheduler (FAIL-CLOSED):', zohoErr.message);
        metrics.status = 'failed';
        metrics.errors++;
        try {
          await sendInternalCriticalAlertNotification({
            component: 'Zoho Inbound Sync',
            errorType: 'zoho_sync_blocked_outbound',
            errorTitle: 'Sincronização Zoho Falhou (Outbound Bloqueado)',
            errorMessage: zohoErr.message,
            now: evaluationDate,
            resendClient
          });
        } catch (_) {}
        return metrics;
      }
    }

    // 2.5 Classificação Automática Mínima de Conversas Abandonadas (Inatividade >= 24h)
    try {
      const inactivityCutoffMs = evaluationDate.getTime() - (24 * 60 * 60 * 1000);
      const inactivityCutoffIso = new Date(inactivityCutoffMs).toISOString();

      const { data: staleConversations, error: convQueryErr } = await supabaseClient
        .from('conversations')
        .select('id, status, commercial_stage, primary_outcome, last_activity_at')
        .eq('status', 'active')
        .is('primary_outcome', null)
        .lte('last_activity_at', inactivityCutoffIso);

      if (convQueryErr) {
        console.error('Erro ao consultar conversas abandonadas no scheduler:', convQueryErr);
        metrics.abandoned_conversations_failed++;
        metrics.abandoned_conversations.failed++;
      } else if (Array.isArray(staleConversations)) {
        for (const conv of staleConversations) {
          metrics.abandoned_conversations_evaluated++;
          metrics.abandoned_conversations.evaluated++;

          const outcome = mapCommercialStageToAbandonmentOutcome(conv.commercial_stage);
          if (!outcome) {
            continue;
          }

          if (!isDryRun) {
            try {
              const { error: updateErr } = await supabaseClient
                .from('conversations')
                .update({
                  status: 'inactive',
                  primary_outcome: outcome,
                  updated_at: snapshotUpperBound
                })
                .eq('id', conv.id)
                .eq('status', 'active')
                .is('primary_outcome', null);

              if (updateErr) {
                console.error(`Erro ao classificar conversa abandonada ${conv.id}:`, updateErr);
                metrics.abandoned_conversations_failed++;
                metrics.abandoned_conversations.failed++;
              } else {
                metrics.abandoned_conversations_classified++;
                metrics.abandoned_conversations.classified++;
              }
            } catch (updateEx) {
              console.error(`Exceção ao classificar conversa abandonada ${conv.id}:`, updateEx);
              metrics.abandoned_conversations_failed++;
              metrics.abandoned_conversations.failed++;
            }
          } else {
            metrics.abandoned_conversations_classified++;
            metrics.abandoned_conversations.classified++;
          }
        }
      }
    } catch (abandonmentPassErr) {
      console.error('Erro na passagem de conversas abandonadas no scheduler:', abandonmentPassErr);
      metrics.abandoned_conversations_failed++;
      metrics.abandoned_conversations.failed++;
    }

    // 3. Obter utilizadores administradores ativos para resolução determinística de ownership
    let effectiveAdminUsers = adminUsers;
    if (!Array.isArray(effectiveAdminUsers)) {
      try {
        const { data: adminsData } = await supabaseClient.from('admin_users').select('user_id');
        effectiveAdminUsers = adminsData || [];
      } catch (adminErr) {
        console.error('Erro ao consultar admin_users no scheduler:', adminErr);
        effectiveAdminUsers = [];
      }
    }

    // 4. Percorrer TODAS as leads em batches determinísticos por Keyset Pagination
    const effectiveBatchSize = Math.min(Math.max(parseInt(batchSize, 10) || 100, 1), 500);
    let lastCreatedAt = null;
    let lastId = null;
    let hasMore = true;

    const selectQuery = `
      id,
      name,
      email,
      company_name,
      need_description,
      primary_service,
      pipeline_stage,
      lead_classification,
      last_interaction_at,
      next_step,
      assigned_to,
      created_at,
      updated_at,
      conversations (
        id,
        status,
        last_activity_at,
        updated_at
      ),
      calendar_bookings (
        id,
        status,
        start_time,
        end_time
      ),
      lead_tasks (
        id,
        title,
        status,
        priority,
        due_at,
        assigned_to,
        creation_mode,
        created_at
      )
    `;

    while (hasMore) {
      let query = supabaseClient
        .from('leads')
        .select(selectQuery)
        .lte('created_at', snapshotUpperBound);

      if (lastCreatedAt && lastId) {
        query = query.or(`created_at.gt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.gt.${lastId})`);
      }

      query = query
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(effectiveBatchSize);

      const { data: rawLeads, error: queryErr } = await query;

      if (queryErr) {
        console.error('Erro ao consultar lote de leads no scheduler:', queryErr);
        metrics.status = 'failed';
        metrics.errors++;
        break;
      }

      const batchList = rawLeads || [];
      if (batchList.length === 0) {
        hasMore = false;
        break;
      }

      metrics.leads.batches++;
      metrics.leads.scanned += batchList.length;

      // 4.1 Agregação anti-N+1 de Cadence Read Models para o lote
      const batchLeadIds = batchList.map(l => l.id).filter(Boolean);
      let cadenceMap = new Map();
      try {
        cadenceMap = await bulkGetLeadCadenceReadModels(supabaseClient, batchLeadIds);
      } catch (cadenceErr) {
        console.error('Erro ao consultar cadence read models no lote do scheduler:', cadenceErr);
        metrics.errors++;
      }

      // 4.2 Avaliação contextual de cada lead no lote
      for (const rawLead of batchList) {
        try {
          const latestConv = (rawLead.conversations || []).sort((a, b) => {
            const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
            const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
            return bTime - aTime;
          })[0] || null;

          const context = {
            lead: {
              id: rawLead.id,
              name: rawLead.name,
              email: rawLead.email,
              company_name: rawLead.company_name,
              need_description: rawLead.need_description,
              primary_service: rawLead.primary_service,
              pipeline_stage: rawLead.pipeline_stage,
              lead_classification: rawLead.lead_classification,
              last_interaction_at: rawLead.last_interaction_at,
              assigned_to: rawLead.assigned_to,
              created_at: rawLead.created_at,
              updated_at: rawLead.updated_at
            },
            latestConversation: latestConv,
            bookings: rawLead.calendar_bookings || [],
            tasks: rawLead.lead_tasks || [],
            cadenceReadModel: cadenceMap.get(rawLead.id) || null
          };

          const recommendation = evaluateFollowUp(context, evaluationDate);

          // Classificação das decisões
          if (recommendation.blocked) {
            metrics.decisions.blocked++;
          } else if (!recommendation.needs_follow_up || !recommendation.reason_code) {
            metrics.decisions.no_action++;
          } else if (recommendation.action_type === 'external_contact') {
            metrics.decisions.external_contact++;

            const activationCheck = evaluateLeadOutboundActivation(rawLead.created_at, cutoffInfo.cutoffDate);
            if (!activationCheck.eligible) {
              metrics.outbound_activation.pre_activation_backlog++;
              metrics.outbound.skipped++;
            } else {
              metrics.outbound_activation.post_activation_eligible++;

              // Processamento de Outbound Automático (APENAS se !dryRun, enableAutomaticOutbound === true, cutoff válido, stage permitida e Zoho sync completo)
              if (!isDryRun && isEnableAutomaticOutbound) {
                const isAllowedStage = ALLOWED_OUTBOUND_PIPELINE_STAGES.has(rawLead.pipeline_stage);
                const isZohoIncomplete = metrics.zoho.has_more === true;

                if (isZohoIncomplete) {
                  metrics.outbound_blocked_reason = 'zoho_sync_incomplete';
                  metrics.outbound.skipped++;
                } else if (
                  cutoffInfo.valid &&
                  recommendation.contact_eligible === true &&
                  !recommendation.blocked &&
                  isAllowedStage
                ) {
                  metrics.outbound.eligible++;

                  try {
                    // 1. Gerar Rascunho pelo serviço existente
                    const draftRes = await generateFollowUpDraft(supabaseClient, {
                      leadId: rawLead.id,
                      now: evaluationDate
                    });

                    const draftContent = draftRes?.draft || draftRes;
                    const bodyText = draftContent?.message;
                    const subjectText = draftContent?.subject || null;
                    const source = draftContent?.generation_source || 'fallback';
                    const pVersion = draftRes?.prompt_version || null;

                    metrics.outbound.drafts_generated++;

                    // 2. Aprovação Automática pelo serviço existente
                    const approvalRes = await approveFollowUpCommunication(supabaseClient, {
                      leadId: rawLead.id,
                      body: bodyText,
                      subject: subjectText,
                      generationSource: source,
                      promptVersion: pVersion,
                      approvalMode: 'automatic',
                      adminUserId: null,
                      now: evaluationDate
                    });

                    metrics.outbound.approved++;

                    // 3. Disparo Factual pelo serviço existente
                    try {
                      const dispatchRes = await dispatchApprovedFollowUpCommunication(supabaseClient, {
                        approvedCommunicationId: approvalRes.communication.id,
                        provider: outboundProvider,
                        simulateMode: outboundSimulateMode,
                        adminUserId: null,
                        now: evaluationDate
                      });

                      if (dispatchRes?.dispatch?.status === 'accepted') {
                        metrics.outbound.dispatched++;
                      } else if (dispatchRes?.dispatch?.status === 'unknown') {
                        metrics.outbound.unknown++;
                      } else {
                        metrics.outbound.failed++;
                      }
                    } catch (dispatchErr) {
                      console.error(`Erro no disparo de follow-up para lead ${rawLead.id}:`, dispatchErr.message);
                      if (dispatchErr.dispatch?.status === 'unknown' || dispatchErr.errorCode === 'PROVIDER_TIMEOUT') {
                        metrics.outbound.unknown++;
                      } else {
                        metrics.outbound.failed++;
                      }
                    }
                  } catch (outboundPipelineErr) {
                    console.error(`Erro no pipeline outbound da lead ${rawLead.id}:`, outboundPipelineErr.message);
                    metrics.outbound.failed++;
                  }
                } else {
                  metrics.outbound.skipped++;
                }
              }
            }
          } else if (recommendation.action_type === 'internal_action') {
            metrics.decisions.internal_action++;
          } else if (recommendation.action_type === 'human_review') {
            metrics.decisions.human_review++;
          } else {
            metrics.decisions.no_action++;
          }

          // 4.3 Processamento de Tarefas Automáticas (APENAS se !dryRun e enableAutomaticTasks === true)
          if (!isDryRun && isEnableAutomaticTasks && recommendation.needs_follow_up && !recommendation.blocked) {
            const reasonCode = recommendation.reason_code;

            if (AUTOMATIC_TASK_REASON_ALLOWLIST.has(reasonCode)) {
              metrics.tasks.eligible++;

              const ownerRes = resolveLeadCommercialOwnerId(context, { adminUsers: effectiveAdminUsers });
              const assignedToId = ownerRes?.assignedTo || null;

              if (!assignedToId) {
                metrics.tasks.assignment_unresolved++;
                metrics.task_assignment.unresolved++;
              } else {
                if (ownerRes.source === 'lead_assignment') {
                  metrics.task_assignment.from_lead++;
                } else if (ownerRes.source === 'manual_open_task') {
                  metrics.task_assignment.from_manual_task++;
                } else if (ownerRes.source === 'single_admin_fallback') {
                  metrics.task_assignment.from_single_admin_fallback++;
                } else {
                  metrics.task_assignment.unresolved++;
                }

                const fingerprint = buildFollowUpContextFingerprint(context, recommendation);
                const taskTitle = deriveAutomaticTaskTitle(reasonCode);
                const taskPriority = normalizeTaskPriority(recommendation.priority);
                const taskDueAt = recommendation.recommended_at || snapshotUpperBound;

                const { data: rpcRes, error: rpcErr } = await supabaseClient.rpc('create_automatic_lead_task', {
                  p_lead_id: rawLead.id,
                  p_assigned_to: assignedToId,
                  p_title: taskTitle,
                  p_priority: taskPriority,
                  p_due_at: taskDueAt,
                  p_reason_code: reasonCode,
                  p_context_fingerprint: fingerprint
                });

                if (rpcErr) {
                  console.error(`Erro ao criar tarefa automática para lead ${rawLead.id}:`, rpcErr);
                  metrics.tasks.errors++;
                } else if (rpcRes?.inserted === true) {
                  metrics.tasks.created++;

                  // Disparar notificação por email interno para a equipa Lumyo (apenas quando 1 nova tarefa é criada)
                  try {
                    await sendInternalHandoffNotification({
                      lead: context.lead,
                      reasonCode,
                      taskTitle,
                      fingerprint,
                      resendClient
                    });
                  } catch (notificationErr) {
                    console.error(`Erro ao disparar notificação por email interno para lead ${rawLead.id}:`, notificationErr);
                  }
                } else if (rpcRes?.inserted === false) {
                  metrics.tasks.existing++;
                } else {
                  metrics.tasks.errors++;
                }
              }
            } else {
              metrics.tasks.skipped_unmapped++;
            }
          }
        } catch (leadEvalErr) {
          console.error(`Erro ao avaliar lead ${rawLead.id} no scheduler:`, leadEvalErr);
          metrics.errors++;
        }
      }

      // Atualizar cursor para o próximo lote
      const lastItem = batchList[batchList.length - 1];
      lastCreatedAt = lastItem.created_at;
      lastId = lastItem.id;

      if (batchList.length < effectiveBatchSize) {
        hasMore = false;
      }
    }
  } catch (globalEx) {
    console.error('Exceção global no serviço do scheduler:', globalEx);
    metrics.status = 'failed';
    metrics.errors++;
    try {
      await sendInternalCriticalAlertNotification({
        component: 'Commercial Scheduler',
        errorType: 'scheduler_global_failure',
        errorTitle: 'Falha Global na Execução do Agendador',
        errorMessage: globalEx.message || 'Exceção não tratada no scheduler.',
        now: evaluationDate,
        resendClient
      });
    } catch (_) {}
  } finally {
    // 4. Libertar o Lease do Lock no `finally`
    if (metrics.lock_acquired) {
      try {
        const { data: releaseRes } = await supabaseClient.rpc('release_scheduler_lock', {
          p_job_name: jobName,
          p_owner_id: effectiveOwnerId
        });

        metrics.lock_released = Boolean(releaseRes?.released);
      } catch (releaseEx) {
        console.error('Erro ao libertar lock no scheduler:', releaseEx);
        metrics.lock_released = false;
      }
    }
  }

  return metrics;
}
