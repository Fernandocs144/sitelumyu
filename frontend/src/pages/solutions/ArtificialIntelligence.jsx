import React from 'react';
import {
  Bot,
  MessagesSquare,
  FileSearch,
  BrainCircuit,
  Sparkles,
  Network,
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
  MessagesSquare,
  BrainCircuit,
  FileSearch,
  Sparkles,
  Network,
  Bot,
];

export default function ArtificialIntelligence() {
  const { lang, t } = useLang();
  const s = t.solutions?.ai;

  const capabilities = (s?.capabilities || []).map((item, index) => ({
    ...item,
    icon: icons[index] || Bot,
  }));

  const serviceSchema = createServiceSchema({
    name:
      lang === 'en'
        ? 'Artificial Intelligence Solutions'
        : 'Soluções de Inteligência Artificial',

    description:
      lang === 'en'
        ? 'Artificial intelligence solutions for businesses, including AI assistants, intelligent classification, document processing, content generation and AI agents.'
        : 'Soluções de inteligência artificial para empresas, incluindo assistentes de IA, classificação inteligente, processamento de documentos, geração de conteúdo e agentes de IA.',

    path: '/solutions/ai',
    offers:
      lang === 'en'
        ? [
            'AI assistants',
            'Intelligent chatbots',
            'AI automation',
            'Information search and analysis',
            'AI integration into business processes',
          ]
        : [
            'Assistentes de inteligência artificial',
            'Chatbots inteligentes',
            'Automação com inteligência artificial',
            'Pesquisa e análise de informação',
            'Integração de IA em processos empresariais',
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
            ? 'Artificial Intelligence'
            : 'Inteligência Artificial',
        path: '/solutions/ai',
      },
    ],
  });

  const faqSchema = createFAQSchema({
    items: s?.faq?.items || [],
    path: '/solutions/ai',
    lang,
  });

  return (
    <main>
      <SEO
        title="Soluções de Inteligência Artificial"
        titleEn="Artificial Intelligence Solutions"
        description="Desenvolvemos soluções de inteligência artificial para empresas: assistentes, classificação inteligente, processamento de documentos, geração de conteúdo e agentes de IA."
        descriptionEn="We develop artificial intelligence solutions for businesses, including AI assistants, intelligent classification, document processing, content generation and AI agents."
        path="/solutions/ai"
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
  buttonTo="/contact?service=solucoes-ia"
/>
        </>
      )}
    </main>
  );
}