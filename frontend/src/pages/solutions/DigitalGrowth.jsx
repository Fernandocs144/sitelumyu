import React from 'react';
import {
  Share2,
  Megaphone,
  Search,
  MousePointerClick,
  BarChart3,
  PenTool,
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
  Share2,
  PenTool,
  Megaphone,
  Search,
  MousePointerClick,
  BarChart3,
];

export default function DigitalGrowth() {
  const { lang, t } = useLang();
  const s = t.solutions?.growth;

  const capabilities = (s?.capabilities || []).map((item, index) => ({
    ...item,
    icon: icons[index] || Share2,
  }));

  const serviceSchema = createServiceSchema({
    name:
      lang === 'en'
        ? 'Digital Growth & Marketing'
        : 'Crescimento e Marketing Digital',

    description:
      lang === 'en'
        ? 'Digital growth services combining social media management, content, advertising, SEO, conversion optimisation and analytics.'
        : 'Serviços de crescimento digital que combinam gestão de redes sociais, conteúdo, campanhas, SEO, otimização de conversão e analytics.',

    path: '/solutions/growth',
    offers:
      lang === 'en'
        ? [
            'SEO',
            'Generative Engine Optimization',
            'Google Ads',
            'Meta Ads',
            'Social media management',
            'Analytics',
            'Google Business Profile',
          ]
        : [
            'SEO',
            'Generative Engine Optimization',
            'Google Ads',
            'Meta Ads',
            'Gestão de redes sociais',
            'Analytics',
            'Google Business Profile',
          ],
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
            ? 'Digital Growth'
            : 'Crescimento Digital',
        path: '/solutions/growth',
      },
    ],
  });

  const faqSchema = createFAQSchema({
    items: s?.faq?.items || [],
    path: '/solutions/growth',
    lang,
  });

  return (
    <main>
      <SEO
        title="Crescimento e Marketing Digital"
        titleEn="Digital Growth & Marketing"
        description="Estratégia de crescimento digital com gestão de redes sociais, conteúdo, campanhas, SEO, otimização de conversão e analytics orientados para resultados."
        descriptionEn="Digital growth strategies combining social media management, content, advertising, SEO, conversion optimisation and analytics focused on measurable results."
        path="/solutions/growth"
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
  buttonTo="/contact?service=crescimento-digital"
/>
        </>
      )}
    </main>
  );
}