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
import SolutionCTA from '../../components/detail/SolutionCTA';
import SolutionFAQ from '../../components/detail/SolutionFAQ';
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
    icon: Code2,
    number: '01',
    title: 'Websites à medida',
    description:
      'Design e desenvolvimento personalizados, construídos à volta da identidade, dos objetivos e das necessidades reais de cada negócio.',
  },
  {
    icon: ShoppingBag,
    number: '02',
    title: 'E-commerce',
    description:
      'Lojas online rápidas, escaláveis e orientadas para conversão, incluindo experiências Shopify totalmente personalizadas.',
  },
  {
    icon: MousePointerClick,
    number: '03',
    title: 'Landing pages',
    description:
      'Páginas focadas num único objetivo, pensadas para campanhas, aquisição de leads e conversão.',
  },
  {
    icon: Gauge,
    number: '04',
    title: 'Performance',
    description:
      'Experiências rápidas e responsivas, desenvolvidas com atenção à performance, Core Web Vitals e utilização em qualquer dispositivo.',
  },
  {
    icon: Search,
    number: '05',
    title: 'SEO técnico',
    description:
      'Estrutura, metadata, indexação, dados estruturados e arquitetura preparados desde a base para os motores de pesquisa.',
  },
  {
    icon: Workflow,
    number: '06',
    title: 'Integrações',
    description:
      'CRM, pagamentos, analytics, automações e sistemas externos ligados diretamente à experiência digital.',
  },
];

const process = [
  {
    number: '01',
    title: 'Estratégia',
    description:
      'Percebemos o negócio, os objetivos, o público e o papel que o website deve desempenhar no sistema digital.',
  },
  {
    number: '02',
    title: 'Design',
    description:
      'Construímos a experiência visual e a arquitetura de informação à volta da marca e da conversão.',
  },
  {
    number: '03',
    title: 'Desenvolvimento',
    description:
      'Transformamos o design numa experiência rápida, responsiva, escalável e tecnicamente sólida.',
  },
  {
    number: '04',
    title: 'Otimização',
    description:
      'Preparamos performance, SEO técnico, analytics e integrações para que o website esteja pronto para crescer.',
  },
];

export default function Websites() {
  const { lang, t } = useLang();

  const faq = t.solutions?.websites?.faq || t.websites?.faq;

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
    items: faq?.items || [],
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

      <SolutionHero
        number="01"
        eyebrow="WEBSITES PREMIUM"
        title="Não fazemos apenas websites."
        highlight="Construímos plataformas digitais para crescer."
        description="Criamos experiências digitais à medida que combinam design, tecnologia, performance, SEO e conversão desde o primeiro momento."
      />

      <SolutionCapabilities
        eyebrow="O QUE CONSTRUÍMOS"
        title="A infraestrutura digital do teu negócio."
        description="Do website institucional ao e-commerce, cada solução é construída para cumprir um objetivo concreto e integrar-se com o resto do negócio."
        items={capabilities}
      />

      <SolutionProcess
        eyebrow="COMO TRABALHAMOS"
        title="Da estratégia ao lançamento."
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
        eyebrow="A BASE DO SISTEMA"
        title="O website é onde tudo começa."
        description="É a infraestrutura que recebe tráfego, apresenta a proposta de valor, gera oportunidades e liga marketing, automação, inteligência artificial e dados num único sistema digital."
        buttonText="FALAR SOBRE O PROJETO"
        buttonTo="/contact"
      />
    </main>
  );
}