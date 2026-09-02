/**
 * Compositor determinístico de respostas comerciais.
 * Função pura e síncrona para validar e compor a resposta final ao visitante.
 */

function normalizeNewlines(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function containsUrl(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('http://') ||
    lower.includes('https://') ||
    lower.includes('www.') ||
    lower.includes('cal.com')
  );
}

function containsProhibitedBookingClaims(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const prohibitedExact = [
    'reunião marcada',
    'reunião agendada',
    'marcação confirmada',
    'meeting booked',
    'meeting scheduled',
    'booking confirmed',
  ];
  if (prohibitedExact.some((phrase) => lower.includes(phrase))) {
    return true;
  }
  const prohibitedRegexes = [
    /reuni[ãa]o\s+.*(marcada|agendada)/i,
    /marca[çc][ãa]o\s+.*confirmada/i,
    /meeting\s+.*(booked|scheduled)/i,
    /booking\s+.*confirmed/i,
  ];
  return prohibitedRegexes.some((regex) => regex.test(lower));
}

function containsProhibitedHumanContactClaims(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const prohibitedExact = [
    'já contactámos',
    'será contactado imediatamente',
    'contactaremos de imediato',
    'already contacted',
    'will contact you immediately',
  ];
  if (prohibitedExact.some((phrase) => lower.includes(phrase))) {
    return true;
  }
  const prohibitedRegexes = [
    /j[áa]\s+.*contact/i,
    /ser[áa]\s+.*contactad/i,
    /contactaremos\s+.*de\s+imediato/i,
    /already\s+.*contacted/i,
    /will\s+.*contact\s+.*immediately/i,
  ];
  return prohibitedRegexes.some((regex) => regex.test(lower));
}

function containsProhibitedQualificationClaims(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  const prohibitedPhrases = [
    'entrará em contacto',
    'entraremos em contacto',
    'será contactado',
    'será contactada',
    'vamos contactá-lo',
    'vamos contactá-la',
    'dar seguimento',
    'dará seguimento',
    'contacto foi associado',
    'contacto ficou associado',
    'contacto foi registado',
    'contacto ficou registado',
    'falta apenas',
    'para concluir a qualificação',
    'qualificação está concluída',
    'qualificação ficou concluída',
    'will contact you',
    'you will be contacted',
    'will follow up',
    'contact has been registered',
    'contact has been associated',
    'only missing',
    'to complete the qualification',
    'qualification is complete',
  ];

  return prohibitedPhrases.some((phrase) => lower.includes(phrase));
}

function containsPricingReference(text) {
  if (typeof text !== 'string') return false;

  return (
    /(?:€|\$|£)\s*\d/i.test(text) ||
    /\d[\d\s.,]*\s*(?:€|eur(?:os?)?|usd|dollars?|d[oó]lares?|pounds?|libras?)\b/i.test(text) ||
    /\b(?:refer[eê]ncia|intervalo)\s+indicativ[oa]\b/i.test(text) ||
    /\bindicative\s+(?:pricing\s+)?(?:reference|range)\b/i.test(text)
  );
}

/**
 * Compõe com segurança a resposta comercial final.
 *
 * @param {Object} params
 * @param {string|null|undefined} params.generatedReply Texto gerado pelo LLM de 2ª fase.
 * @param {string|null|undefined} params.deterministicReply Corpo financeiro determinístico gerado internamente.
 * @param {Object|null|undefined} params.goalMessage Objeto retornado por getCommercialGoalMessage.
 * @param {boolean|undefined} params.pricingRequestedThisTurn Indica se o visitante pediu preços explicitamente neste turno.
 * @returns {{ reply: string, source: "model" | "model_with_closing" | "deterministic" | "deterministic_with_closing" | "fallback", validationReason: string }}
 */
