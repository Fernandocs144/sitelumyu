/**
 * Motor determinístico puro para o cálculo do próximo objetivo comercial da conversa.
 * Função pura e síncrona sem dependências externas (sem BD, sem OpenAI, sem I/O, sem efeitos secundários).
 */

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_WEBSITE_VARIANTS = [
  'landing_page',
  'institutional_website',
  'custom_website',
  'ecommerce',
];

function isValidName(val) {
  return typeof val === 'string' && val.trim().length >= 1;
}

function isValidEmail(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim().toLowerCase();
  if (trimmed.length < 1 || trimmed.length > 200) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidWebsiteUrl(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length < 1 || trimmed.length > 250) return false;
  try {
    const parsedUrl = new URL(trimmed);
    return (
      (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
      Boolean(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
}

export function isLeadQualificationComplete(leadData) {
  if (!leadData || typeof leadData !== 'object' || Array.isArray(leadData)) {
    return false;
  }

  const primaryService = typeof leadData.primary_service === 'string' ? leadData.primary_service : null;
  if (!primaryService || !ALLOWED_SERVICES.includes(primaryService)) {
    return false;
  }

  const needDesc = typeof leadData.need_description === 'string' ? leadData.need_description.trim() : '';
  if (!needDesc) {
    return false;
  }

  const companyName = typeof leadData.company_name === 'string' ? leadData.company_name.trim() : '';
  const companyActivity = typeof leadData.company_activity === 'string' ? leadData.company_activity.trim() : '';
  const targetAudience = typeof leadData.target_audience === 'string' ? leadData.target_audience.trim() : '';
  const operationalImpact = typeof leadData.operational_impact === 'string' ? leadData.operational_impact.trim() : '';
  if (!companyName || !companyActivity || !targetAudience || !operationalImpact) {
    return false;
  }

  if (primaryService === 'websites') {
    const serviceVariant = typeof leadData.service_variant === 'string' ? leadData.service_variant : null;
    if (!serviceVariant || !ALLOWED_WEBSITE_VARIANTS.includes(serviceVariant)) {
      return false;
    }

    const hasWebsiteStatus = typeof leadData.has_existing_website === 'boolean' || isValidWebsiteUrl(leadData.website_url);
    if (!hasWebsiteStatus) {
      return false;
    }
  }

  const timeline = typeof leadData.timeline === 'string' ? leadData.timeline.trim() : '';
  if (!timeline) {
    return false;
  }

  const hasName = isValidName(leadData.name);
  const hasEmail = isValidEmail(leadData.email);
  if (!hasName || !hasEmail) {
    return false;
  }

  const statedBudgetRaw = typeof leadData.stated_budget_raw === 'string' ? leadData.stated_budget_raw.trim() : '';
  if (!statedBudgetRaw) {
    return false;
  }

  return true;
}

/**
 * Calcula o próximo objetivo comercial com base nos dados consolidados da lead.
 *
 * @param {Object|null|undefined} leadData Objeto consolidado da lead.
 * @returns {{ goal: string, reason: string }} Objeto com o goal e a reason determinísticos.
 */
export function calculateNextCommercialGoal(leadData, options = {}) {
  const data = (leadData && typeof leadData === 'object' && !Array.isArray(leadData))
    ? leadData
    : {};

  const turnIntent = typeof options.turnIntent === 'string'
    ? options.turnIntent
    : (typeof data.turn_intent === 'string' ? data.turn_intent : null);

  // 1. ESTADOS COMERCIAIS JÁ ATIVOS (Precedência sobre qualificação pendente)
  const nextStep = typeof data.next_step === 'string' ? data.next_step : null;
  const intentLevel = typeof data.intent_level === 'string' ? data.intent_level : null;
  const meetingSignal = typeof data.meeting_intent_signal === 'string' ? data.meeting_intent_signal : null;

  // Uma necessidade possivelmente separada tem de ser esclarecida antes de
  // retomar o estado comercial do projeto atual, incluindo booking_pending.
  if (turnIntent === 'possible_new_project') {
    return {
      goal: 'clarify_project_scope',
      reason: 'possible_new_project_requires_confirmation',
    };
  }

  if (nextStep === 'human_contact_requested') {
    return {
      goal: 'human_contact_requested',
      reason: 'human_contact_pending',
    };
  }

  if (nextStep === 'booking_pending') {
    const turnIntentRequiresResponse = [
      'direct_question',
      'correction',
      'scope_change',
      'possible_new_project',
    ].includes(turnIntent);

    if (turnIntentRequiresResponse) {
      return {
        goal: 'answer_turn_intent',
        reason: 'booking_pending_requires_response',
      };
    }

    if (isLeadQualificationComplete(data)) {
      return {
        goal: 'show_booking',
        reason: 'booking_pending',
      };
    }
    // Se a qualificação estiver incompleta, continuar a qualificação antes de show_booking!
  }

  if (nextStep === 'follow_up_later') {
    if (intentLevel === 'low' || meetingSignal === 'declined') {
      return {
        goal: 'no_commercial_action',
        reason: 'meeting_declined_or_closed',
      };
    }
    return {
      goal: 'follow_up_later',
      reason: 'visitor_considering',
    };
  }

  // 2. SERVIÇO PRINCIPAL
  const primaryService = typeof data.primary_service === 'string' ? data.primary_service : null;
  if (!primaryService || !ALLOWED_SERVICES.includes(primaryService)) {
    return {
      goal: 'identify_service',
      reason: 'service_missing',
    };
  }

  // 3. NECESSIDADE CONCRETA
  const needDesc = typeof data.need_description === 'string' ? data.need_description.trim() : '';
  if (!needDesc) {
    return {
      goal: 'clarify_need',
      reason: 'concrete_need_missing',
    };
  }

  // 4. VARIANTE DE WEBSITE E EXISTÊNCIA DE WEBSITE (Apenas para o serviço 'websites')
  if (primaryService === 'websites') {
    const serviceVariant = typeof data.service_variant === 'string' ? data.service_variant : null;
    if (!serviceVariant || !ALLOWED_WEBSITE_VARIANTS.includes(serviceVariant)) {
      return {
        goal: 'identify_website_variant',
        reason: 'website_variant_missing',
      };
    }

    const hasWebsiteStatus = typeof data.has_existing_website === 'boolean' || isValidWebsiteUrl(data.website_url);
    if (!hasWebsiteStatus) {
      return {
        goal: 'ask_existing_website',
        reason: 'existing_website_status_missing',
      };
    }
  }

  // 5. CONTEXTO DA EMPRESA E RESULTADO DE NEGÓCIO
  const companyName = typeof data.company_name === 'string' ? data.company_name.trim() : '';
  const companyActivity = typeof data.company_activity === 'string' ? data.company_activity.trim() : '';
  if (!companyName && !companyActivity) {
    return {
      goal: 'ask_company_context',
      reason: 'company_name_and_activity_missing',
    };
  }
  if (!companyName) {
    return {
      goal: 'ask_company_name',
      reason: 'company_name_missing',
    };
  }
  if (!companyActivity) {
    return {
      goal: 'ask_company_activity',
      reason: 'company_activity_missing',
    };
  }

  const targetAudience = typeof data.target_audience === 'string' ? data.target_audience.trim() : '';
  if (!targetAudience) {
    return {
      goal: 'ask_target_audience',
      reason: 'target_audience_missing',
    };
  }

  const operationalImpact = typeof data.operational_impact === 'string' ? data.operational_impact.trim() : '';
  if (!operationalImpact) {
    if (primaryService === 'automation') {
      return {
        goal: 'ask_automation_context',
        reason: 'automation_context_missing',
      };
    }
    return {
      goal: 'ask_operational_impact',
      reason: 'operational_impact_missing',
    };
  }

  // 6. PRAZO DE LANÇAMENTO
  const timeline = typeof data.timeline === 'string' ? data.timeline.trim() : '';
  if (!timeline) {
    return {
      goal: 'ask_timeline',
      reason: 'timeline_missing',
    };
  }

  // 7. CONTACTO (NOME E EMAIL)
  const hasName = isValidName(data.name);
  const hasEmail = isValidEmail(data.email);

  if (!hasName && !hasEmail) {
    return {
      goal: 'ask_contact',
      reason: 'name_and_email_missing',
    };
  }

  if (!hasName && hasEmail) {
    return {
      goal: 'ask_name',
      reason: 'name_missing',
    };
  }

  if (hasName && !hasEmail) {
    return {
      goal: 'ask_email',
      reason: 'email_missing',
    };
  }

  // 8. ORÇAMENTO INDICATIVO
  const statedBudgetRaw = typeof data.stated_budget_raw === 'string' ? data.stated_budget_raw.trim() : '';
  if (!statedBudgetRaw) {
    return {
      goal: 'ask_budget',
      reason: 'budget_missing',
    };
  }

  // 9. PROPOSTA DE REUNIÃO DE DIAGNÓSTICO OU EXIBIÇÃO DE AGENDAMENTO
  if (nextStep === 'booking_pending') {
    return {
      goal: 'show_booking',
      reason: 'booking_pending',
    };
  }

  return {
    goal: 'propose_meeting',
    reason: 'qualification_ready',
  };
}
