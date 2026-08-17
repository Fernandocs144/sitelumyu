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
import SolutionCTA from '../../components/detail/SolutionCTA';
import SEO from '../../components/seo/SEO';
import StructuredData from '../../components/seo/StructuredData';
import {
  createServiceSchema,
  createBreadcrumbSchema,
} from '../../seo/schema';
import { useLang } from '../../i18n';

const capabilities = [
  {
    icon: MessagesSquare,
    number: '01',
    title: 'Assistentes de IA',
    description:
      'Criamos assistentes inteligentes para apoiar clientes, equipas e operações, capazes de trabalhar com informação e contexto específicos do teu negócio.',
  },
  {
    icon: BrainCircuit,
    number: '02',
    title: 'Classificação inteligente',
    description:
      'Utilizamos IA para interpretar informação, classificar pedidos, organizar contactos e encaminhar automaticamente cada situação para o processo adequado.',
  },
  {
    icon: FileSearch,
    number: '03',
    title: 'Documentos e informação',
    description:
      'Transformamos documentos, mensagens e outros conteúdos não estruturados em informação útil que pode ser pesquisada, extraída e utilizada pelos teus sistemas.',
  },
  {
    icon: Sparkles,
    number: '04',
    title: 'Geração de conteúdo',
    description:
      'Criamos sistemas capazes de gerar, adaptar e estruturar conteúdo com base nas regras, dados e identidade do negócio.',
  },
  {
    icon: Network,
    number: '05',
    title: 'IA integrada nos processos',
    description:
      'Integramos modelos de inteligência artificial em websites, CRM, aplicações e workflows existentes, em vez de criar ferramentas isoladas.',
  },
  {
    icon: Bot,
    number: '06',
    title: 'Agentes inteligentes',
    description:
      'Para processos mais avançados, desenvolvemos sistemas capazes de utilizar ferramentas, consultar informação e executar sequências de tarefas com supervisão e controlo.',
  },
];

const process = [
  {
    number: '01',
    title: 'Identificar',
    description:
      'Começamos pelo problema e identificamos onde a IA pode realmente melhorar velocidade, qualidade ou capacidade operacional.',
  },
  {
    number: '02',
    title: 'Desenhar',
    description:
      'Definimos dados, contexto, regras, integrações e limites necessários para o sistema funcionar de forma controlada.',
  },
  {
    number: '03',
    title: 'Construir',
    description:
      'Desenvolvemos e integramos a solução no ambiente real do negócio, ligando-a aos sistemas e fontes de informação necessários.',
  },
  {
    number: '04',
    title: 'Avaliar',
    description:
      'Testamos resultados, monitorizamos comportamento e melhoramos continuamente a solução com base na utilização real.',
  },
];

export default function ArtificialIntelligence() {
  const { lang } = useLang();

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

      <SolutionHero
        number="03"
        eyebrow="SOLUÇÕES IA"
        title="Inteligência aplicada"
        highlight="onde realmente cria valor."
        description="Desenvolvemos soluções de inteligência artificial integradas nos processos e sistemas do teu negócio — para interpretar informação, apoiar decisões e executar trabalho que não pode ser resolvido apenas com regras fixas."
      />

      <SolutionCapabilities
        eyebrow="O QUE CONSTRUÍMOS"
        title="IA desenhada à volta do teu negócio."
        description="Não adicionamos inteligência artificial apenas porque é possível. Identificamos onde a capacidade de interpretar contexto, informação e linguagem pode resolver problemas concretos."
        items={capabilities}
      />

      <SolutionProcess
        eyebrow="COMO TRABALHAMOS"
        title="O problema primeiro. A inteligência artificial depois."
        items={process}
      />

      <SolutionCTA
        eyebrow="IA COM PROPÓSITO"
        title="Tens um processo que precisa de mais do que regras fixas?"
        description="Analisamos o problema e determinamos se a inteligência artificial é realmente a solução adequada — e, quando é, construímo-la integrada no resto do teu sistema digital."
        buttonText="EXPLORAR UMA SOLUÇÃO IA"
        buttonTo="/contact"
      />
    </main>
  );
}