export function composeCommercialReply({ generatedReply, deterministicReply, goalMessage, pricingRequestedThisTurn = false } = {}) {
  // 1. Validar goalMessage
  if (
    !goalMessage ||
    typeof goalMessage !== 'object' ||
    Array.isArray(goalMessage) ||
    typeof goalMessage.fallbackReply !== 'string' ||
    !goalMessage.fallbackReply.trim()
  ) {
    const isEn = goalMessage && goalMessage.language === 'en';
    const safeFallback = isEn
      ? "I can help clarify questions about Lumyo's services."
      : 'Posso ajudar a esclarecer alguma questão sobre os serviços da Lumyo.';
    return {
      reply: safeFallback,
      source: 'fallback',
      validationReason: 'invalid_goal_message',
    };
  }

  const fallbackText = normalizeNewlines(goalMessage.fallbackReply);
  const requiredClosing = typeof goalMessage.requiredClosing === 'string' && goalMessage.requiredClosing.trim().length > 0
    ? goalMessage.requiredClosing.trim()
    : null;

  // 2. PROCESSAR DETERMINISTIC REPLY (se fornecido)
  if (deterministicReply !== null && deterministicReply !== undefined) {
    if (typeof deterministicReply !== 'string') {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'invalid_deterministic_reply',
      };
    }

    const rawDetTrimmed = deterministicReply.trim();
    if (rawDetTrimmed.length > 0) {
      if (rawDetTrimmed.length > 3000) {
        return {
          reply: fallbackText,
          source: 'fallback',
          validationReason: 'deterministic_reply_too_long',
        };
      }

      if (rawDetTrimmed.includes('?') || rawDetTrimmed.includes('？')) {
        return {
          reply: fallbackText,
          source: 'fallback',
          validationReason: 'deterministic_reply_contained_question',
        };
      }

      const cleanDetBody = normalizeNewlines(rawDetTrimmed);

      if (requiredClosing) {
        const combined = `${cleanDetBody}\n\n${requiredClosing}`;
        return {
          reply: combined,
          source: 'deterministic_with_closing',
          validationReason: 'valid_deterministic_with_closing',
        };
      }

      return {
        reply: cleanDetBody,
        source: 'deterministic',
        validationReason: 'valid_deterministic_reply',
      };
    }
  }

  // 3. Normalizar generatedReply (comportamento legado para texto do modelo)
  if (typeof generatedReply !== 'string') {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'non_string_generated_reply',
    };
  }

  const rawTrimmed = generatedReply.trim();
  if (rawTrimmed.length === 0) {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'empty_generated_reply',
    };
  }

  if (rawTrimmed.length > 3000) {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'reply_too_long',
    };
  }

  // 3. Verificar presença de pergunta não autorizada pelo modelo
  const hasQuestion = rawTrimmed.includes('?') || rawTrimmed.includes('？');

  // 4. GOALS COM REQUIRED CLOSING (Pergunta obrigatória determinística do backend)
  if (requiredClosing) {
    // 1) Verificar primeiro se o modelo repetiu a requiredClosing
    if (rawTrimmed.toLowerCase().includes(requiredClosing.toLowerCase())) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'model_repeated_closing',
      };
    }

    // 2) Verificar depois se contém uma pergunta não autorizada
    if (hasQuestion) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'model_contained_unauthorized_question',
      };
    }

    // 3) Não antecipar preços ao pedir orçamento, exceto quando o visitante os pediu explicitamente.
    if (
      goalMessage.goal === 'ask_budget' &&
      pricingRequestedThisTurn !== true &&
      containsPricingReference(rawTrimmed)
    ) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'model_contained_unauthorized_pricing',
      };
    }

    // 4) Verificar se contém afirmações proibidas de contacto ou qualificação
    if (goalMessage.action !== 'human_contact' && containsProhibitedQualificationClaims(rawTrimmed)) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'prohibited_qualification_or_contact_claim',
      };
    }

    const cleanBody = normalizeNewlines(rawTrimmed);
    const combinedReply = `${cleanBody}\n\n${requiredClosing}`;
    return {
      reply: combinedReply,
      source: 'model_with_closing',
      validationReason: 'valid_model_with_closing',
    };
  }

  // 5. GOALS SEM REQUIRED CLOSING
  const allowsQuestion = goalMessage.goal === 'answer_turn_intent';
  const questionMatches = rawTrimmed.match(/\?|？/g) || [];

  if (!allowsQuestion && hasQuestion) {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'model_contained_unauthorized_question',
    };
  }

  if (allowsQuestion && questionMatches.length > 1) {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'model_contained_multiple_questions',
    };
  }

  // Verificações de segurança específicas da ação
  if (goalMessage.action !== 'human_contact' && containsProhibitedQualificationClaims(rawTrimmed)) {
    return {
      reply: fallbackText,
      source: 'fallback',
      validationReason: 'prohibited_qualification_or_contact_claim',
    };
  }

  if (goalMessage.action === 'booking') {
    if (containsUrl(rawTrimmed) || containsProhibitedBookingClaims(rawTrimmed)) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'prohibited_booking_claim_or_url',
      };
    }
  }

  if (goalMessage.action === 'human_contact') {
    if (containsProhibitedHumanContactClaims(rawTrimmed)) {
      return {
        reply: fallbackText,
        source: 'fallback',
        validationReason: 'prohibited_human_contact_claim',
      };
    }
  }

  const cleanModelReply = normalizeNewlines(rawTrimmed);
  return {
    reply: cleanModelReply,
    source: 'model',
    validationReason: 'valid_model_reply',
  };
}
