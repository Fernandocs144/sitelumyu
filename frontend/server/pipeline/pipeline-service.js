/**
 * Módulo de Serviço Central do Funil Comercial (Pipeline CRM) do LUMYO.
 * Responsável pela transição atómica de etapas (pipeline_stage) e registo consistente do histórico.
 */

export const ALLOWED_PIPELINE_STAGES = [
  'new',
  'qualified',
  'meeting_scheduled',
  'meeting_completed',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export const ALLOWED_PIPELINE_SOURCES = [
  'agent',
  'calendar_webhook',
  'admin_user',
  'system',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(uuidStr) {
  if (!uuidStr || typeof uuidStr !== 'string') return false;
  return UUID_REGEX.test(uuidStr.trim());
}

/**
 * Transita atómicamente a etapa (pipeline_stage) de um lead e regista o respetivo histórico.
 *
 * @param {object} params
 * @param {object} params.supabase - Cliente Supabase configurado server-side com service_role.
 * @param {string} params.leadId - ID (UUID) do lead.
 * @param {string} params.toStage - Etapa de destino (new, qualified, meeting_scheduled, etc.).
 * @param {string} params.source - Origem da transição (agent, calendar_webhook, admin_user, system).
 * @param {string|null} [params.changedBy=null] - UUID do utilizador admin (obrigatório se source = admin_user).
 * @returns {Promise<{ ok: boolean, changed: boolean, from_stage: string, to_stage: string, lead: object }>}
 */
export async function transitionLeadPipelineStage({
  supabase,
  leadId,
  toStage,
  source,
  changedBy = null,
  allowedFromStages = null,
}) {
  if (!supabase) {
    const err = new Error('Cliente Supabase não fornecido ao serviço de pipeline');
    err.statusCode = 500;
    throw err;
  }

  // 1. Validação de ID do Lead
  if (!leadId || !isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  // 2. Validação da etapa de destino
  if (!toStage || !ALLOWED_PIPELINE_STAGES.includes(toStage)) {
    const err = new Error(`Etapa de pipeline inválida: ${toStage}`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Validação da origem da transição
  if (!source || !ALLOWED_PIPELINE_SOURCES.includes(source)) {
    const err = new Error(`Origem de transição inválida: ${source}`);
    err.statusCode = 400;
    throw err;
  }

  // 4. Validação estrita de changedBy conforme o source
  if (source === 'admin_user') {
    if (!changedBy || !isValidUuid(changedBy)) {
      const err = new Error('changed_by é obrigatório e deve ser um UUID válido para source admin_user');
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (changedBy !== null && changedBy !== undefined) {
      const err = new Error('changed_by deve ser null/undefined para origens diferentes de admin_user');
      err.statusCode = 400;
      throw err;
    }
  }

  // 5. Validação de allowedFromStages se fornecido
  if (allowedFromStages !== null && allowedFromStages !== undefined) {
    if (!Array.isArray(allowedFromStages) || allowedFromStages.some(s => !ALLOWED_PIPELINE_STAGES.includes(s))) {
      const err = new Error('allowedFromStages deve ser um array contendo apenas etapas de pipeline válidas');
      err.statusCode = 400;
      throw err;
    }
  }

  // 6. Execução atómica via RPC PL/pgSQL com locking FOR UPDATE e guard p_allowed_from_stages
  const { data, error } = await supabase.rpc('transition_lead_pipeline_stage', {
    p_lead_id: leadId,
    p_to_stage: toStage,
    p_source: source,
    p_changed_by: changedBy || null,
    p_allowed_from_stages: allowedFromStages || null,
  });

  if (error) {
    const errMsg = error.message || '';

    if (errMsg.includes('LEAD_NOT_FOUND')) {
      const err = new Error('Lead não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (errMsg.includes('INVALID_PIPELINE_STAGE') || errMsg.includes('INVALID_ALLOWED_FROM_STAGE')) {
      const err = new Error('Etapa de pipeline inválida');
      err.statusCode = 400;
      throw err;
    }

    if (errMsg.includes('INVALID_PIPELINE_SOURCE')) {
      const err = new Error('Origem de transição inválida');
      err.statusCode = 400;
      throw err;
    }

    if (errMsg.includes('CHANGED_BY_REQUIRED_FOR_ADMIN_USER') || errMsg.includes('CHANGED_BY_MUST_BE_NULL')) {
      const err = new Error('Inconsistência no parâmetro changed_by para a origem especificada');
      err.statusCode = 400;
      throw err;
    }

    const err = new Error('Erro ao processar transição de pipeline na base de dados');
    err.statusCode = 500;
    throw err;
  }

  return data;
}

/**
 * Inicializa o registo inicial do histórico de pipeline (from_stage = NULL, to_stage = stage_atual)
 * para novas leads de forma atómica e idempotente.
 *
 * @param {object} params
 * @param {object} params.supabase - Cliente Supabase configurado server-side com service_role.
 * @param {string} params.leadId - ID (UUID) do lead.
 * @param {string} [params.source='agent'] - Origem da criação da lead.
 * @returns {Promise<{ ok: boolean }>}
 */
export async function initializeLeadPipelineHistory({
  supabase,
  leadId,
  source = 'agent',
}) {
  if (!supabase) {
    const err = new Error('Cliente Supabase não fornecido ao serviço de pipeline');
    err.statusCode = 500;
    throw err;
  }

  if (!leadId || !isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!source || !ALLOWED_PIPELINE_SOURCES.includes(source)) {
    const err = new Error(`Origem de inicialização inválida: ${source}`);
    err.statusCode = 400;
    throw err;
  }

  const { error } = await supabase.rpc('initialize_lead_pipeline_history', {
    p_lead_id: leadId,
    p_source: source,
  });

  if (error) {
    const errMsg = error.message || '';
    if (errMsg.includes('LEAD_NOT_FOUND')) {
      const err = new Error('Lead não encontrado');
      err.statusCode = 404;
      throw err;
    }
    const err = new Error(`Erro ao inicializar histórico de pipeline do lead: ${errMsg}`);
    err.statusCode = 500;
    throw err;
  }

  return { ok: true };
}
