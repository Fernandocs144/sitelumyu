import crypto from 'crypto';
import { getLastCommercialInteractionAt } from './admin-followup-engine.js';

/**
 * FASE 7C.1 — FOLLOW-UP RECOMMENDATION STATE SERVICE
 *
 * Serviço server-side para cálculo de Context Fingerprint, persistência append-only de ações
 * (ignored, snoozed, restored) e determinação de estado efetivo de recomendações.
 */

/**
 * Calcula deterministicamente o Context Fingerprint de uma recomendação.
 *
 * @param {Object} context Contexto completo da lead
 * @param {Object} recommendation Recomendação devolvida por evaluateFollowUp()
 * @returns {string} SHA-256 hex string (64 carateres)
 */
export function buildFollowUpContextFingerprint(context, recommendation) {
  if (!recommendation || !recommendation.lead_id) {
    throw new Error('Recomendação inválida em buildFollowUpContextFingerprint');
  }

  const leadId = recommendation.lead_id;
  const stage = context?.lead?.pipeline_stage || recommendation.pipeline_stage || 'new';
  const reasonCode = recommendation.reason_code || 'none';

  const lastCommercial = getLastCommercialInteractionAt(context);
  const lastCommercialIso = lastCommercial ? lastCommercial.toISOString() : 'none';

  let triggerEventRef = 'none';

  if (reasonCode === 'manual_task_due') {
    const overdueTask = (context?.tasks || []).find(t => {
      if (t.status !== 'open' || !t.due_at) return false;
      return new Date(t.due_at).getTime() <= (recommendation._evalDateMs || Date.now());
    }) || (context?.tasks || []).find(t => t.status === 'open' && t.due_at);
    if (overdueTask?.id) {
      triggerEventRef = `task:${overdueTask.id}`;
    }
  } else if (reasonCode === 'meeting_outcome_pending' || reasonCode === 'meeting_follow_up') {
    const relevantBooking = (context?.bookings || []).find(b => b.status === 'confirmed' || b.status === 'rescheduled');
    if (relevantBooking?.id) {
      triggerEventRef = `booking:${relevantBooking.id}`;
    }
  }

  const cadenceInstanceId = recommendation?.cadence?.instance_id || 'none';
  const attemptNum = recommendation?.cadence?.attempt_number !== null && recommendation?.cadence?.attempt_number !== undefined
    ? recommendation.cadence.attempt_number
    : 'none';

  const canonicalString = `${leadId}|${stage}|${reasonCode}|${lastCommercialIso}|${triggerEventRef}|${cadenceInstanceId}|${attemptNum}`;
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Determina o estado efetivo de um conjunto de fingerprints recorrendo à tabela append-only.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Array<{ lead_id: string, context_fingerprint: string }>} fingerprintItems
 * @param {Date|string} [nowRef=new Date()]
 * @returns {Promise<Map<string, Object>>} Mapa de context_fingerprint -> estado efetivo
 */
export async function bulkGetEffectiveFollowUpStates(supabaseClient, fingerprintItems, nowRef = new Date()) {
  if (!supabaseClient) {
    throw new Error('SupabaseClient é obrigatório em bulkGetEffectiveFollowUpStates');
  }

  const resultMap = new Map();
  if (!Array.isArray(fingerprintItems) || fingerprintItems.length === 0) {
    return resultMap;
  }

  const leadIds = Array.from(new Set(fingerprintItems.map(item => item.lead_id).filter(Boolean)));
  const fingerprints = Array.from(new Set(fingerprintItems.map(item => item.context_fingerprint).filter(Boolean)));

  if (leadIds.length === 0 || fingerprints.length === 0) {
    return resultMap;
  }

  const { data: events, error } = await supabaseClient
    .from('follow_up_recommendation_states')
    .select(`
      id,
      lead_id,
      reason_code,
      context_fingerprint,
      action,
      snoozed_until,
      note,
      created_by,
      created_at
    `)
    .in('lead_id', leadIds)
    .in('context_fingerprint', fingerprints)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao consultar follow_up_recommendation_states:', error);
    throw error;
  }

  // Agrupar eventos por context_fingerprint e escolher o último (ORDER BY created_at DESC, id DESC)
  const latestEventByFp = new Map();
  for (const event of (events || [])) {
    const fp = event.context_fingerprint;
    if (!latestEventByFp.has(fp)) {
      latestEventByFp.set(fp, event);
    } else {
      const existing = latestEventByFp.get(fp);
      const existingTime = new Date(existing.created_at).getTime();
      const eventTime = new Date(event.created_at).getTime();
      if (eventTime > existingTime || (eventTime === existingTime && event.id > existing.id)) {
        latestEventByFp.set(fp, event);
      }
    }
  }

  const nowMs = typeof nowRef === 'string' ? new Date(nowRef).getTime() : nowRef.getTime();

  for (const fp of fingerprints) {
    const latestEvent = latestEventByFp.get(fp);
    if (!latestEvent) {
      resultMap.set(fp, { effective_state: 'active', last_action: null, event: null });
      continue;
    }

    const { action, snoozed_until } = latestEvent;

    if (action === 'ignored') {
      resultMap.set(fp, { effective_state: 'ignored', last_action: 'ignored', event: latestEvent });
    } else if (action === 'snoozed') {
      const snoozedMs = snoozed_until ? new Date(snoozed_until).getTime() : 0;
      if (nowMs < snoozedMs) {
        resultMap.set(fp, { effective_state: 'snoozed', last_action: 'snoozed', event: latestEvent });
      } else {
        // Snooze expirado -> volta a ativo
        resultMap.set(fp, { effective_state: 'active', last_action: 'snoozed_expired', event: latestEvent });
      }
    } else if (action === 'restored') {
      resultMap.set(fp, { effective_state: 'active', last_action: 'restored', event: latestEvent });
    } else {
      resultMap.set(fp, { effective_state: 'active', last_action: null, event: null });
    }
  }

  return resultMap;
}

