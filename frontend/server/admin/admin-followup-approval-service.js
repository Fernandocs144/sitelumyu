import { evaluateFollowUp } from './admin-followup-engine.js';
import { buildFollowUpContextFingerprint, bulkGetEffectiveFollowUpStates } from './admin-followup-state-service.js';
import { getLeadCadenceReadModel } from './admin-followup-cadence-service.js';

/**
 * FASE 7D.1 — FOLLOW-UP COMMUNICATION APPROVAL SERVICE
 *
 * Serviço server-side para aprovação formal e imutável de comunicações por um Admin (sem envio).
 */

/**
 * Aprova uma comunicação comercial para uma lead num contexto factual específico.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} params
 * @param {string} params.adminUserId UUID do Admin autenticado (server-derived)
 * @param {string} params.leadId UUID da lead
 * @param {string} params.body Corpo final aprovado da mensagem (não vazio, máx. 10000 chars)
 * @param {string} [params.subject] Assunto opcional da mensagem (máx. 255 chars)
 * @param {string} [params.generationSource='manual'] 'ai' | 'fallback' | 'manual'
 * @param {string} [params.promptVersion] Versão opcional do prompt
 * @param {Date|string} [params.now=new Date()]
 */
export async function approveFollowUpCommunication(supabaseClient, {
  adminUserId = null,
  leadId,
  body,
  subject = null,
  generationSource = 'manual',
  promptVersion = null,
  approvalMode = 'manual',
  now = new Date()
}) {
  if (!supabaseClient) throw new Error('SupabaseClient é obrigatório em approveFollowUpCommunication');
  if (!leadId) throw new Error('leadId é obrigatório em approveFollowUpCommunication');

  const mode = approvalMode === 'automatic' ? 'automatic' : 'manual';
  if (mode === 'manual' && !adminUserId) {
    throw new Error('adminUserId é obrigatório para aprovações manuais em approveFollowUpCommunication');
  }

  // 1. Validação estrita do corpo e assunto da mensagem
  if (typeof body !== 'string' || body.trim().length === 0) {
    const err = new Error('O corpo da mensagem é obrigatório e não pode ser vazio.');
    err.statusCode = 400;
    throw err;
  }

  const sanitizedBody = body.trim().replace(/<[^>]*>?/gm, ''); // Remover HTML se houver
  if (sanitizedBody.length > 10000) {
    const err = new Error('O corpo da mensagem excede o limite máximo de 10.000 carateres.');
    err.statusCode = 400;
    throw err;
  }

  let sanitizedSubject = null;
  if (typeof subject === 'string' && subject.trim().length > 0) {
    sanitizedSubject = subject.trim().replace(/<[^>]*>?/gm, '');
    if (sanitizedSubject.length > 255) {
      const err = new Error('O assunto da mensagem excede o limite máximo de 255 carateres.');
      err.statusCode = 400;
      throw err;
    }
  }

  const validSources = ['ai', 'fallback', 'manual'];
  const source = validSources.includes(generationSource) ? generationSource : 'manual';
  const evaluationDate = typeof now === 'string' ? new Date(now) : now;

  // 2. Carregar contexto factual completo da lead na base de dados
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
      created_at
    )
  `;

  const { data: rawLead, error: leadErr } = await supabaseClient
    .from('leads')
    .select(selectQuery)
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr || !rawLead) {
    const err = new Error('Lead não encontrada para aprovação de comunicação');
    err.statusCode = 404;
    throw err;
  }

  // 3. Validação do email do destinatário (derivado exclusivamente de leads.email)
  const recipientEmail = typeof rawLead.email === 'string' ? rawLead.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || !emailRegex.test(recipientEmail)) {
    const err = new Error('A lead não possui um endereço de email válido para aprovação de comunicação por email.');
    err.statusCode = 400;
    throw err;
  }

  const latestConv = (rawLead.conversations || []).sort((a, b) => {
    const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return bTime - aTime;
  })[0] || null;

  const cadenceReadModel = await getLeadCadenceReadModel(supabaseClient, leadId);

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
      created_at: rawLead.created_at,
      updated_at: rawLead.updated_at
    },
    latestConversation: latestConv,
    bookings: rawLead.calendar_bookings || [],
    tasks: rawLead.lead_tasks || [],
    cadenceReadModel
  };

  // 4. Reavaliação server-side com o Follow-Up Engine (7G.1 Cadence-Aware)
  const recommendation = evaluateFollowUp(context, evaluationDate);

  if (recommendation.blocked) {
    const err = new Error(`Não é possível aprovar comunicação: Lead bloqueada (${recommendation.blocked_reason})`);
    err.statusCode = 422;
    err.blocked_reason = recommendation.blocked_reason;
    throw err;
  }

  if (!recommendation.needs_follow_up || !recommendation.reason_code) {
    const err = new Error('Esta lead não possui uma recomendação de follow-up ativa no momento.');
    err.statusCode = 422;
    throw err;
  }

  if (recommendation.contact_eligible !== true) {
    const err = new Error(`Aprovação de comunicação rejeitada: Recomendação com tipo de ação '${recommendation.action_type || 'não elegível'}' não permite envio de comunicação comercial.`);
    err.statusCode = 422;
    err.contact_eligible = false;
    err.action_type = recommendation.action_type;
    throw err;
  }

  // 5. Verificação do Recommendation State (ignored / snoozed)
  const fingerprint = buildFollowUpContextFingerprint(context, recommendation);
  const statesMap = await bulkGetEffectiveFollowUpStates(supabaseClient, [{ lead_id: leadId, context_fingerprint: fingerprint }], evaluationDate);
  const stateInfo = statesMap.get(fingerprint);

  if (stateInfo?.effective_state === 'ignored') {
    const err = new Error('Não é possível aprovar comunicação: Recomendação está ignorada.');
    err.statusCode = 422;
    err.effective_state = 'ignored';
    throw err;
  }

  if (stateInfo?.effective_state === 'snoozed') {
    const snoozedUntilStr = stateInfo.event?.snoozed_until ? new Date(stateInfo.event.snoozed_until).toLocaleString('pt-PT') : '';
    const err = new Error(`Não é possível aprovar comunicação: Recomendação está adiada${snoozedUntilStr ? ` até ${snoozedUntilStr}` : ''}.`);
    err.statusCode = 422;
    err.effective_state = 'snoozed';
    err.snoozed_until = stateInfo.event?.snoozed_until;
    throw err;
  }

  // 5.1 Resolução Server-Side da Instância de Cadência Atual (pipeline_stage_history.id)
  let cadenceInstanceId = null;
  const currentStage = rawLead.pipeline_stage || 'new';

  const { data: latestStageHistory } = await supabaseClient
    .from('pipeline_stage_history')
    .select('id')
    .eq('lead_id', leadId)
    .eq('to_stage', currentStage)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestStageHistory?.id) {
    cadenceInstanceId = latestStageHistory.id;
  }

  // 6. Inserção do registo imutável de aprovação
  const insertPayload = {
    lead_id: leadId,
    cadence_instance_id: cadenceInstanceId,
    context_fingerprint: fingerprint,
    reason_code: recommendation.reason_code,
    channel: 'email',
    recipient_email: recipientEmail,
    recipient_name: rawLead.name ? rawLead.name.trim() : null,
    subject: sanitizedSubject,
    body: sanitizedBody,
    generation_source: source,
    prompt_version: promptVersion || null,
    status: 'approved',
    approval_mode: mode,
    approved_by: mode === 'manual' ? adminUserId : null,
    approved_at: new Date().toISOString()
  };

  const { data, error } = await supabaseClient
    .from('approved_communications')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    // Tratar violação do índice único parcial (duplicação de aprovação ativa)
    if (error.code === '23505' || error.message?.includes('idx_approved_comm_active_unique')) {
      const err = new Error('Já existe uma comunicação aprovada ativa para este contexto da lead.');
      err.statusCode = 409;
      throw err;
    }
    console.error('Erro ao registar aprovação de comunicação:', error);
    throw error;
  }

  return {
    ok: true,
    communication: data,
    context_fingerprint: fingerprint
  };
}

/**
 * Cancela uma comunicação comercial aprovada previamente.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} params
 * @param {string} params.adminUserId UUID do Admin autenticado (server-derived)
 * @param {string} params.communicationId UUID da comunicação aprovada
 * @param {Date|string} [params.now=new Date()]
 */
export async function cancelApprovedCommunication(supabaseClient, {
  adminUserId,
  communicationId,
  now = new Date()
}) {
  if (!supabaseClient) throw new Error('SupabaseClient é obrigatório em cancelApprovedCommunication');
  if (!adminUserId) throw new Error('adminUserId é obrigatório em cancelApprovedCommunication');
  if (!communicationId) throw new Error('communicationId é obrigatório em cancelApprovedCommunication');

  // Carregar registo existente
  const { data: existing, error: fetchErr } = await supabaseClient
    .from('approved_communications')
    .select('*')
    .eq('id', communicationId)
    .maybeSingle();

  if (fetchErr || !existing) {
    const err = new Error('Comunicação aprovada não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (existing.status === 'cancelled') {
    return {
      ok: true,
      communication: existing,
      already_cancelled: true
    };
  }

  const cancelDate = typeof now === 'string' ? new Date(now) : now;

  const { data: updated, error: updateErr } = await supabaseClient
    .from('approved_communications')
    .update({
      status: 'cancelled',
      cancelled_by: adminUserId,
      cancelled_at: cancelDate.toISOString()
    })
    .eq('id', communicationId)
    .select()
    .single();

  if (updateErr) {
    console.error('Erro ao cancelar comunicação aprovada:', updateErr);
    throw updateErr;
  }

  return {
    ok: true,
    communication: updated
  };
}

/**
 * Consulta em lote anti-N+1 de comunicações aprovadas ativas para múltiplos fingerprints.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Array<{ lead_id: string, context_fingerprint: string }>} fingerprintItems
 * @returns {Promise<Map<string, Object>>} Mapa de context_fingerprint -> comunicação aprovada ativa
 */
export async function bulkGetActiveApprovedCommunications(supabaseClient, fingerprintItems) {
  if (!supabaseClient) throw new Error('SupabaseClient é obrigatório');

  const resultMap = new Map();
  if (!Array.isArray(fingerprintItems) || fingerprintItems.length === 0) {
    return resultMap;
  }

  const leadIds = Array.from(new Set(fingerprintItems.map(item => item.lead_id).filter(Boolean)));
  const fingerprints = Array.from(new Set(fingerprintItems.map(item => item.context_fingerprint).filter(Boolean)));

  if (leadIds.length === 0 || fingerprints.length === 0) {
    return resultMap;
  }

  const { data: records, error } = await supabaseClient
    .from('approved_communications')
    .select('*, communication_dispatches (id, status, provider, provider_accepted_at, error_code, error_message, created_at)')
    .in('lead_id', leadIds)
    .in('context_fingerprint', fingerprints)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao consultar approved_communications:', error);
    throw error;
  }

  for (const record of (records || [])) {
    const fp = record.context_fingerprint;
    if (!resultMap.has(fp)) {
      resultMap.set(fp, record);
    }
  }

  return resultMap;
}
