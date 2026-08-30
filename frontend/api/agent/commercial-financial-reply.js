/**
 * Compositor determinístico e puro para o corpo da resposta financeira da Lumyo.
 * Módulo síncrono, sem efeitos secundários, base de dados ou variáveis de ambiente.
 */

import {
  getCommercialPricingReference,
  formatCommercialPricingReference,
} from './commercial-pricing-catalog.js';

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];

function getPublicServiceName(primaryService, serviceVariant, lang) {
  const isEn = lang === 'en';
  if (primaryService === 'websites') {
    switch (serviceVariant) {
      case 'landing_page':
        return isEn ? 'a landing page' : 'uma landing page';
      case 'institutional_website':
        return isEn ? 'an institutional website' : 'um website institucional';
      case 'custom_website':
        return isEn ? 'a custom website' : 'um website personalizado';
      case 'ecommerce':
        return isEn ? 'an online store' : 'uma loja online';
      default:
        return isEn ? 'a website' : 'um website';
    }
  }

  switch (primaryService) {
    case 'automation':
      return isEn ? 'automation' : 'automação';
    case 'ai':
      return isEn
        ? 'an artificial intelligence solution'
        : 'uma solução de inteligência artificial';
    case 'digital_growth':
      return isEn ? 'digital growth' : 'crescimento digital';
    default:
      return primaryService;
  }
}

function sanitizeSecondaryServices(secondaryServices, primaryService, lang) {
  if (!Array.isArray(secondaryServices)) return [];
  const validSet = new Set();
  for (const item of secondaryServices) {
    if (
      typeof item === 'string' &&
      ALLOWED_SERVICES.includes(item) &&
      item !== primaryService
    ) {
      validSet.add(item);
    }
  }
  const list = Array.from(validSet);
  return list.map((svc) => getPublicServiceName(svc, null, lang));
}

function formatSecondaryServicesEnumeration(secondaryList, lang) {
  if (secondaryList.length === 0) return '';
  if (secondaryList.length === 1) return secondaryList[0];
  if (secondaryList.length === 2) {
    return lang === 'en'
      ? `${secondaryList[0]} and ${secondaryList[1]}`
      : `${secondaryList[0]} e ${secondaryList[1]}`;
  }
  const lastIndex = secondaryList.length - 1;
  const initial = secondaryList.slice(0, lastIndex).join(', ');
  return lang === 'en'
    ? `${initial}, and ${secondaryList[lastIndex]}`
    : `${initial} e ${secondaryList[lastIndex]}`;
}

/**
 * Constrói deterministicamente o corpo da resposta financeira.
 *
 * @param {Object} leadData Dados consolidados da lead.
 * @param {string} language Idioma ('pt' ou 'en').
 * @returns {string|null} Resposta financeira formatada ou null se faltarem dados essenciais.
 */
export function buildDeterministicFinancialReply(leadData, language) {
  if (!leadData || typeof leadData !== 'object') {
    return null;
  }

  const primaryService = leadData.primary_service;
  const serviceVariant = leadData.service_variant || null;

  if (typeof primaryService !== 'string' || !ALLOWED_SERVICES.includes(primaryService)) {
    return null;
  }

  if (primaryService === 'websites' && (!serviceVariant || typeof serviceVariant !== 'string')) {
    return null;
  }

  const ref = getCommercialPricingReference(primaryService, serviceVariant);
  if (!ref) {
    return null;
  }

  const isEn = language === 'en';
  const lang = isEn ? 'en' : 'pt';
  const rangeFormatted = formatCommercialPricingReference(ref, lang);
  if (!rangeFormatted) {
    return null;
  }

  const primaryPublicName = getPublicServiceName(primaryService, serviceVariant, lang);
  const secondaryPublicNames = sanitizeSecondaryServices(
    leadData.secondary_services,
    primaryService,
    lang
  );
  const hasMultipleServices =
    secondaryPublicNames.length > 0 ||
    leadData.financial_alignment_reason === 'multiple_services_scope_unknown';

  if (hasMultipleServices) {
    if (secondaryPublicNames.length > 0) {
      const enumText = formatSecondaryServicesEnumeration(secondaryPublicNames, lang);
      if (isEn) {
        return `For ${primaryPublicName}, the indicative pricing reference is ${rangeFormatted}. As the project also includes ${enumText}, the final investment depends on the combined scope and integrations. This reference does not constitute a formal quotation.`;
      }
      return `Para ${primaryPublicName}, a referência indicativa é de ${rangeFormatted}. Como o projeto também inclui ${enumText}, o investimento final depende da combinação dos âmbitos e integrações. Esta referência não constitui um orçamento formal.`;
    }

    if (isEn) {
      return `For ${primaryPublicName}, the indicative pricing reference is ${rangeFormatted}. As the project includes multiple services, the final investment depends on the combined scope and integrations. This reference does not constitute a formal quotation.`;
    }
    return `Para ${primaryPublicName}, a referência indicativa é de ${rangeFormatted}. Como o projeto inclui múltiplos serviços, o investimento final depende da combinação dos âmbitos e integrações. Esta referência não constitui um orçamento formal.`;
  }

  const status = leadData.financial_alignment_status;

  if (status === 'aligned') {
    if (isEn) {
      return `For ${primaryPublicName}, the indicative pricing reference is ${rangeFormatted}. The amount indicated is compatible with this reference. The final value depends on the project scope and this reference does not constitute a formal quotation.`;
    }
    return `Para ${primaryPublicName}, a referência indicativa é de ${rangeFormatted}. O valor indicado é compatível com esta referência. O valor final depende do âmbito do projeto e esta referência não constitui um orçamento formal.`;
  }

  if (status === 'possibly_low' || status === 'low_alignment') {
    if (isEn) {
      return `For ${primaryPublicName}, the indicative pricing reference is ${rangeFormatted}. The amount indicated is below the indicative pricing reference. The final value depends on the project scope and this reference does not constitute a formal quotation.`;
    }
    return `Para ${primaryPublicName}, a referência indicativa é de ${rangeFormatted}. O valor indicado fica abaixo da referência indicativa. O valor final depende do âmbito do projeto e esta referência não constitui um orçamento formal.`;
  }

  // Serviço único, status unknown ou ausente
  if (isEn) {
    return `For ${primaryPublicName}, the indicative pricing reference is ${rangeFormatted}. The final value depends on the project scope and this reference does not constitute a formal quotation.`;
  }
  return `Para ${primaryPublicName}, a referência indicativa é de ${rangeFormatted}. O valor final depende do âmbito do projeto e esta referência não constitui um orçamento formal.`;
}