/**
 * Insere um novo evento de estado append-only em follow_up_recommendation_states.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} params
 * @param {string} params.adminUserId UUID do Admin autenticado (server-derived)
 * @param {string} params.leadId UUID da lead
 * @param {string} params.action "ignored" | "snoozed" | "restored"
 * @param {string} [params.snoozedUntil] ISO Timestamp (obrigatório se action === 'snoozed')
 * @param {string} [params.note] Justificação opcional
 * @param {Object} params.context Contexto factual da lead
 * @param {Object} params.recommendation Recomendação atual avaliada pelo Engine
 * @param {Date|string} [params.now=new Date()]
 */
export async function recordFollowUpStateAction(supabaseClient, {
  adminUserId,
  leadId,
  action,
  snoozedUntil = null,
  note = null,
  context,
  recommendation,
  now = new Date()
}) {
  if (!supabaseClient) throw new Error('SupabaseClient é obrigatório em recordFollowUpStateAction');
  if (!adminUserId) throw new Error('adminUserId é obrigatório em recordFollowUpStateAction');
  if (!leadId) throw new Error('leadId é obrigatório em recordFollowUpStateAction');

  if (!['ignored', 'snoozed', 'restored'].includes(action)) {
    const err = new Error(`Ação inválida "${action}". Deve ser 'ignored', 'snoozed' ou 'restored'.`);
    err.statusCode = 400;
    throw err;
  }

  const nowMs = typeof now === 'string' ? new Date(now).getTime() : now.getTime();

  if (action === 'snoozed') {
    if (!snoozedUntil) {
      const err = new Error('snoozed_until é obrigatório para a ação "snoozed"');
      err.statusCode = 400;
      throw err;
    }
    const snoozedDate = new Date(snoozedUntil);
    if (isNaN(snoozedDate.getTime())) {
      const err = new Error('snoozed_until deve ser um ISO Timestamp válido');
      err.statusCode = 400;
      throw err;
    }
    if (snoozedDate.getTime() <= nowMs) {
      const err = new Error('snoozed_until deve ser uma data no futuro');
      err.statusCode = 400;
      throw err;
    }
    const maxFutureMs = nowMs + (90 * 24 * 60 * 60 * 1000); // 90 dias
    if (snoozedDate.getTime() > maxFutureMs) {
      const err = new Error('snoozed_until não pode exceder 90 dias no futuro');
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (snoozedUntil !== null && snoozedUntil !== undefined) {
      const err = new Error('snoozed_until deve ser nulo para ações "ignored" ou "restored"');
      err.statusCode = 400;
      throw err;
    }
  }

  let sanitizedNote = null;
  if (typeof note === 'string' && note.trim().length > 0) {
    sanitizedNote = note.trim().replace(/<[^>]*>?/gm, '');
    if (sanitizedNote.length > 1000) {
      sanitizedNote = sanitizedNote.substring(0, 1000);
    }
  }

  const fingerprint = buildFollowUpContextFingerprint(context, recommendation);

  // Verificar estado atual para proibir transições inválidas (ex: active -> restored)
  const fpMap = await bulkGetEffectiveFollowUpStates(supabaseClient, [{ lead_id: leadId, context_fingerprint: fingerprint }], now);
  const currentStatus = fpMap.get(fingerprint);

  if (action === 'restored' && currentStatus?.effective_state === 'active') {
    const error = new Error('Recomendação já se encontra ativa');
    error.statusCode = 400;
    throw error;
  }

  const insertPayload = {
    lead_id: leadId,
    reason_code: recommendation.reason_code,
    context_fingerprint: fingerprint,
    action,
    snoozed_until: action === 'snoozed' ? new Date(snoozedUntil).toISOString() : null,
    note: sanitizedNote,
    created_by: adminUserId
  };

  const { data, error } = await supabaseClient
    .from('follow_up_recommendation_states')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Erro ao registar estado de follow-up:', error);
    throw error;
  }

  // Recalcular estado efetivo pós-inserção
  const postMap = await bulkGetEffectiveFollowUpStates(supabaseClient, [{ lead_id: leadId, context_fingerprint: fingerprint }], now);
  const updatedStatus = postMap.get(fingerprint);

  return {
    ok: true,
    event: data,
    context_fingerprint: fingerprint,
    effective_state: updatedStatus.effective_state
  };
}
