import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  pt: {
    nav: {
      home: 'INÍCIO',
      solutions: 'SOLUÇÕES',
      cases: 'CASOS DE ESTUDO',
      studio: 'ESTÚDIO',
      contact: 'CONTACTO',
    },
    common: {
      startProject: 'INICIAR PROJETO',
      discoverMore: 'SABER MAIS',
      ourSolutions: 'AS NOSSAS SOLUÇÕES',
    },
    home: {
      heroLine1: 'CONSTRUÍMOS',
      heroLine2: 'SISTEMAS',
      heroLine3: 'QUE ESCALAM',
      heroDesc:
        'Websites premium, automação com IA e sistemas digitais inteligentes, desenhados para empresas ambiciosas.',
      features: [
        { t: 'WEBSITES PREMIUM', d: ['Feitos para impressionar.', 'Criados para converter.'] },
        { t: 'AUTOMAÇÃO IA', d: ['Poupe tempo.', 'Automatize o repetitivo.'] },
        { t: 'CRESCIMENTO DIGITAL', d: ['Gere contactos.', 'Aumente conversões.'] },
        { t: 'SOLUÇÕES À MEDIDA', d: ['Cada projeto é único.', 'Cada solução é personalizada.'] },
      ],
      servicePremium: {
        title: 'WEBSITES PREMIUM',
        lines: ['Feitos para impressionar.', 'Otimizados para converter.', 'Criados para crescer.'],
      },
      serviceAutomation: {
        title: 'AUTOMAÇÃO',
        lines: ['Menos trabalho repetitivo.', 'Mais produtividade.', 'Mais tempo para crescer.'],
      },
      serviceAI: {
        title: 'INTELIGÊNCIA ARTIFICIAL',
        lines: ['Assistentes de IA.', 'Fluxos inteligentes.', 'Impacto real no negócio.'],
      },
      solutionLabels: [
        ['WEBSITES', 'PREMIUM'],
        ['AUTOMAÇÃO'],
        ['SOLUÇÕES', 'IA'],
        ['CRESCIMENTO', 'DIGITAL'],
      ],
      designEyebrow: 'DESIGN ÚNICO',
      designHeading: 'Cada negócio merece uma solução única.',
      designList: ['Sem templates.', 'Sem atalhos.', 'Apenas sistemas digitais à medida.'],
    },
    footer: {
      heading: 'Vamos construir algo único.',
      copyright: 'SISTEMAS DIGITAIS QUE ESCALAM',
    },
    solutions: {
      heading: 'Sistemas digitais inteligentes, feitos para escalar.',
      items: [
        {
          title: 'WEBSITES PREMIUM',
          lines: ['Feitos para impressionar.', 'Otimizados para converter.', 'Criados para crescer.'],
          body: 'Websites de alto desempenho e focados em conversão, criados pixel a pixel — sem templates, apenas experiências digitais à medida que refletem a sua marca.',
        },
        {
          title: 'AUTOMAÇÃO',
          lines: ['Menos trabalho repetitivo.', 'Mais produtividade.', 'Mais tempo para crescer.'],
          body: 'Mapeamos os seus processos e automatizamos o repetitivo, para a sua equipa focar no que realmente faz o negócio avançar.',
        },
        {
          title: 'SOLUÇÕES IA',
          lines: ['Assistentes de IA.', 'Fluxos inteligentes.', 'Impacto real no negócio.'],
          body: 'Assistentes de IA e sistemas inteligentes à medida, integrados diretamente nas suas operações para resultados reais e mensuráveis.',
        },
        {
          title: 'CRESCIMENTO DIGITAL',
          lines: ['Gere contactos.', 'Aumente conversões.', 'Escale com dados.'],
          body: 'Sistemas de crescimento orientados por dados que geram contactos e aumentam conversões — desenhados para escalar com a sua ambição.',
        },
      ],
    },
    cases: {
      heading: 'Sistemas reais. Impacto real no negócio.',
      stats: [
        { k: '60+', l: 'Projetos entregues' },
        { k: '12', l: 'Setores servidos' },
        { k: '98%', l: 'Retenção de clientes' },
        { k: '4.9', l: 'Avaliação média' },
      ],
      items: [
        {
          tag: 'WEBSITE PREMIUM',
          title: 'Nova Finance',
          result: '+180% conversões',
          body: 'Uma marca e sistema web completo para uma fintech em crescimento — reconstruído para velocidade, clareza e confiança.',
        },
        {
          tag: 'AUTOMAÇÃO IA',
          title: 'Helix Logistics',
          result: '40h poupadas / semana',
          body: 'Geração de orçamentos e fluxos de expedição automatizados com um assistente de IA à medida.',
        },
        {
          tag: 'CRESCIMENTO DIGITAL',
          title: 'Aurora Retail',
          result: '3.2x contactos qualificados',
          body: 'Um sistema de aquisição orientado por dados que liga anúncios, CRM e analítica num só ciclo.',
        },
      ],
      cta: 'SEJA O PRÓXIMO CASO DE ESTUDO',
    },
    studio: {
      eyebrow: 'O ESTÚDIO',
      heading: 'Um estúdio para empresas ambiciosas.',
      intro:
        'A LUMYO é um estúdio digital que constrói websites premium, automação com IA e sistemas inteligentes. Trabalhamos com empresas que se recusam a aceitar templates — e construímos sistemas digitais que escalam com elas.',
      values: [
        'Craft acima de quantidade.',
        'Sistemas acima de páginas soltas.',
        'Parceria acima de projetos.',
        'Impacto acima de métricas de vaidade.',
      ],
      howWeWork: 'COMO TRABALHAMOS',
      process: [
        { t: 'Descobrir', d: 'Mergulhamos nos seus objetivos, utilizadores e restrições antes de um único pixel.' },
        { t: 'Desenhar', d: 'Interfaces e sistemas à medida, criados em torno da sua marca — nunca templates.' },
        { t: 'Construir', d: 'Engenharia limpa e escalável, com automação e IA no núcleo.' },
        { t: 'Escalar', d: 'Medimos, otimizamos e fazemos o sistema crescer ao lado do seu negócio.' },
      ],
      cta: 'TRABALHE CONNOSCO',
    },
    contact: {
      heading: 'Vamos construir algo único.',
      desc: 'Fale-nos do seu projeto. Respondemos a todos os pedidos sérios em 24 horas.',
      labelName: 'NOME',
      labelEmail: 'EMAIL',
      labelService: 'SERVIÇO',
      labelMessage: 'MENSAGEM',
      phName: 'O seu nome',
      phEmail: 'voce@empresa.com',
      phMessage: 'Fale-nos do seu projeto...',
      services: ['Website Premium', 'Automação', 'Soluções IA', 'Crescimento Digital'],
      submit: 'INICIAR PROJETO',
      sending: 'A ENVIAR...',
      successTitle: 'Mensagem enviada com sucesso.',
      successMsg: 'Obrigado! Recebemos o seu pedido e entraremos em contacto muito em breve.',
      sendAnother: 'ENVIAR OUTRA',
      errorMsg: 'Algo correu mal. Tente novamente ou escreva-nos diretamente por email.',
    },
  },

  en: {
    nav: {
      home: 'HOME',
      solutions: 'SOLUTIONS',
      cases: 'CASE STUDIES',
      studio: 'STUDIO',
      contact: 'CONTACT',
    },
    common: {
      startProject: 'START YOUR PROJECT',
      discoverMore: 'DISCOVER MORE',
      ourSolutions: 'OUR SOLUTIONS',
    },
    home: {
      heroLine1: 'BUILD DIGITAL',
      heroLine2: 'SYSTEMS',
      heroLine3: 'THAT SCALE',
      heroDesc:
        'Premium websites, AI automation and intelligent digital systems designed for ambitious businesses.',
      features: [
        { t: 'PREMIUM WEBSITES', d: ['Designed to impress.', 'Built to convert.'] },
        { t: 'AI AUTOMATION', d: ['Save time.', 'Automate repetitive work.'] },
        { t: 'DIGITAL GROWTH', d: ['Generate leads.', 'Increase conversions.'] },
        { t: 'TAILORED SOLUTIONS', d: ['Every project is unique.', 'Every solution is custom.'] },
      ],
      servicePremium: {
        title: 'PREMIUM WEBSITES',
        lines: ['Designed to impress.', 'Engineered to convert.', 'Built to grow.'],
      },
      serviceAutomation: {
        title: 'AUTOMATION',
        lines: ['Less repetitive work.', 'More productivity.', 'More time to grow.'],
      },
      serviceAI: {
        title: 'ARTIFICIAL INTELLIGENCE',
        lines: ['AI assistants.', 'Intelligent workflows.', 'Real business impact.'],
      },
      solutionLabels: [
        ['PREMIUM', 'WEBSITES'],
        ['AUTOMATION'],
        ['AI', 'SOLUTIONS'],
        ['DIGITAL', 'GROWTH'],
      ],
      designEyebrow: 'DESIGN UNIQUE',
      designHeading: 'Every business deserves a unique solution.',
      designList: ['No templates.', 'No shortcuts.', 'Only tailored digital systems.'],
    },
    footer: {
      heading: "Let's build something unique.",
      copyright: 'BUILD DIGITAL SYSTEMS THAT SCALE',
    },
    solutions: {
      heading: 'Intelligent digital systems, built to scale.',
      items: [
        {
          title: 'PREMIUM WEBSITES',
          lines: ['Designed to impress.', 'Engineered to convert.', 'Built to grow.'],
          body: 'High-performance, conversion-focused websites crafted pixel by pixel — no templates, only bespoke digital experiences that reflect your brand.',
        },
        {
          title: 'AUTOMATION',
          lines: ['Less repetitive work.', 'More productivity.', 'More time to grow.'],
          body: 'We map your workflows and automate the repetitive, so your team focuses on what actually moves the business forward.',
        },
        {
          title: 'AI SOLUTIONS',
          lines: ['AI assistants.', 'Intelligent workflows.', 'Real business impact.'],
          body: 'Custom AI assistants and intelligent systems integrated directly into your operations for measurable, real-world results.',
        },
        {
          title: 'DIGITAL GROWTH',
          lines: ['Generate leads.', 'Increase conversions.', 'Scale with data.'],
          body: 'Data-driven growth systems that generate leads and increase conversions — engineered to scale alongside your ambition.',
        },
      ],
    },
    cases: {
      heading: 'Real systems. Real business impact.',
      stats: [
        { k: '60+', l: 'Projects shipped' },
        { k: '12', l: 'Industries served' },
        { k: '98%', l: 'Client retention' },
        { k: '4.9', l: 'Average rating' },
      ],
      items: [
        {
          tag: 'PREMIUM WEBSITE',
          title: 'Nova Finance',
          result: '+180% conversions',
          body: 'A full brand and web system for a fintech scale-up — rebuilt for speed, clarity and trust.',
        },
        {
          tag: 'AI AUTOMATION',
          title: 'Helix Logistics',
          result: '40h saved / week',
          body: 'Automated quote generation and dispatch workflows powered by a custom AI assistant.',
        },
        {
          tag: 'DIGITAL GROWTH',
          title: 'Aurora Retail',
          result: '3.2x qualified leads',
          body: 'A data-driven acquisition system connecting ads, CRM and analytics into one loop.',
        },
      ],
      cta: 'BECOME THE NEXT CASE STUDY',
    },
    studio: {
      eyebrow: 'THE STUDIO',
      heading: 'A studio for ambitious businesses.',
      intro:
        'LUMYO is a digital studio building premium websites, AI automation and intelligent systems. We partner with businesses that refuse to settle for templates — and we build digital systems that scale with them.',
      values: [
        'Craft over quantity.',
        'Systems over one-off pages.',
        'Partnership over projects.',
        'Impact over vanity metrics.',
      ],
      howWeWork: 'HOW WE WORK',
      process: [
        { t: 'Discover', d: 'We dig into your goals, users and constraints before a single pixel is drawn.' },
        { t: 'Design', d: 'Bespoke interfaces and systems crafted around your brand — never templated.' },
        { t: 'Build', d: 'Clean, scalable engineering with automation and AI baked into the core.' },
        { t: 'Scale', d: 'We measure, optimise and grow the system alongside your business.' },
      ],
      cta: 'WORK WITH US',
    },
    contact: {
      heading: "Let's build something unique.",
      desc: 'Tell us about your project. We reply to every serious enquiry within 24 hours.',
      labelName: 'NAME',
      labelEmail: 'EMAIL',
      labelService: 'SERVICE',
      labelMessage: 'MESSAGE',
      phName: 'Your name',
      phEmail: 'you@company.com',
      phMessage: 'Tell us about your project...',
      services: ['Premium Website', 'Automation', 'AI Solutions', 'Digital Growth'],
      submit: 'START YOUR PROJECT',
      sending: 'SENDING...',
      successTitle: 'Message sent successfully.',
      successMsg: "Thank you! We've received your request and will be in touch very soon.",
      sendAnother: 'SEND ANOTHER',
      errorMsg: 'Something went wrong. Please try again or email us directly.',
    },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lumyo_lang') || 'pt');

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'pt' ? 'en' : 'pt';
      localStorage.setItem('lumyo_lang', next);
      return next;
    });
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
