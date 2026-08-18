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

const capabilities = [
  {
    icon: Workflow,
    number: '01',
    title: 'Workflows automatizados',
    description:
      'Transformamos processos repetitivos em fluxos automáticos que executam tarefas, movimentam informação e mantêm as operações a funcionar sem intervenção constante.',
  },
  {
    icon: Users,
    number: '02',
    title: 'CRM e gestão de leads',
    description:
      'Ligamos formulários, contactos e equipas comerciais para organizar oportunidades, atualizar estados e garantir que cada lead segue o processo certo.',
  },
  {
    icon: Mail,
    number: '03',
    title: 'Follow-ups automáticos',
    description:
      'Criamos sequências de email, notificações e ações automáticas para acompanhar contactos e clientes nos momentos certos.',
  },
  {
    icon: Database,
    number: '04',
    title: 'Operações internas',
    description:
      'Automatizamos tarefas administrativas, sincronização de dados, criação de registos, documentos e outros processos internos que consomem tempo à equipa.',
  },
  {
    icon: Plug,
    number: '05',
    title: 'Integrações entre sistemas',
    description:
      'Ligamos websites, CRM, e-commerce, pagamentos, ferramentas de marketing e software interno para que a informação circule entre sistemas.',
  },
  {
    icon: BarChart3,
    number: '06',
    title: 'Dados e reporting',
    description:
      'Centralizamos informação e automatizamos recolha, organização e reporting para reduzir trabalho manual e melhorar a visibilidade sobre o negócio.',
  },
];

const process = [
  {
    number: '01',
    title: 'Mapear',
    description:
      'Analisamos o processo atual, identificamos tarefas repetitivas, sistemas envolvidos e pontos onde existe perda de tempo ou informação.',
  },
  {
    number: '02',
    title: 'Desenhar',
    description:
      'Definimos o fluxo, as regras, os dados necessários e o comportamento esperado antes de automatizar.',
  },
  {
    number: '03',
    title: 'Integrar',
    description:
      'Ligamos as ferramentas e construímos os workflows necessários para executar o processo de forma consistente.',
  },
  {
    number: '04',
    title: 'Otimizar',
    description:
      'Testamos o sistema, acompanhamos resultados e ajustamos os fluxos à medida que o negócio e os processos evoluem.',
  },
];

export default function Automation() {
  const { lang, t } = useLang();

  const faq = t.solutions?.automation?.faq || t.automation?.faq;

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
    items: faq?.items || [],
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

      <SolutionHero
        number="02"
        eyebrow="AUTOMAÇÃO"
        title="Menos tarefas repetitivas."
        highlight="Mais tempo para fazer o negócio crescer."
        description="Desenhamos sistemas de automação que ligam ferramentas, dados e processos para reduzir trabalho manual, eliminar tarefas repetitivas e tornar as operações mais eficientes."
      />

      <SolutionCapabilities
        eyebrow="O QUE AUTOMATIZAMOS"
        title="Processos que trabalham mesmo quando tu não estás a trabalhar neles."
        description="Da entrada de um contacto à operação interna, criamos fluxos que fazem a informação chegar ao sítio certo e desencadeiam automaticamente as ações necessárias."
        items={capabilities}
      />

      <SolutionProcess
        eyebrow="COMO TRABALHAMOS"
        title="Primeiro percebemos o processo. Depois automatizamos."
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
        eyebrow="MENOS TRABALHO MANUAL"
        title="Se acontece repetidamente, provavelmente pode ser automatizado."
        description="Analisamos os processos do teu negócio e identificamos onde a tecnologia pode reduzir tarefas manuais, ligar sistemas e libertar a equipa para trabalho com maior valor."
        buttonText="AUTOMATIZAR O MEU NEGÓCIO"
        buttonTo="/contact"
      />
    </main>
  );
}