export const SITE_URL = 'https://www.lumyo.pt';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,

  name: 'Lumyo',
  url: SITE_URL,

  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/brand/lumyo-symbol.png`,
  },

  description:
    'A Lumyo é um estúdio digital português especializado no desenvolvimento de websites premium, automação de processos, soluções de inteligência artificial e estratégias de crescimento digital para empresas.',

  areaServed: {
    '@type': 'Country',
    name: 'Portugal',
  },

  knowsAbout: [
    'Desenvolvimento de websites',
    'Websites premium',
    'Aplicações web',
    'Automação de processos',
    'Inteligência artificial',
    'Assistentes de inteligência artificial',
    'Automação com inteligência artificial',
    'SEO',
    'Generative Engine Optimization',
    'Marketing digital',
    'Meta Ads',
    'Google Ads',
    'Analytics',
  ],

  sameAs: [
    'https://www.instagram.com/lumyopt/',
    'https://www.facebook.com/lumyopt',
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,

  url: SITE_URL,
  name: 'Lumyo',

  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },

  inLanguage: ['pt-PT', 'en'],
};
export function createServiceSchema({
  name,
  description,
  path,
  lang = 'pt',
  offers = [],
}) {
  const url = `${SITE_URL}${path}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,

    name,
    description,
    url,

    serviceType: name,

    provider: {
      '@id': `${SITE_URL}/#organization`,
    },

    areaServed: {
      '@type': 'Country',
      name: 'Portugal',
    },

    inLanguage: lang === 'en' ? 'en' : 'pt-PT',

    ...(offers.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name:
          lang === 'en'
            ? `${name} capabilities`
            : `Capacidades de ${name}`,

        itemListElement: offers.map((offer) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: offer,
          },
        })),
      },
    }),
  };
}
export function createBreadcrumbSchema({
  items,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',

    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
    
  };
  
}
export function createFAQSchema({
  items = [],
  path,
  lang = 'pt',
}) {
  if (!items.length) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${path}#faq`,

    url: `${SITE_URL}${path}`,
    inLanguage: lang === 'en' ? 'en' : 'pt-PT',

    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}