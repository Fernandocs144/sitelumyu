/**
 * Classificador determinístico inicial de leads para o Agente Comercial Lumyo.
 * Função pura, síncrona e sem efeitos secundários.
 */

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_VARIANTS = ['landing_page', 'institutional_website', 'custom_website', 'ecommerce'];

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 1 || trimmed.length > 200) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

export function classifyLead(leadData) {
  if (!leadData || typeof leadData !== 'object') {
    return {
      classification: 'informational',
      reason: 'service_not_identified',
    };
  }

  // 1. SERVIÇO AUSENTE OU INVÁLIDO
  const primaryService = leadData.primary_service;
  if (!primaryService || !ALLOWED_SERVICES.includes(primaryService)) {
    return {
      classification: 'informational',
      reason: 'service_not_identified',
    };
  }

  // 2. NECESSIDADE CONCRETA AUSENTE
  if (!isNonEmptyString(leadData.need_description)) {
    return {
      classification: 'informational',
      reason: 'concrete_need_missing',
    };
  }

  // 3. WEBSITE SEM VARIANTE
  const serviceVariant = leadData.service_variant || null;
  if (primaryService === 'websites' && (!serviceVariant || !ALLOWED_VARIANTS.includes(serviceVariant))) {
    return {
      classification: 'potential',
      reason: 'website_variant_missing',
    };
  }

  // Verificação de contacto e prazo
  const hasEmail = isValidEmail(leadData.email);
  const hasTimeline = isNonEmptyString(leadData.timeline);

  // 4. CONTACTO E PRAZO AUSENTES
  if (!hasEmail && !hasTimeline) {
    return {
      classification: 'potential',
      reason: 'contact_and_timeline_missing',
    };
  }

  // 5. CONTACTO AUSENTE
  if (!hasEmail) {
    return {
      classification: 'potential',
      reason: 'contact_missing',
    };
  }

  // 6. PRAZO AUSENTE
  if (!hasTimeline) {
    return {
      classification: 'potential',
      reason: 'timeline_missing',
    };
  }

  // 7. BAIXO ALINHAMENTO FINANCEIRO
  const alignmentStatus = leadData.financial_alignment_status || null;
  if (alignmentStatus === 'low_alignment') {
    return {
      classification: 'potential',
      reason: 'financial_alignment_low',
    };
  }

  // 8. QUALIFIED — ALIGNED
  if (alignmentStatus === 'aligned') {
    return {
      classification: 'qualified',
      reason: 'qualification_complete_financial_aligned',
    };
  }

  // 9. QUALIFIED — POSSIBLY LOW
  if (alignmentStatus === 'possibly_low') {
    return {
      classification: 'qualified',
      reason: 'qualification_complete_financial_possibly_low',
    };
  }

  // 10. QUALIFIED — UNKNOWN
  return {
    classification: 'qualified',
    reason: 'qualification_complete_financial_unknown',
  };
}
