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
    'A Lumyo cria sistemas digitais completos para empresas, combinando websites premium, automação, inteligência artificial e crescimento digital.',

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