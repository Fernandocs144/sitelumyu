/**
 * Avaliador determinístico de alinhamento financeiro das leads para o Agente Comercial Lumyo.
 * Função pura, síncrona e sem efeitos secundários.
 */

import { getCommercialPricingReference } from './commercial-pricing-catalog.js';

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_VARIANTS = ['landing_page', 'institutional_website', 'custom_website', 'ecommerce'];

function normalizeSecondaryServices(secondaryServices, primaryService) {
  if (!Array.isArray(secondaryServices)) return [];
  const validSet = new Set();
  for (const item of secondaryServices) {
    if (typeof item === 'string' && ALLOWED_SERVICES.includes(item) && item !== primaryService) {
      validSet.add(item);
    }
  }
  return Array.from(validSet).sort();
}

export function evaluateFinancialAlignment(leadData) {
  const evaluatedAt = new Date().toISOString();
  const ruleVersion = '1.0';

  if (!leadData || typeof leadData !== 'object') {
    return {
      status: 'unknown',
      reason: 'budget_not_normalized',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 1. Verificação de serviço principal
  const primaryService = leadData.primary_service;
  if (!primaryService || !ALLOWED_SERVICES.includes(primaryService)) {
    return {
      status: 'unknown',
      reason: 'service_not_identified',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 2. Verificação de variante de website
  const serviceVariant = leadData.service_variant || null;
  if (primaryService === 'websites' && (!serviceVariant || !ALLOWED_VARIANTS.includes(serviceVariant))) {
    return {
      status: 'unknown',
      reason: 'website_variant_not_identified',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 3. Verificação de serviços secundários (âmbito composto / múltiplos serviços)
  const cleanSecondary = normalizeSecondaryServices(leadData.secondary_services, primaryService);
  if (cleanSecondary.length > 0) {
    return {
      status: 'unknown',
      reason: 'multiple_services_scope_unknown',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 4. Verificação do estado de normalização do orçamento
  if (leadData.budget_normalization_status !== 'normalized') {
    return {
      status: 'unknown',
      reason: 'budget_not_normalized',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 5. Verificação de valores min e max ausentes ou nulos
  if (
    leadData.stated_budget_min === null ||
    leadData.stated_budget_min === undefined ||
    leadData.stated_budget_max === null ||
    leadData.stated_budget_max === undefined
  ) {
    return {
      status: 'unknown',
      reason: 'budget_values_missing',
      ruleVersion,
      evaluatedAt,
    };
  }

  const min = Number(leadData.stated_budget_min);
  const max = Number(leadData.stated_budget_max);

  if (isNaN(min) || isNaN(max) || !isFinite(min) || !isFinite(max) || min < 0 || max < min) {
    return {
      status: 'unknown',
      reason: 'budget_values_missing',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 6. Pesquisa no catálogo comercial de referência
  const ref = getCommercialPricingReference(primaryService, serviceVariant);
  if (!ref) {
    return {
      status: 'unknown',
      reason: 'service_reference_not_found',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 7. Verificação de moeda
  if (leadData.stated_budget_currency !== ref.currency) {
    return {
      status: 'unknown',
      reason: 'currency_not_supported',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 8. Verificação de periodicidade
  const isMonthlyMatch =
    (ref.period === 'month' || ref.period === 'monthly') &&
    (leadData.stated_budget_period === 'monthly' || leadData.stated_budget_period === 'month');
  const isPeriodMatch = isMonthlyMatch || leadData.stated_budget_period === ref.period;

  if (!isPeriodMatch) {
    return {
      status: 'unknown',
      reason: 'period_mismatch',
      ruleVersion,
      evaluatedAt,
    };
  }

  // 9. Regras de Comparação Financeira
  const referenceMinimum = ref.min;
  const lowerTolerance = referenceMinimum * 0.80;

  if (min >= referenceMinimum) {
    return {
      status: 'aligned',
      reason: 'budget_at_or_above_minimum',
      ruleVersion,
      evaluatedAt,
    };
  }

  if (min < referenceMinimum && max >= referenceMinimum) {
    return {
      status: 'possibly_low',
      reason: 'budget_range_crosses_minimum',
      ruleVersion,
      evaluatedAt,
    };
  }

  if (max < referenceMinimum && max >= lowerTolerance) {
    return {
      status: 'possibly_low',
      reason: 'budget_within_20_percent_below_minimum',
      ruleVersion,
      evaluatedAt,
    };
  }

  if (max < lowerTolerance) {
    return {
      status: 'low_alignment',
      reason: 'budget_materially_below_minimum',
      ruleVersion,
      evaluatedAt,
    };
  }

  return {
    status: 'unknown',
    reason: 'budget_values_missing',
    ruleVersion,
    evaluatedAt,
  };
}
