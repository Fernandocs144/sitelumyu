/**
 * Serviço server-side para agregação e consulta dos dados do Pipeline CRM (Fase 4A).
 * Executa exclusivamente no servidor utilizando o cliente Supabase com service_role.
 */

export const PIPELINE_STAGES = [
  'new',
  'qualified',
  'meeting_scheduled',
  'meeting_completed',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export const PIPELINE_STAGE_LABELS = {
  new: 'Novo',
  qualified: 'Qualificado',
  meeting_scheduled: 'Reunião Agendada',
  meeting_completed: 'Reunião Realizada',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
};

const SELECT_PIPELINE_FIELDS = [
  'id',
  'name',
  'email',
  'company_name',
  'primary_service',
  'service_variant',
  'lead_classification',
  'pipeline_stage',
  'next_step',
  'created_at',
  'updated_at',
].join(', ');

/**
 * Consulta e agrupa as leads por etapa do Pipeline Comercial (Kanban).
 * Aplica limites reais por etapa a nível de SQL e calcula os totais exatos por coluna.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {object} [params={}]
 * @param {number} [params.perStageLimit=100] - Limite máximo de leads por coluna no servidor.
 * @returns {Promise<{ ok: boolean, stages: Array, total: number }>}
 */
export async function fetchAdminPipelineFromDatabase(supabaseClient, params = {}) {
  const perStageLimit = params.perStageLimit && Number.isInteger(params.perStageLimit) && params.perStageLimit > 0
    ? params.perStageLimit
    : 100;

  // 1. Consultar contagem real por etapa na base de dados
  const { data: countData, error: countErr } = await supabaseClient
    .from('leads')
    .select('pipeline_stage');

  if (countErr) {
    throw new Error(`Erro ao consultar estatísticas do Pipeline: ${countErr.message}`);
  }

  const realCountsMap = {};
  for (const stageKey of PIPELINE_STAGES) {
    realCountsMap[stageKey] = 0;
  }
  for (const row of countData || []) {
    const stageKey = PIPELINE_STAGES.includes(row.pipeline_stage) ? row.pipeline_stage : 'new';
    realCountsMap[stageKey] = (realCountsMap[stageKey] || 0) + 1;
  }

  // 2. Para cada etapa, consultar até perStageLimit leads ordenadas server-side
  const stages = await Promise.all(
    PIPELINE_STAGES.map(async (stageKey) => {
      const { data: stageLeads, error: leadsErr } = await supabaseClient
        .from('leads')
        .select(SELECT_PIPELINE_FIELDS)
        .eq('pipeline_stage', stageKey)
        .order('updated_at', { ascending: false })
        .limit(perStageLimit);

      if (leadsErr) {
        throw new Error(`Erro ao consultar leads da etapa ${stageKey}: ${leadsErr.message}`);
      }

      return {
        key: stageKey,
        label: PIPELINE_STAGE_LABELS[stageKey] || stageKey,
        count: realCountsMap[stageKey] || 0,
        leads: stageLeads || [],
      };
    })
  );

  const total = (countData || []).length;

  return {
    ok: true,
    stages,
    total,
  };
}
