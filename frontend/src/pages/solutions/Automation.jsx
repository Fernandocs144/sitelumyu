import React from 'react';
import {
  Workflow,
  Database,
  Users,
  Mail,
  Plug,
  BarChart3,
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
  Workflow,
  Users,
  Mail,
  Database,
  Plug,
  BarChart3,
];

export default function Automation() {
  const { lang, t } = useLang();
  const s = t.solutions?.automation;

  const capabilities = (s?.capabilities || []).map((item, index) => ({
    ...item,
    icon: icons[index] || Workflow,
  }));

  const serviceSchema = createServiceSchema({
    name:
      lang === 'en'
        ? 'Business Process Automation'
        : 'Automação de Processos e Negócios',

    description:
      lang === 'en'
        ? 'Business process automation, CRM integrations, lead management, follow-ups and operational workflows designed to reduce repetitive work and improve efficiency.'
        : 'Automação de processos, integrações CRM, gestão de leads, follow-ups e workflows operacionais para reduzir trabalho repetitivo e aumentar a eficiência.',

    path: '/solutions/automation',
    offers:
      lang === 'en'
        ? [
            'Process automation',
            'Lead qualification',
            'Appointment automation',
            'Automated follow-ups',
            'System integrations',
            'CRM automation',
          ]
        : [
            'Automação de processos',
            'Qualificação de leads',
            'Automação de marcações',
            'Follow-ups automáticos',
            'Integração de sistemas',
            'Automação de CRM',
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
            ? 'Automation'
            : 'Automação',
        path: '/solutions/automation',
      },
    ],
  });

  const faqSchema = createFAQSchema({
    items: s?.faq?.items || [],
    path: '/solutions/automation',
    lang,
  });

  return (
    <main>
      <SEO
        title="Automação de Processos e Sistemas"
        titleEn="Process and Systems Automation"
        description="Desenhamos sistemas de automação que ligam ferramentas, dados e processos para reduzir tarefas manuais e aumentar a eficiência operacional."
        descriptionEn="We build automation systems connecting tools, data, and workflows to eliminate repetitive work and boost operational efficiency."
        path="/solutions/automation"
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
  buttonTo="/contact?service=automacao"
/>
        </>
      )}
    </main>
  );
}