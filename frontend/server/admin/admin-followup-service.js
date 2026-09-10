import { evaluateFollowUp, getLastCommercialInteractionAt } from './admin-followup-engine.js';
import { buildFollowUpContextFingerprint, bulkGetEffectiveFollowUpStates } from './admin-followup-state-service.js';
import { bulkGetActiveApprovedCommunications } from './admin-followup-approval-service.js';
import { bulkGetLeadCadenceReadModels } from './admin-followup-cadence-service.js';

/**
 * FASE 7G.1 — DB BATCH SERVICE FOR FOLLOW-UP RECOMMENDATIONS WITH STATE, APPROVED COMMUNICATIONS AND CADENCE READ MODEL
 *
 * Realiza uma consulta agregada anti-N+1 para obter leads, contextos, estados operacionais
 * de recomendação (ignored, snoozed, active), comunicações aprovadas ativas e cadence read models.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} [options]
 * @param {number} [options.limit=200] Limite de registos a processar
 * @param {boolean} [options.showBlocked=false] Se inclui leads bloqueadas na resposta
 * @param {Date|string} [options.now] Instante de referência para o motor
 */
export async function fetchFollowUpRecommendationsFromDatabase(supabaseClient, { limit = 200, showBlocked = false, now = new Date() } = {}) {
  if (!supabaseClient) {
    throw new Error('SupabaseClient é obrigatório em fetchFollowUpRecommendationsFromDatabase');
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const evaluationDate = typeof now === 'string' ? new Date(now) : now;

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

  const { data: rawLeads, count: totalCount, error } = await supabaseClient
    .from('leads')
    .select(selectQuery, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(parsedLimit);

  if (error) {
    console.error('Error fetching leads for follow-up evaluation:', error);
    throw error;
  }

  const leadIds = (rawLeads || []).map(l => l.id).filter(Boolean);
  const cadenceMap = await bulkGetLeadCadenceReadModels(supabaseClient, leadIds);

  const rawRecommendations = [];

  for (const rawLead of (rawLeads || [])) {
    const latestConv = (rawLead.conversations || []).sort((a, b) => {
      const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : (a.updated_at ? new Date(a.updated_at).getTime() : 0);
      const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : (b.updated_at ? new Date(b.updated_at).getTime() : 0);
      return bTime - aTime;
    })[0] || null;

    const context = {
      lead: {
        id: rawLead.id,
        name: rawLead.name,
        email: rawLead.email,
        need_description: rawLead.need_description,
        primary_service: rawLead.primary_service,
        pipeline_stage: rawLead.pipeline_stage,
        lead_classification: rawLead.lead_classification,
        last_interaction_at: rawLead.last_interaction_at,
        next_step: rawLead.next_step,
        created_at: rawLead.created_at,
        updated_at: rawLead.updated_at
      },
      latestConversation: latestConv,
      bookings: rawLead.calendar_bookings || [],
      tasks: rawLead.lead_tasks || [],
      cadenceReadModel: cadenceMap.get(rawLead.id) || null
    };

    const evalResult = evaluateFollowUp(context, evaluationDate);
    const lastCommercialInteraction = getLastCommercialInteractionAt(context);
    const displayName = rawLead.name || rawLead.email || 'Lead sem nome';

    const recommendationItem = {
      ...evalResult,
      lead_name: displayName,
      company_name: rawLead.company_name || null,
      pipeline_stage: rawLead.pipeline_stage || 'new',
      lead_classification: rawLead.lead_classification || 'potential',
      last_commercial_interaction_at: lastCommercialInteraction ? lastCommercialInteraction.toISOString() : null,
      _context: context
    };

    if (!recommendationItem.blocked || showBlocked) {
      rawRecommendations.push(recommendationItem);
    }
  }

  // 2. Consulta em Batch Anti-N+1 de Estados e Comunicações Aprovadas
  const fingerprintItems = rawRecommendations
    .filter(rec => rec.lead_id && rec.needs_follow_up && rec.reason_code)
    .map(rec => ({
      lead_id: rec.lead_id,
      context_fingerprint: buildFollowUpContextFingerprint(rec._context, rec)
    }));

  const [statesMap, approvalsMap] = await Promise.all([
    bulkGetEffectiveFollowUpStates(supabaseClient, fingerprintItems, evaluationDate),
    bulkGetActiveApprovedCommunications(supabaseClient, fingerprintItems)
  ]);

  const recommendations = rawRecommendations.map(rec => {
    const { _context, ...cleanRec } = rec;
    if (!cleanRec.lead_id || !cleanRec.needs_follow_up || !cleanRec.reason_code) {
      return {
        ...cleanRec,
        context_fingerprint: null,
        effective_state: 'active',
        snoozed_until: null,
        last_action: null,
        action_note: null,
        created_at_action: null,
        approved_communication: null
      };
    }

    const fp = buildFollowUpContextFingerprint(_context, rec);
    const stateInfo = statesMap.get(fp) || { effective_state: 'active', last_action: null, event: null };
    const activeApproval = approvalsMap.get(fp) || null;

    return {
      ...cleanRec,
      context_fingerprint: fp,
      effective_state: stateInfo.effective_state,
      snoozed_until: stateInfo.event?.snoozed_until || null,
      last_action: stateInfo.last_action,
      action_note: stateInfo.event?.note || null,
      created_at_action: stateInfo.event?.created_at || null,
      approved_communication: activeApproval ? {
        id: activeApproval.id,
        recipient_email: activeApproval.recipient_email,
        recipient_name: activeApproval.recipient_name,
        subject: activeApproval.subject,
        body: activeApproval.body,
        generation_source: activeApproval.generation_source,
        prompt_version: activeApproval.prompt_version,
        status: activeApproval.status,
        approved_at: activeApproval.approved_at,
        dispatches: activeApproval.communication_dispatches || []
      } : null
    };
  });

  const isTruncated = typeof totalCount === 'number' && totalCount > parsedLimit;

  return {
    ok: true,
    recommendations,
    total: totalCount || (rawLeads || []).length,
    limit: parsedLimit,
    truncated: isTruncated
  };
}
