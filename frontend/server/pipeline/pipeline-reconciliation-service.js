/**
 * Módulo de Serviço de Integridade e Reconciliação do Funil Comercial (Pipeline CRM) do LUMYO (Fase 3C).
 * Responsável por detetar e reparar atómicamente inconsistências em leads (ex.: histórico inicial ausente, qualificação não refletida).
 */

import {
  initializeLeadPipelineHistory,
  transitionLeadPipelineStage,
  isValidUuid,
} from './pipeline-service.js';

/**
 * Reconcilia a integridade do pipeline de um lead específico.
 *
 * @param {object} params
 * @param {object} params.supabase - Cliente Supabase configurado server-side com service_role.
 * @param {string} params.leadId - ID (UUID) do lead.
 * @returns {Promise<{ ok: boolean, lead_id: string, repaired: boolean, repairs: string[] }>}
 */
export async function reconcileLeadPipeline({ supabase, leadId }) {
  if (!supabase) {
    const err = new Error('Cliente Supabase não fornecido ao serviço de reconciliação de pipeline');
    err.statusCode = 500;
    throw err;
  }

  if (!leadId || !isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  // 1. Obter o estado atual do lead em public.leads
  const { data: leadRec, error: leadErr } = await supabase
    .from('leads')
    .select('id, pipeline_stage, lead_classification')
    .eq('id', leadId)
    .single();

  if (leadErr || !leadRec) {
    const err = new Error('Lead não encontrado para reconciliação');
    err.statusCode = 404;
    throw err;
  }

  const repairs = [];

  // 2. Inconsistência A: Verificar se o histórico inicial (from_stage IS NULL) está ausente
  const { data: initialHist } = await supabase
    .from('pipeline_stage_history')
    .select('id')
    .eq('lead_id', leadId)
    .is('from_stage', null)
    .maybeSingle();

  if (!initialHist) {
    // Reparar Inconsistência A: Inserir histórico inicial snapshot (from_stage = NULL, to_stage = lead.pipeline_stage, source = 'system')
    await initializeLeadPipelineHistory({
      supabase,
      leadId,
      source: 'system',
    });
    repairs.push('initial_history_created');
  }

  // 3. Re-obter o estado atualizado do lead após eventual inicialização do histórico
  const { data: freshLead } = await supabase
    .from('leads')
    .select('pipeline_stage, lead_classification')
    .eq('id', leadId)
    .single();

  const currentStage = freshLead?.pipeline_stage || leadRec.pipeline_stage;
  const currentClassification = freshLead?.lead_classification || leadRec.lead_classification;

  // 4. Inconsistência B: Qualificação positiva (priority/qualified) em pipeline_stage = 'new' não refletida
  if (currentStage === 'new' && ['priority', 'qualified'].includes(currentClassification)) {
    await transitionLeadPipelineStage({
      supabase,
      leadId,
      toStage: 'qualified',
      source: 'system',
      changedBy: null,
      allowedFromStages: ['new'],
    });
    repairs.push('promoted_to_qualified');
  }

  return {
    ok: true,
    lead_id: leadId,
    repaired: repairs.length > 0,
    repairs,
  };
}

/**
 * Reconcilia a integridade do pipeline de um conjunto de leads.
 *
 * @param {object} params
 * @param {object} params.supabase - Cliente Supabase configurado server-side com service_role.
 * @param {number} [params.limit=100] - Limite de leads a processar por lote.
 * @returns {Promise<{ ok: boolean, processed: number, repaired_count: number, results: Array }>}
 */
export async function reconcileAllLeadsPipeline({ supabase, limit = 100 }) {
  if (!supabase) {
    const err = new Error('Cliente Supabase não fornecido ao serviço de reconciliação de pipeline');
    err.statusCode = 500;
    throw err;
  }

  const { data: leads, error: fetchErr } = await supabase
    .from('leads')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchErr) {
    throw new Error(`Erro ao carregar leads para reconciliação: ${fetchErr.message}`);
  }

  const results = [];
  let repairedCount = 0;

  for (const lead of leads || []) {
    const res = await reconcileLeadPipeline({ supabase, leadId: lead.id });
    results.push(res);
    if (res.repaired) {
      repairedCount++;
    }
  }

  return {
    ok: true,
    processed: results.length,
    repaired_count: repairedCount,
    results,
  };
}
