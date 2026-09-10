import { evaluateFollowUp } from './admin-followup-engine.js';

/**
 * FASE 7G.1 — CADENCE READ MODEL SERVICE
 *
 * Read model server-side para agregação anti-N+1 de estado factual de cadência.
 * Consulta factualidade em lote (bulk) e deriva accepted_attempts, last_accepted_at
 * e bloqueios transversais de disparos em estado 'unknown'.
 */

/**
 * Consulta em lote (bulk anti-N+1) o modelo de leitura de cadência para um conjunto de leads.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Array<string>} leadIds Lista de UUIDs de leads
 * @returns {Promise<Map<string, Object>>} Mapa de leadId -> CadenceReadModel
 */
export async function bulkGetLeadCadenceReadModels(supabaseClient, leadIds) {
  const resultMap = new Map();
  if (!supabaseClient || !Array.isArray(leadIds) || leadIds.length === 0) {
    return resultMap;
  }

  const cleanLeadIds = Array.from(new Set(leadIds.filter(Boolean)));
  if (cleanLeadIds.length === 0) {
    return resultMap;
  }

  // 1. Obter a instância ativa de cadência (pipeline_stage_history mais recente) para cada lead
  const { data: stageHistories, error: stageErr } = await supabaseClient
    .from('pipeline_stage_history')
    .select('id, lead_id, to_stage, changed_at')
    .in('lead_id', cleanLeadIds)
    .order('changed_at', { ascending: false });

  if (stageErr) {
    console.error('Erro ao consultar pipeline_stage_history em bulkGetLeadCadenceReadModels:', stageErr);
    throw stageErr;
  }

  // Mapear lead_id -> active_cadence_instance_id (primeiro registo visto devido a ORDER BY changed_at DESC)
  const activeInstanceByLead = new Map();
  for (const row of (stageHistories || [])) {
    if (!activeInstanceByLead.has(row.lead_id)) {
      activeInstanceByLead.set(row.lead_id, row.id);
    }
  }

  // 2. Obter comunicações aprovadas e seus disparos aceites/unknown para as leads
  const { data: commsData, error: commsErr } = await supabaseClient
    .from('approved_communications')
    .select(`
      id,
      lead_id,
      cadence_instance_id,
      communication_dispatches (
        id,
        status,
        provider_accepted_at,
        created_at
      )
    `)
    .in('lead_id', cleanLeadIds);

  if (commsErr) {
    console.error('Erro ao consultar approved_communications em bulkGetLeadCadenceReadModels:', commsErr);
    throw commsErr;
  }

  // Agrupar e processar factualidade por lead
  const commsByLead = new Map();
  for (const comm of (commsData || [])) {
    const list = commsByLead.get(comm.lead_id) || [];
    list.push(comm);
    commsByLead.set(comm.lead_id, list);
  }

  for (const leadId of cleanLeadIds) {
    const activeInstanceId = activeInstanceByLead.get(leadId) || null;
    const leadComms = commsByLead.get(leadId) || [];

    // Detetar se existe ALGUM disparo em estado 'unknown' para esta lead (Cross-Approval Barrier)
    let hasUnknownDispatch = false;
    const acceptedCommsForInstance = new Set();
    let maxAcceptedAtMs = 0;

    for (const comm of leadComms) {
      const dispatches = comm.communication_dispatches || [];
      for (const d of dispatches) {
        if (d.status === 'unknown') {
          hasUnknownDispatch = true;
        }
        if (activeInstanceId && comm.cadence_instance_id === activeInstanceId && d.status === 'accepted') {
          acceptedCommsForInstance.add(comm.id);
          if (d.provider_accepted_at) {
            const t = new Date(d.provider_accepted_at).getTime();
            if (!isNaN(t) && t > maxAcceptedAtMs) {
              maxAcceptedAtMs = t;
            }
          }
        }
      }
    }

    resultMap.set(leadId, {
      cadence_instance_id: activeInstanceId,
      accepted_attempts: acceptedCommsForInstance.size,
      last_accepted_at: maxAcceptedAtMs > 0 ? new Date(maxAcceptedAtMs).toISOString() : null,
      has_unknown_dispatch: hasUnknownDispatch
    });
  }

  return resultMap;
}

/**
 * Consulta de conveniência para obter o Cadence Read Model de uma única lead.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} leadId UUID da lead
 * @returns {Promise<Object>} CadenceReadModel
 */
export async function getLeadCadenceReadModel(supabaseClient, leadId) {
  if (!leadId) return { cadence_instance_id: null, accepted_attempts: 0, last_accepted_at: null, has_unknown_dispatch: false };
  const map = await bulkGetLeadCadenceReadModels(supabaseClient, [leadId]);
  return map.get(leadId) || { cadence_instance_id: null, accepted_attempts: 0, last_accepted_at: null, has_unknown_dispatch: false };
}
