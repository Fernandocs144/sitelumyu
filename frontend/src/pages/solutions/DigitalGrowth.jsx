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

const capabilities = [
  {
    icon: Share2,
    number: '01',
    title: 'Redes sociais',
    description:
      'Planeamos e gerimos a presença da tua marca nas redes sociais, da estratégia editorial à criação e publicação de conteúdo alinhado com os objetivos do negócio.',
  },
  {
    icon: PenTool,
    number: '02',
    title: 'Conteúdo',
    description:
      'Criamos conteúdo pensado para diferentes momentos da jornada do cliente, transformando conhecimento, produtos e serviços em comunicação capaz de atrair e gerar interesse.',
  },
  {
    icon: Megaphone,
    number: '03',
    title: 'Campanhas digitais',
    description:
      'Planeamos, lançamos e otimizamos campanhas pagas orientadas para objetivos concretos, ligando tráfego, landing pages e conversões num único sistema.',
  },
  {
    icon: Search,
    number: '04',
    title: 'SEO contínuo',
    description:
      'Trabalhamos conteúdo, estrutura, autoridade e desempenho técnico para aumentar progressivamente a visibilidade orgânica e captar procura relevante para o negócio.',
  },
  {
    icon: MousePointerClick,
    number: '05',
    title: 'Conversão e CRO',
    description:
      'Analisamos páginas, jornadas e pontos de abandono para melhorar a experiência e transformar uma maior percentagem do tráfego existente em contactos, oportunidades ou vendas.',
  },
  {
    icon: BarChart3,
    number: '06',
    title: 'Analytics e performance',
    description:
      'Medimos o percurso entre aquisição e resultado para perceber quais os canais, conteúdos e campanhas que realmente contribuem para o crescimento do negócio.',
  },
];

const process = [
  {
    number: '01',
    title: 'Medir',
    description:
      'Percebemos o ponto de partida, os canais existentes, o público, a procura e os dados disponíveis antes de definir onde investir.',
  },
  {
    number: '02',
    title: 'Planear',
    description:
      'Construímos uma estratégia que combina os canais adequados, conteúdo, aquisição e conversão em torno dos objetivos do negócio.',
  },
  {
    number: '03',
    title: 'Executar',
    description:
      'Produzimos conteúdo, gerimos canais, lançamos campanhas e implementamos as páginas e mecanismos necessários para transformar atenção em oportunidades.',
  },
  {
    number: '04',
    title: 'Otimizar',
    description:
      'Analisamos resultados e ajustamos continuamente campanhas, conteúdo, canais e experiência digital com base nos dados recolhidos.',
  },
];

export default function DigitalGrowth() {
  const { lang, t } = useLang();

  const faq = t.solutions?.growth?.faq || t.growth?.faq;

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
    items: faq?.items || [],
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

      <SolutionHero
        number="04"
        eyebrow="CRESCIMENTO DIGITAL"
        title="Atrair é apenas"
        highlight="o início."
        description="Criamos sistemas de crescimento que ligam redes sociais, conteúdo, campanhas, SEO, conversão e dados para transformar atenção em oportunidades reais de negócio."
      />

      <SolutionCapabilities
        eyebrow="COMO FAZEMOS CRESCER"
        title="Da visibilidade à conversão."
        description="Não tratamos marketing como um conjunto de canais isolados. Ligamos conteúdo, aquisição, website e dados para que cada elemento contribua para o mesmo objetivo."
        items={capabilities}
      />

      <SolutionProcess
        eyebrow="COMO TRABALHAMOS"
        title="Crescimento baseado em dados, não em suposições."
        items={process}
      />

      {faq && (
        <SolutionFAQ
          eyebrow={faq.eyebrow}
          title={faq.title}
          items={faq.items}
        />
      )}

      <SolutionCTA
        eyebrow="CRESCER COM DIREÇÃO"
        title="Mais tráfego só interessa se contribuir para o negócio."
        description="Analisamos onde estás, onde queres chegar e construímos uma estratégia digital que liga aquisição, conteúdo e conversão a resultados mensuráveis."
        buttonText="FAZER CRESCER O MEU NEGÓCIO"
        buttonTo="/contact"
      />
    </main>
  );
}