import React from 'react';
import {
  Code2,
  ShoppingBag,
  MousePointerClick,
  Gauge,
  Search,
  Workflow,
} from 'lucide-react';

import SolutionHero from '../../components/detail/SolutionHero';
import SolutionCapabilities from '../../components/detail/SolutionCapabilities';
import SolutionProcess from '../../components/detail/SolutionProcess';
import SolutionFAQ from '../../components/detail/SolutionFAQ';
import SolutionCTA from '../../components/detail/SolutionCTA';
import SEO from '../../components/seo/SEO';
import StructuredData from '../../components/seo/StructuredData';
import {
  createServiceSchema,
  createBreadcrumbSchema,
  createFAQSchema,
} from '../../seo/schema';
import { useLang } from '../../i18n';

const icons = [
  Code2,
  ShoppingBag,
  MousePointerClick,
  Gauge,
  Search,
  Workflow,
];

export default function Websites() {
  const { lang, t } = useLang();
  const s = t.solutions?.websites;

  const capabilities = (s?.capabilities || []).map((item, index) => ({
    ...item,
    icon: icons[index] || Code2,
  }));

  const serviceSchema = createServiceSchema({
    name:
      lang === 'en'
        ? 'Bespoke Premium Websites'
        : 'Websites Premium à Medida',
    offers:
      lang === 'en'
        ? [
            'Corporate websites',
            'Landing pages',
            'E-commerce',
            'Web applications',
            'Administration areas',
            'API integrations',
            'Technical SEO',
          ]
        : [
            'Websites institucionais',
            'Landing pages',
            'E-commerce',
            'Aplicações web',
            'Áreas administrativas',
            'Integração com APIs',
            'SEO técnico',
          ],

    description:
      lang === 'en'
        ? 'Bespoke premium websites, custom e-commerce experiences, landing pages, technical SEO, performance optimisation and digital integrations for businesses.'
        : 'Websites premium à medida, experiências de e-commerce personalizadas, landing pages, SEO técnico, otimização de performance e integrações digitais para empresas.',

    path: '/solutions/websites',
    lang,
  });

  const breadcrumbSchema = createBreadcrumbSchema({
    items: [
      {
        name: lang === 'en' ? 'Home' : 'Início',
        path: '/',
      },
      {
        name: lang === 'en' ? 'Solutions' : 'Soluções',
        path: '/solutions',
      },
      {
        name:
          lang === 'en'
            ? 'Premium Websites'
            : 'Websites Premium',
        path: '/solutions/websites',
      },
    ],
  });

  const faqSchema = createFAQSchema({
    items: s?.faq?.items || [],
    path: '/solutions/websites',
    lang,
  });

  return (
    <main>
      <SEO
        title="Websites Premium à Medida"
        titleEn="Bespoke Premium Websites"
        description="Criamos websites premium à medida, lojas online e Shopify personalizado, landing pages rápidas e experiências digitais focadas em performance, SEO e conversão."
        descriptionEn="We build bespoke premium websites, custom Shopify stores, high-performance landing pages and digital experiences focused on SEO and conversion."
        path="/solutions/websites"
      />

      <StructuredData data={serviceSchema} />
      <StructuredData data={breadcrumbSchema} />
      {faqSchema && <StructuredData data={faqSchema} />}

      {s && (
        <>
          <SolutionHero
            number={s.hero.number}
            eyebrow={s.hero.eyebrow}
            title={s.hero.title}
            highlight={s.hero.highlight}
            description={s.hero.description}
          />

          <SolutionCapabilities
            eyebrow={s.capabilitiesEyebrow}
            title={s.capabilitiesTitle}
            description={s.capabilitiesDesc}
            items={capabilities}
          />

          <SolutionProcess
            eyebrow={s.processEyebrow}
            title={s.processTitle}
            items={s.process}
          />

          {s.faq && (
            <SolutionFAQ
              eyebrow={s.faq.eyebrow}
              title={s.faq.title}
              items={s.faq.items}
            />
          )}

          <SolutionCTA
  eyebrow={s.cta.eyebrow}
  title={s.cta.title}
  description={s.cta.description}
  buttonText={s.cta.buttonText}
  buttonTo="/contact?service=websites"
/>
        </>
      )}
    </main>
  );
}