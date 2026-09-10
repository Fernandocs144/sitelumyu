import OpenAI from 'openai';
import { evaluateFollowUp } from './admin-followup-engine.js';
import { buildFollowUpContextFingerprint, bulkGetEffectiveFollowUpStates } from './admin-followup-state-service.js';
import { getLeadCadenceReadModel } from './admin-followup-cadence-service.js';
import {
  FOLLOW_UP_DRAFT_PROMPT_VERSION,
  SYSTEM_INSTRUCTIONS,
  buildFollowUpDraftContext
} from './admin-followup-draft-prompt.js';

/**
 * Rascunho de fallback determinístico quando a chamada à API externa não está disponível.
 */
function generateFallbackDraft(context, recommendation) {
  const lead = context?.lead || {};
  const name = lead.name ? lead.name.split(' ')[0] : 'Olá';
  const company = lead.company_name ? ` para a ${lead.company_name}` : '';
  const service = lead.primary_service ? ` sobre o projeto de ${lead.primary_service}` : '';
  const reasonCode = recommendation?.reason_code || 'geral';

  let subject = `Acompanhamento do projeto - Lumyo`;
  let message = '';

  switch (reasonCode) {
    case 'meeting_outcome_pending':
      subject = `Confirmação de reunião - Lumyo`;
      message = `Olá ${name},\n\nTínhamos uma conversa agendada recentemente e gostaria de confirmar se conseguiram falar ou se prefere reagendar para outro momento conveniente${company}.\n\nFico a aguardar a sua indicação.\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'meeting_follow_up':
      subject = `Seguimento da reunião - Lumyo`;
      message = `Olá ${name},\n\nEspero que se encontre bem. Na sequência da nossa reunião realizada recente${service}, gostaria de saber se ficou com alguma dúvida ou se deseja avançar para os próximos passos.\n\nFico à disposição.\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'proposal_pending':
      subject = `Proposta comercial - Lumyo`;
      message = `Olá ${name},\n\nEspero que esteja a ter uma boa semana. Gostaria de saber se teve oportunidade de analisar a nossa proposta para o projeto${service}.\n\nEstou disponível para esclarecer qualquer questão ou ajustar detalhes.\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'negotiation_stale':
      subject = `Ponto de situação do projeto - Lumyo`;
      message = `Olá ${name},\n\nGostaria de retomar o nosso contacto relativamente à negociação em curso${service}${company}.\n\nConseguimos ajudar a esclarecer algum ponto pendente para avançarmos?\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'stale_qualified_lead':
      subject = `Avançar com o projeto - Lumyo`;
      message = `Olá ${name},\n\nEntro em contacto para saber se gostaria de agendar uma breve conversa para analisar as necessidades do seu projeto${service}${company}.\n\nQual a sua disponibilidade nesta semana?\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'manual_task_due':
      subject = `Acompanhamento do projeto - Lumyo`;
      message = `Olá ${name},\n\nEntro em contacto no seguimento do seu pedido de informação sobre o projeto${service}${company}.\n\nFico ao dispor para esclarecer qualquer dúvida.\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;

    case 'no_response':
    case 'new_lead_stale':
    default:
      subject = `O seu projeto com a Lumyo`;
      message = `Olá ${name},\n\nEspero que se encontre bem. Entro em contacto para acompanhar o seu pedido de informação relativamente aos nossos serviços${service}.\n\nComo podemos ajudar nesta fase?\n\nCom os melhores cumprimentos,\nEquipa Lumyo`;
      break;
  }

  return {
    subject,
    message,
    generation_source: 'fallback'
  };
}

/**
 * FASE 7B.1 & 7C.1 & 7E.1 — FOLLOW-UP DRAFT ASSISTANT SERVICE
 *
 * Gera um rascunho de mensagem comercial utilizando a OpenAI com indicação explícita da origem (ai | fallback),
 * validação estrita de contexto factual, rejeição de tarefas/ações internas e RESPEITO PELO ESTADO DA RECOMENDAÇÃO (ignored / snoozed).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} params
 * @param {string} params.leadId ID da lead a analisar
 * @param {Date|string} [params.now] Instante de referência para o motor
 * @returns {Promise<Object>} Rascunho gerado e metadados
 */
