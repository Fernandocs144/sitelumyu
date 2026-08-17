import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

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
      // =====================================================
      // HERO
      // =====================================================

      heroLine1: 'CONSTRUÍMOS',
      heroLine2: 'SISTEMAS',
      heroLine3: 'QUE ESCALAM',

      heroDesc:
        'Websites premium, automação com IA e sistemas digitais inteligentes, desenhados para empresas ambiciosas.',

      features: [
        {
          t: 'WEBSITES PREMIUM',
          d: [
            'Feitos para impressionar.',
            'Criados para converter.',
          ],
        },
        {
          t: 'AUTOMAÇÃO IA',
          d: [
            'Poupe tempo.',
            'Automatize o repetitivo.',
          ],
        },
        {
          t: 'CRESCIMENTO DIGITAL',
          d: [
            'Gere contactos.',
            'Aumente conversões.',
          ],
        },
        {
          t: 'SOLUÇÕES À MEDIDA',
          d: [
            'Cada projeto é único.',
            'Cada solução é personalizada.',
          ],
        },
      ],

      // =====================================================
      // SERVICE 01 — PREMIUM WEBSITES
      // =====================================================

      servicePremium: {
        number: '01',
        titleLine1: 'WEBSITES',
        titleLine2: 'PREMIUM',

        lines: [
          'Feitos para impressionar.',
          'Otimizados para converter.',
          'Criados para crescer.',
        ],
      },

      // =====================================================
      // SERVICE 02 — AUTOMATION
      // =====================================================

      serviceAutomation: {
        number: '02',
        titleLine1: 'AUTO',
        titleLine2: 'MAÇÃO',

        lines: [
          'Menos trabalho repetitivo.',
          'Mais produtividade.',
          'Mais tempo para crescer.',
        ],
      },

      // =====================================================
      // SERVICE 03 — ARTIFICIAL INTELLIGENCE
      // =====================================================

      serviceAI: {
        number: '03',
        titleLine1: 'INTELIGÊNCIA',
        titleLine2: 'ARTIFICIAL',

        lines: [
          'Assistentes de IA.',
          'Fluxos inteligentes.',
          'Impacto real no negócio.',
        ],
      },

      // =====================================================
      // EDITORIAL EXPERIENCE
      // =====================================================

      editorialExperience: {
        titleLine1: 'CRIAMOS EXPERIÊNCIAS',
        titleLine2: 'QUE TORNAM ',
        titleLine3: 'O COMPLEXO SIMPLES.',

        description:
          'Websites, software, automação e inteligência artificial desenvolvidos em torno de problemas reais de negócio.',
      },

      // =====================================================
      // AI CREATIVE
      // =====================================================

      aiCreative: {
        eyebrowTop: 'VÍDEO IA',

        titleLeft: 'AI',
        titleRight: 'CREATIVE',

        eyebrowBottom: 'INFLUENCIADORES DIGITAIS',

        description:
          'Vídeo, conteúdo visual e identidades digitais criados com inteligência artificial para marcas que querem comunicar de forma diferente.',
      },

      // =====================================================
      // TESTIMONIALS
      // =====================================================

      testimonials: {
        eyebrow: 'LUMYO',

        titleLine1: 'O QUE DIZEM',
        titleLine2: 'OS NOSSOS CLIENTES.',

        items: [
          {
            name: 'Anabela Magalhães',
            shortQuote:
              'A Lumyo adaptou cada solução às nossas necessidades e tornou a nossa operação diária muito mais simples e eficiente.',
            quote:
              'O serviço prestado pela Lumyo foi excecional desde o primeiro contacto. Demonstraram uma enorme flexibilidade para adaptar cada solução às nossas necessidades e, hoje, a nossa operação diária está incomparavelmente mais simples e eficiente.',
          },
          {
            name: 'João Antunes',
            shortQuote:
              'A aplicação é rápida, intuitiva e tem sido fundamental para aumentar a satisfação dos nossos clientes.',
            quote:
              'A aplicação desenvolvida pela Lumyo funciona na perfeição. É rápida, intuitiva e tem sido fundamental para elevarmos o nível de satisfação dos nossos clientes.',
          },
          {
            name: 'Vítor Machado',
            shortQuote:
              'A Lumyo criou um website moderno, rápido e fácil de gerir, superando as nossas expectativas em design e suporte.',
            quote:
              'A Lumyo superou todas as nossas expectativas no desenvolvimento do website do nosso stand. Entregaram um design moderno e perfeitamente alinhado com a nossa identidade, acompanhado por uma plataforma rápida, eficiente e muito bem posicionada no Google. A gestão e inserção de viaturas tornou-se extremamente fácil, e o suporte contínuo no dia a dia é impecável.',
          },
        ],
      },

      // =====================================================
      // POSITIONING
      // =====================================================

      positioning: {
        brand: 'LUMYO',
        eyebrow: 'SISTEMAS DIGITAIS',

        line1: 'NÃO CONSTRUÍMOS APENAS PRODUTOS DIGITAIS.',
        line2: 'CONSTRUÍMOS O QUE',
        line3: 'O TEU NEGÓCIO PRECISA.',

        description:
          'Estratégia, design, desenvolvimento, automação e inteligência artificial combinados para resolver problemas reais de negócio.',
      },

      // =====================================================
      // LEGACY / OUTRAS ÁREAS DA HOME
      // =====================================================

      solutionLabels: [
        ['WEBSITES', 'PREMIUM'],
        ['AUTOMAÇÃO'],
        ['SOLUÇÕES', 'IA'],
        ['CRESCIMENTO', 'DIGITAL'],
      ],

      cylinderDetails: [
        [
          'Design personalizado',
          'Design responsivo',
          'Alto desempenho',
          'Segurança e fiabilidade',
        ],
        [
          'Automação de workflows',
          'Automação de tarefas',
          'Integração de sistemas',
          'Optimização de processos',
        ],
        [
          'Estratégia e consultoria IA',
          'Machine Learning',
          'Assistentes e chatbots IA',
          'Análise de dados e insights',
        ],
        [
          'Optimização SEO',
          'Marketing digital',
          'Analytics e tracking',
          'Estratégia de crescimento',
        ],
      ],

      designEyebrow: 'DESIGN ÚNICO',

      designHeading: 'Cada negócio merece uma solução única.',

      designList: [
        'Sem templates.',
        'Sem atalhos.',
        'Apenas sistemas digitais à medida.',
      ],

      whyLumyo: {
        eyebrow: 'PORQUÊ A LUMYO',

        heading: 'Quatro pilares de engenharia e design.',

        pillars: [
          {
            num: '01',
            title: 'ESTRATÉGIA',
            desc:
              'Estratégia clara focada em objetivos de negócio e resultados mensuráveis.',
          },
          {
            num: '02',
            title: 'DESIGN',
            desc:
              'Design premium personalizado sem templates, desenhado pixel a pixel.',
          },
          {
            num: '03',
            title: 'DESENVOLVIMENTO',
            desc:
              'Engenharia limpa, escalável e de alto desempenho.',
          },
          {
            num: '04',
            title: 'INTELIGÊNCIA',
            desc:
              'Automação e inteligência artificial integradas no núcleo das operações.',
          },
        ],
      },

      selectedWork: {
        eyebrow: 'PROJETOS SELECIONADOS',

        heading: 'Sistemas reais com impacto no negócio.',
      },

      contactScene: {
        eyebrow: 'INICIAR PROJETO',

        titleLine1: 'PRONTO PARA CONSTRUIR',
        titleLine2: 'ALGO DIFERENTE?',

        description:
          'Conta-nos o que precisas. Analisamos o desafio, percebemos o negócio e construímos a solução certa.',

        labelName: 'NOME',
        labelEmail: 'EMAIL',
        labelService: 'SERVIÇO',
        labelMessage: 'MENSAGEM',

        placeholderName: 'O teu nome',
        placeholderEmail: 'email@empresa.com',
        placeholderService: 'Seleciona um serviço',
        placeholderMessage: 'Fala-nos do teu projeto',

        services: [
          'Website Premium',
          'Automação',
          'Soluções IA',
          'Crescimento Digital',
        ],

        submit: 'INICIAR PROJETO',
        sending: 'A ENVIAR...',
        successMessage: 'Pedido enviado. Entraremos em contacto em breve.',
        errorMessage: 'Não foi possível enviar. Tenta novamente.',
      },
    },

    // =====================================================
    // FOOTER
    // =====================================================

    footer: {
      eyebrow: 'PORTUGAL · ESTÚDIO DIGITAL',

      headingLine1: 'VAMOS CONSTRUIR',
      headingLine2: 'ALGO',
      headingLine3: 'DIFERENTE.',

      startProject: 'INICIAR PROJETO',

      navigation: 'NAVEGAÇÃO',
      expertise: 'ESPECIALIDADES',
      social: 'SOCIAL',

      home: 'Início',
      solutions: 'Soluções',
      cases: 'Casos de Estudo',
      studio: 'Estúdio',
      contact: 'Contacto',

      services: [
        'Websites Premium',
        'Automação',
        'Inteligência Artificial',
        'Crescimento Digital',
      ],

      copyright: 'SISTEMAS DIGITAIS QUE ESCALAM',
    },

    // =====================================================
    // SOLUTIONS
    // =====================================================

    solutions: {
      heading: 'Sistemas digitais inteligentes, feitos para escalar.',

      items: [
        {
          title: 'WEBSITES PREMIUM',
          lines: [
            'Feitos para impressionar.',
            'Otimizados para converter.',
            'Criados para crescer.',
          ],
          body:
            'Websites de alto desempenho e focados em conversão, criados pixel a pixel — sem templates, apenas experiências digitais à medida que refletem a sua marca.',
        },
        {
          title: 'AUTOMAÇÃO',
          lines: [
            'Menos trabalho repetitivo.',
            'Mais produtividade.',
            'Mais tempo para crescer.',
          ],
          body:
            'Mapeamos os seus processos e automatizamos o repetitivo, para a sua equipa focar no que realmente faz o negócio avançar.',
        },
        {
          title: 'SOLUÇÕES IA',
          lines: [
            'Assistentes de IA.',
            'Fluxos inteligentes.',
            'Impacto real no negócio.',
          ],
          body:
            'Assistentes de IA e sistemas inteligentes à medida, integrados diretamente nas suas operações para resultados reais e mensuráveis.',
        },
        {
          title: 'CRESCIMENTO DIGITAL',
          lines: [
            'Gere contactos.',
            'Aumente conversões.',
            'Escale com dados.',
          ],
          body:
            'Sistemas de crescimento orientados por dados que geram contactos e aumentam conversões — desenhados para escalar com a sua ambição.',
        },
      ],
    },

    // =====================================================
    // CASES
    // =====================================================

    cases: {
      heading: 'Sistemas reais. Impacto real no negócio.',

      stats: [
        {
          k: '60+',
          l: 'Projetos entregues',
        },
        {
          k: '12',
          l: 'Setores servidos',
        },
        {
          k: '98%',
          l: 'Retenção de clientes',
        },
        {
          k: '4.9',
          l: 'Avaliação média',
        },
      ],

      items: [
        {
          tag: 'WEBSITE PREMIUM',
          title: 'SISTEMA WEB 01',
          result: 'SISTEMA DIGITAL',
          body:
            'Arquitetura e desenvolvimento web de alto desempenho — desenhado para velocidade, clareza e conversão.',
        },
        {
          tag: 'AUTOMAÇÃO IA',
          title: 'SISTEMA IA 02',
          result: 'AUTOMAÇÃO DE PROCESSO',
          body:
            'Geração de orçamentos e fluxos operacionais automatizados com assistentes inteligentes à medida.',
        },
        {
          tag: 'CRESCIMENTO DIGITAL',
          title: 'SISTEMA CRESCIMENTO 03',
          result: 'AQUISIÇÃO DE DADOS',
          body:
            'Sistema de aquisição orientado por dados que liga anúncios, CRM e analítica num só ciclo.',
        },
      ],

      cta: 'SEJA O PRÓXIMO CASO DE ESTUDO',
    },

    // =====================================================
    // STUDIO
    // =====================================================

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
        {
          t: 'Descobrir',
          d:
            'Mergulhamos nos seus objetivos, utilizadores e restrições antes de um único pixel.',
        },
        {
          t: 'Desenhar',
          d:
            'Interfaces e sistemas à medida, criados em torno da sua marca — nunca templates.',
        },
        {
          t: 'Construir',
          d:
            'Engenharia limpa e escalável, com automação e IA no núcleo.',
        },
        {
          t: 'Escalar',
          d:
            'Medimos, otimizamos e fazemos o sistema crescer ao lado do seu negócio.',
        },
      ],

      cta: 'TRABALHE CONNOSCO',
    },

    // =====================================================
    // CONTACT (PAGE)
    // =====================================================

    contact: {
      heading: 'Vamos construir algo único.',

      desc:
        'Fala-nos do teu projeto. Respondemos a todos os pedidos sérios em 24 horas.',

      labelName: 'NOME',
      labelEmail: 'EMAIL',
      labelService: 'SERVIÇO',
      labelMessage: 'MENSAGEM',

      phName: 'O teu nome',
      phEmail: 'email@empresa.com',
      phMessage: 'Fala-nos do teu projeto...',

      services: [
        'Website Premium',
        'Automação',
        'Soluções IA',
        'Crescimento Digital',
      ],

      submit: 'INICIAR PROJETO',
      sending: 'A ENVIAR...',
      successTitle: 'Mensagem enviada com sucesso.',
      successMsg:
        'Obrigado! Recebemos o teu pedido e entraremos em contacto muito em breve.',
      sendAnother: 'ENVIAR OUTRA',
      errorMsg:
        'Algo correu mal. Tenta novamente ou escreve-nos diretamente por email.',
    },
  },

  // =======================================================
  // ENGLISH
  // =======================================================

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
      // =====================================================
      // HERO
      // =====================================================

      heroLine1: 'BUILD DIGITAL',
      heroLine2: 'SYSTEMS',
      heroLine3: 'THAT SCALE',

      heroDesc:
        'Premium websites, AI automation and intelligent digital systems designed for ambitious businesses.',

      features: [
        {
          t: 'PREMIUM WEBSITES',
          d: [
            'Designed to impress.',
            'Built to convert.',
          ],
        },
        {
          t: 'AI AUTOMATION',
          d: [
            'Save time.',
            'Automate repetitive work.',
          ],
        },
        {
          t: 'DIGITAL GROWTH',
          d: [
            'Generate leads.',
            'Increase conversions.',
          ],
        },
        {
          t: 'TAILORED SOLUTIONS',
          d: [
            'Every project is unique.',
            'Every solution is custom.',
          ],
        },
      ],

      // =====================================================
      // SERVICE 01
      // =====================================================

      servicePremium: {
        number: '01',
        titleLine1: 'PREMIUM',
        titleLine2: 'WEBSITES',

        lines: [
          'Designed to impress.',
          'Engineered to convert.',
          'Built to grow.',
        ],
      },

      // =====================================================
      // SERVICE 02
      // =====================================================

      serviceAutomation: {
        number: '02',
        titleLine1: 'AUTO',
        titleLine2: 'MATION',

        lines: [
          'Less repetitive work.',
          'More productivity.',
          'More time to grow.',
        ],
      },

      // =====================================================
      // SERVICE 03
      // =====================================================

      serviceAI: {
        number: '03',
        titleLine1: 'ARTIFICIAL',
        titleLine2: 'INTELLIGENCE',

        lines: [
          'AI assistants.',
          'Intelligent workflows.',
          'Real business impact.',
        ],
      },

      // =====================================================
      // EDITORIAL EXPERIENCE
      // =====================================================

      editorialExperience: {
        titleLine1: 'SHAPING EXPERIENCES',
        titleLine2: 'THAT MAKE LIFE',
        titleLine3: 'SIMPLER.',

        description:
          'Websites, software, automation and artificial intelligence built around real business challenges.',
      },

      // =====================================================
      // AI CREATIVE
      // =====================================================

      aiCreative: {
        eyebrowTop: 'AI VIDEO',

        titleLeft: 'AI',
        titleRight: 'CREATIVE',

        eyebrowBottom: 'DIGITAL INFLUENCERS',

        description:
          'Video, visual content and digital identities created with artificial intelligence for brands that want to communicate differently.',
      },

      // =====================================================
      // TESTIMONIALS
      // =====================================================

      testimonials: {
        eyebrow: 'LUMYO',

        titleLine1: 'WHAT OUR',
        titleLine2: 'CLIENTS SAY.',

        items: [
          {
            name: 'Anabela Magalhães',
            shortQuote:
              'Lumyo adapted every solution to our needs, making our daily operation much simpler and more efficient.',
            quote:
              'The service provided by Lumyo was exceptional from the very first contact. They showed great flexibility in adapting each solution to our needs and, today, our daily operation is incomparably simpler and more efficient.',
          },
          {
            name: 'João Antunes',
            shortQuote:
              'The application is fast, intuitive and has been essential in increasing our clients’ satisfaction.',
            quote:
              'The application developed by Lumyo works perfectly. It is fast, intuitive and has been fundamental in helping us raise the level of satisfaction of our clients.',
          },
          {
            name: 'Vítor Machado',
            shortQuote:
              'Lumyo created a modern, fast and easy-to-manage website, exceeding our expectations in design and support.',
            quote:
              'Lumyo exceeded all our expectations in the development of our dealership website. They delivered a modern design perfectly aligned with our identity, together with a fast, efficient platform with excellent Google positioning. Managing and adding vehicles has become extremely easy, and their ongoing support is impeccable.',
          },
        ],
      },

      // =====================================================
      // POSITIONING
      // =====================================================

      positioning: {
        brand: 'LUMYO',
        eyebrow: 'DIGITAL SYSTEMS',

        line1: 'WE DO NOT JUST BUILD DIGITAL PRODUCTS.',
        line2: 'WE BUILD WHAT',
        line3: 'YOUR BUSINESS NEEDS.',

        description:
          'Strategy, design, development, automation and artificial intelligence combined to solve real business problems.',
      },

      // =====================================================
      // LEGACY / REMAINING HOME
      // =====================================================

      solutionLabels: [
        ['PREMIUM', 'WEBSITES'],
        ['AUTOMATION'],
        ['AI', 'SOLUTIONS'],
        ['DIGITAL', 'GROWTH'],
      ],

      cylinderDetails: [
        [
          'Custom design',
          'Responsive design',
          'High performance',
          'Secure and reliable',
        ],
        [
          'Workflow automation',
          'Task automation',
          'System integration',
          'Process optimization',
        ],
        [
          'AI strategy & consulting',
          'Machine Learning',
          'AI chatbots & assistants',
          'Data analysis & insights',
        ],
        [
          'SEO optimization',
          'Digital marketing',
          'Analytics & tracking',
          'Growth strategy',
        ],
      ],

      designEyebrow: 'UNIQUE DESIGN',

      designHeading: 'Every business deserves a unique solution.',

      designList: [
        'No templates.',
        'No shortcuts.',
        'Only tailored digital systems.',
      ],

      whyLumyo: {
        eyebrow: 'WHY LUMYO',

        heading: 'Four pillars of engineering and design.',

        pillars: [
          {
            num: '01',
            title: 'STRATEGY',
            desc:
              'Clear strategy focused on business goals and measurable results.',
          },
          {
            num: '02',
            title: 'DESIGN',
            desc:
              'Bespoke premium design with zero templates, crafted pixel by pixel.',
          },
          {
            num: '03',
            title: 'DEVELOPMENT',
            desc:
              'Clean, scalable, high-performance engineering.',
          },
          {
            num: '04',
            title: 'INTELLIGENCE',
            desc:
              'Automation and artificial intelligence built directly into core operations.',
          },
        ],
      },

      selectedWork: {
        eyebrow: 'SELECTED WORK',

        heading: 'Real cases of business impact.',
      },

      contactScene: {
        eyebrow: 'START YOUR PROJECT',

        titleLine1: 'READY TO BUILD',
        titleLine2: 'SOMETHING DIFFERENT?',

        description:
          'Tell us what you need. We analyse the challenge, understand the business and build the right solution.',

        labelName: 'NAME',
        labelEmail: 'EMAIL',
        labelService: 'SERVICE',
        labelMessage: 'MESSAGE',

        placeholderName: 'Your name',
        placeholderEmail: 'you@company.com',
        placeholderService: 'Select a service',
        placeholderMessage: 'Tell us about your project',

        services: [
          'Premium Website',
          'Automation',
          'AI Solutions',
          'Digital Growth',
        ],

        submit: 'START YOUR PROJECT',
        sending: 'SENDING...',
        successMessage: 'Request sent. We will get back to you shortly.',
        errorMessage: 'Could not send your request. Please try again.',
      },
    },

    footer: {
      eyebrow: 'PORTUGAL · DIGITAL SYSTEMS STUDIO',

      headingLine1: "LET'S BUILD",
      headingLine2: 'SOMETHING',
      headingLine3: 'DIFFERENT.',

      startProject: 'START A PROJECT',

      navigation: 'NAVIGATION',
      expertise: 'EXPERTISE',
      social: 'SOCIAL',

      home: 'Home',
      solutions: 'Solutions',
      cases: 'Case Studies',
      studio: 'Studio',
      contact: 'Contact',

      services: [
        'Premium Websites',
        'Automation',
        'Artificial Intelligence',
        'Digital Growth',
      ],

      copyright: 'DIGITAL SYSTEMS THAT SCALE',
    },

    solutions: {
      heading: 'Intelligent digital systems, built to scale.',

      items: [
        {
          title: 'PREMIUM WEBSITES',
          lines: [
            'Designed to impress.',
            'Engineered to convert.',
            'Built to grow.',
          ],
          body:
            'High-performance, conversion-focused websites crafted pixel by pixel — no templates, only bespoke digital experiences that reflect your brand.',
        },
        {
          title: 'AUTOMATION',
          lines: [
            'Less repetitive work.',
            'More productivity.',
            'More time to grow.',
          ],
          body:
            'We map your workflows and automate the repetitive, so your team focuses on what actually moves the business forward.',
        },
        {
          title: 'AI SOLUTIONS',
          lines: [
            'AI assistants.',
            'Intelligent workflows.',
            'Real business impact.',
          ],
          body:
            'Custom AI assistants and intelligent systems integrated directly into your operations for measurable, real-world results.',
        },
        {
          title: 'DIGITAL GROWTH',
          lines: [
            'Generate leads.',
            'Increase conversions.',
            'Scale with data.',
          ],
          body:
            'Data-driven growth systems that generate leads and increase conversions — engineered to scale alongside your ambition.',
        },
      ],
    },

    cases: {
      heading: 'Real systems. Real business impact.',

      stats: [
        {
          k: '60+',
          l: 'Projects shipped',
        },
        {
          k: '12',
          l: 'Industries served',
        },
        {
          k: '98%',
          l: 'Client retention',
        },
        {
          k: '4.9',
          l: 'Average rating',
        },
      ],

      items: [
        {
          tag: 'PREMIUM WEBSITE',
          title: 'WEB SYSTEM 01',
          result: 'DIGITAL SYSTEM',
          body:
            'High-performance web architecture and engineering — built for speed, clarity and conversion.',
        },
        {
          tag: 'AI AUTOMATION',
          title: 'AI SYSTEM 02',
          result: 'PROCESS AUTOMATION',
          body:
            'Automated workflows and operations powered by tailored intelligent assistants.',
        },
        {
          tag: 'DIGITAL GROWTH',
          title: 'GROWTH SYSTEM 03',
          result: 'DATA ACQUISITION',
          body:
            'Data-driven acquisition system connecting marketing, CRM and analytics into one loop.',
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
        {
          t: 'Discover',
          d:
            'We dig into your goals, users and constraints before a single pixel is drawn.',
        },
        {
          t: 'Design',
          d:
            'Bespoke interfaces and systems crafted around your brand — never templated.',
        },
        {
          t: 'Build',
          d:
            'Clean, scalable engineering with automation and AI baked into the core.',
        },
        {
          t: 'Scale',
          d:
            'We measure, optimise and grow the system alongside your business.',
        },
      ],

      cta: 'WORK WITH US',
    },

    contact: {
      heading: "Let's build something unique.",

      desc:
        'Tell us about your project. We reply to every serious enquiry within 24 hours.',

      labelName: 'NAME',
      labelEmail: 'EMAIL',
      labelService: 'SERVICE',
      labelMessage: 'MESSAGE',

      phName: 'Your name',
      phEmail: 'you@company.com',
      phMessage: 'Tell us about your project...',

      services: [
        'Premium Website',
        'Automation',
        'AI Solutions',
        'Digital Growth',
      ],

      submit: 'START YOUR PROJECT',
      sending: 'SENDING...',
      successTitle: 'Message sent successfully.',
      successMsg:
        "Thank you! We've received your request and will be in touch very soon.",
      sendAnother: 'SEND ANOTHER',
      errorMsg:
        'Something went wrong. Please try again or email us directly.',
    },
  },
};

// 1. Instanciação do Contexto (Resolve o ReferenceError)
const LanguageContext = createContext(null);

// 2. Provedor de Idioma
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('lumyo_lang') || 'pt'
  );

  useEffect(() => {
    document.documentElement.lang =
      lang === 'pt' ? 'pt-PT' : 'en';
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'pt' ? 'en' : 'pt';

      localStorage.setItem(
        'lumyo_lang',
        next
      );

      return next;
    });
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider
      value={{
        lang,
        toggle,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// 3. Hook Personalizado
export function useLang() {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error(
      'useLang must be used within LanguageProvider'
    );
  }

  return ctx;
}