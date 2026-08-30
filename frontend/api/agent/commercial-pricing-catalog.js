/**
 * Catálogo estruturado e puro de preços comerciais da Lumyo.
 * Módulo síncrono, sem dependências externas, base de dados ou variáveis de ambiente.
 */

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_WEBSITE_VARIANTS = [
  'landing_page',
  'institutional_website',
  'custom_website',
  'ecommerce',
];

export const COMMERCIAL_PRICING_CATALOG = Object.freeze({
  'websites/landing_page': Object.freeze({
    primaryService: 'websites',
    serviceVariant: 'landing_page',
    min: 500,
    max: 1200,
    currency: 'EUR',
    period: 'project',
    openEndedMax: false,
  }),
  'websites/institutional_website': Object.freeze({
    primaryService: 'websites',
    serviceVariant: 'institutional_website',
    min: 900,
    max: 1500,
    currency: 'EUR',
    period: 'project',
    openEndedMax: false,
  }),
  'websites/custom_website': Object.freeze({
    primaryService: 'websites',
    serviceVariant: 'custom_website',
    min: 1500,
    max: 3500,
    currency: 'EUR',
    period: 'project',
    openEndedMax: true,
  }),
  'websites/ecommerce': Object.freeze({
    primaryService: 'websites',
    serviceVariant: 'ecommerce',
    min: 1500,
    max: 6000,
    currency: 'EUR',
    period: 'project',
    openEndedMax: true,
  }),
  'automation/null': Object.freeze({
    primaryService: 'automation',
    serviceVariant: null,
    min: 1000,
    max: 4000,
    currency: 'EUR',
    period: 'project',
    openEndedMax: true,
  }),
  'ai/null': Object.freeze({
    primaryService: 'ai',
    serviceVariant: null,
    min: 1500,
    max: 6000,
    currency: 'EUR',
    period: 'project',
    openEndedMax: true,
  }),
  'digital_growth/null': Object.freeze({
    primaryService: 'digital_growth',
    serviceVariant: null,
    min: 500,
    max: 1500,
    currency: 'EUR',
    period: 'month',
    openEndedMax: false,
  }),
  'maintenance_support': Object.freeze({
    primaryService: 'maintenance_support',
    serviceVariant: null,
    min: 49,
    max: 299,
    currency: 'EUR',
    period: 'month',
    openEndedMax: false,
  }),
});

/**
 * Obtém a referência de preço comercial para o serviço e variante indicados.
 *
 * @param {string} primaryService
 * @param {string|null} [serviceVariant=null]
 * @returns {Object|null} Cópia imutável da referência de preço comercial, ou null se for inválido.
 */
export function getCommercialPricingReference(primaryService, serviceVariant = null) {
  if (typeof primaryService !== 'string' || !ALLOWED_SERVICES.includes(primaryService)) {
    return null;
  }

  if (primaryService === 'websites') {
    if (typeof serviceVariant !== 'string' || !ALLOWED_WEBSITE_VARIANTS.includes(serviceVariant)) {
      return null;
    }
    const key = `websites/${serviceVariant}`;
    const ref = COMMERCIAL_PRICING_CATALOG[key];
    return ref ? { ...ref } : null;
  }

  const key = `${primaryService}/null`;
  const ref = COMMERCIAL_PRICING_CATALOG[key];
  return ref ? { ...ref } : null;
}

function formatThousands(num, lang) {
  const str = String(num);
  if (lang === 'en') {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formata a referência de preço comercial num texto legível no idioma indicado.
 *
 * @param {Object} reference Objeto retornado por getCommercialPricingReference.
 * @param {string} [language='pt'] 'pt' ou 'en'.
 * @returns {string|null}
 */
export function formatCommercialPricingReference(reference, language = 'pt') {
  if (!reference || typeof reference !== 'object') {
    return null;
  }

  const { min, max, period, openEndedMax } = reference;
  if (typeof min !== 'number' || typeof max !== 'number') {
    return null;
  }

  const lang = language === 'en' ? 'en' : 'pt';
  const minFormatted = formatThousands(min, lang);
  const maxFormatted = formatThousands(max, lang);
  const plusSuffix = openEndedMax ? '+' : '';

  if (lang === 'en') {
    const rangeStr = `€${minFormatted} to €${maxFormatted}${plusSuffix}`;
    if (period === 'month') {
      return `${rangeStr}/month`;
    }
    return rangeStr;
  }

  const rangeStr = `${minFormatted} € a ${maxFormatted} €${plusSuffix}`;
  if (period === 'month') {
    return `${rangeStr}/mês`;
  }
  return rangeStr;
}