export async function generateFollowUpDraft(supabaseClient, { leadId, now = new Date() } = {}) {
  if (!supabaseClient) {
    throw new Error('SupabaseClient é obrigatório em generateFollowUpDraft');
  }

  if (!leadId) {
    const err = new Error('leadId é obrigatório em generateFollowUpDraft');
    err.statusCode = 400;
    throw err;
  }

  const evaluationDate = typeof now === 'string' ? new Date(now) : now;

  // 1. Carregar contexto completo da lead na base de dados
  const selectQuery = `
    id,
    name,
    email,
    company_name,
    language,
    primary_service,
    need_description,
    timeline,
    intent_level,
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

  const { data: rawLead, error } = await supabaseClient
    .from('leads')
    .select(selectQuery)
    .eq('id', leadId)
    .maybeSingle();

  if (error) {
    console.error(`Erro ao carregar lead ${leadId} para geração de rascunho:`, error);
    throw error;
  }

  if (!rawLead) {
    const err = new Error(`Lead ${leadId} não encontrada`);
    err.statusCode = 404;
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
      language: rawLead.language,
      primary_service: rawLead.primary_service,
      need_description: rawLead.need_description,
      timeline: rawLead.timeline,
      intent_level: rawLead.intent_level,
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

  // 2. REAVALIAÇÃO SERVER-SIDE: Confirmar elegibilidade com o Follow-Up Engine (7G.1 Cadence-Aware)
  const recommendation = evaluateFollowUp(context, evaluationDate);

  if (recommendation.blocked) {
    const err = new Error(`Geração de rascunho rejeitada: Lead está bloqueada (${recommendation.blocked_reason})`);
    err.statusCode = 422;
    err.blocked_reason = recommendation.blocked_reason;
    throw err;
  }

  if (!recommendation.needs_follow_up || !recommendation.reason_code) {
    const err = new Error('Esta lead não possui uma recomendação de follow-up ativa no momento.');
    err.statusCode = 422;
    throw err;
  }

  // 2.1 ELEGIBILIDADE DE CONTACTO EXTERNO (Fase 7E.1 Hardening)
  if (recommendation.contact_eligible !== true) {
    const err = new Error(`Geração de rascunho rejeitada: Recomendação com tipo de ação '${recommendation.action_type || 'não elegível'}' não permite contacto externo.`);
    err.statusCode = 422;
    err.contact_eligible = false;
    err.action_type = recommendation.action_type;
    throw err;
  }

  // 2.2 VERIFICAÇÃO DO ESTADO DA RECOMENDAÇÃO (Fase 7C.1 Hardening)
  if (recommendation.needs_follow_up && recommendation.reason_code) {
    const fingerprint = buildFollowUpContextFingerprint(context, recommendation);
    const statesMap = await bulkGetEffectiveFollowUpStates(supabaseClient, [{ lead_id: leadId, context_fingerprint: fingerprint }], evaluationDate);
    const stateInfo = statesMap.get(fingerprint);

    if (stateInfo?.effective_state === 'ignored') {
      const err = new Error('Esta recomendação está ignorada.');
      err.statusCode = 422;
      err.effective_state = 'ignored';
      throw err;
    }

    if (stateInfo?.effective_state === 'snoozed') {
      const snoozedUntilStr = stateInfo.event?.snoozed_until ? new Date(stateInfo.event.snoozed_until).toLocaleString('pt-PT') : '';
      const err = new Error(`Esta recomendação está adiada${snoozedUntilStr ? ` até ${snoozedUntilStr}` : ''}.`);
      err.statusCode = 422;
      err.effective_state = 'snoozed';
      err.snoozed_until = stateInfo.event?.snoozed_until;
      throw err;
    }
  }

  // 3. HARDENING MANUAL_TASK_DUE: Tarefas internas sem contexto externo NÃO geram rascunho
  if (recommendation.reason_code === 'manual_task_due') {
    const hasExternalContext = Boolean(
      (latestConv && Array.isArray(latestConv.messages) && latestConv.messages.length > 0) ||
      rawLead.need_description ||
      rawLead.primary_service ||
      rawLead.last_interaction_at
    );

    if (!hasExternalContext) {
      const err = new Error('Esta recomendação resulta de uma tarefa interna e não contém contexto suficiente para gerar uma comunicação ao cliente.');
      err.statusCode = 422;
      err.insufficient_context = true;
      throw err;
    }
  }

  // 4. Construção do prompt e invocação da OpenAI (com fallback transparente)
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    const fallbackDraft = generateFallbackDraft(context, recommendation);
    return {
      ok: true,
      draft: fallbackDraft,
      recommendation,
      prompt_version: FOLLOW_UP_DRAFT_PROMPT_VERSION
    };
  }

  const openai = new OpenAI({ apiKey, timeout: 15000, maxRetries: 1 });
  const formattedContext = buildFollowUpDraftContext(context, recommendation);

  let rawOutput = '';
  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: formattedContext }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 600
    });

    rawOutput = completion.choices[0]?.message?.content || '';
  } catch (apiErr) {
    console.warn('Invocação remota da OpenAI indisponível/restringida, a utilizar rascunho de fallback contextualizado:', apiErr.message);
    const fallbackDraft = generateFallbackDraft(context, recommendation);
    return {
      ok: true,
      draft: fallbackDraft,
      recommendation,
      prompt_version: FOLLOW_UP_DRAFT_PROMPT_VERSION
    };
  }

  // 5. Validação estrita do JSON retornado pelo modelo
  let parsedDraft = null;
  try {
    parsedDraft = JSON.parse(rawOutput);
  } catch (parseErr) {
    console.error('Erro ao analisar JSON retornado da OpenAI, a utilizar fallback:', rawOutput);
    const fallbackDraft = generateFallbackDraft(context, recommendation);
    return {
      ok: true,
      draft: fallbackDraft,
      recommendation,
      prompt_version: FOLLOW_UP_DRAFT_PROMPT_VERSION
    };
  }

  const subject = typeof parsedDraft.subject === 'string' && parsedDraft.subject.trim()
    ? parsedDraft.subject.trim()
    : null;

  const message = typeof parsedDraft.message === 'string' && parsedDraft.message.trim()
    ? parsedDraft.message.trim()
    : null;

  if (!message) {
    const fallbackDraft = generateFallbackDraft(context, recommendation);
    return {
      ok: true,
      draft: fallbackDraft,
      recommendation,
      prompt_version: FOLLOW_UP_DRAFT_PROMPT_VERSION
    };
  }

  return {
    ok: true,
    draft: {
      subject,
      message,
      generation_source: 'ai'
    },
    recommendation,
    prompt_version: FOLLOW_UP_DRAFT_PROMPT_VERSION
  };
}
