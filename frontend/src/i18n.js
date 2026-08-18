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
    // SOLUTIONS (PÁGINA GERAL E SERVIÇOS DETALHADOS)
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

      websites: {
        faq: {
          eyebrow: 'PERGUNTAS FREQUENTES',
          title: 'O que precisas de saber antes de construir um website.',
          items: [
            {
              question: 'A Lumyo desenvolve websites totalmente personalizados?',
              answer:
                'Sim. Desenvolvemos websites à medida, construídos em função da identidade, objetivos e necessidades de cada negócio. Não trabalhamos com templates como base obrigatória e podemos criar websites institucionais, landing pages, lojas online e experiências Shopify personalizadas.',
            },
            {
              question: 'Um website pode incluir área administrativa, base de dados e integrações?',
              answer:
                'Sim. Quando o projeto exige mais do que uma presença institucional, podemos integrar bases de dados, áreas administrativas, formulários, CRM, pagamentos, analytics, APIs e outros sistemas necessários à operação do negócio.',
            },
            {
              question: 'SEO e performance são tratados durante o desenvolvimento?',
              answer:
                'Sim. A estrutura do website é preparada desde o início com atenção a performance, Core Web Vitals, SEO técnico, metadata, indexação, dados estruturados e arquitetura de informação. O objetivo é evitar que estas áreas sejam tratadas apenas depois do lançamento.',
            },
          ],
        },
      },

      automation: {
        faq: {
          eyebrow: 'PERGUNTAS FREQUENTES',
          title: 'Onde a automação pode reduzir trabalho manual.',
          items: [
            {
              question: 'Que processos podem ser automatizados numa empresa?',
              answer:
                'Podem ser automatizados processos como entrada e qualificação de leads, atualização de CRM, follow-ups, marcações, notificações, sincronização de dados, criação de registos, reporting e outras tarefas repetitivas baseadas em regras.',
            },
            {
              question: 'É possível ligar website, CRM, email e outras ferramentas?',
              answer:
                'Sim. A automação pode ligar websites, CRM, ferramentas de email, pagamentos, plataformas de marketing e software interno para que a informação circule automaticamente entre sistemas e desencadeie as ações necessárias.',
            },
            {
              question: 'A automação substitui completamente o trabalho humano?',
              answer:
                'Não. O objetivo é automatizar tarefas repetitivas e previsíveis, mantendo intervenção humana nos pontos onde é necessária decisão, relação com o cliente ou tratamento de situações fora das regras definidas.',
            },
          ],
        },
      },

      ai: {
        faq: {
          eyebrow: 'PERGUNTAS FREQUENTES',
          title: 'Como aplicar inteligência artificial de forma útil no negócio.',
          items: [
            {
              question: 'Que soluções de inteligência artificial podem ser integradas numa empresa?',
              answer:
                'Podemos integrar assistentes de IA, chatbots, sistemas de classificação, pesquisa e análise de informação, processamento de documentos, geração de conteúdo e agentes ligados a processos e ferramentas internas.',
            },
            {
              question: 'A inteligência artificial pode trabalhar com os sistemas que a empresa já utiliza?',
              answer:
                'Sim. Sempre que existam integrações ou APIs adequadas, a IA pode ser ligada a CRM, bases de dados, websites, ferramentas internas e outros sistemas para consultar informação, executar tarefas ou apoiar decisões.',
            },
            {
              question: 'Quando faz sentido usar IA em vez de automação tradicional?',
              answer:
                'A automação tradicional é mais adequada a processos com regras claras e previsíveis. A IA faz mais sentido quando é necessário interpretar linguagem, classificar informação, resumir conteúdo, extrair dados ou lidar com situações menos determinísticas.',
            },
          ],
        },
      },

      growth: {
        faq: {
          eyebrow: 'PERGUNTAS FREQUENTES',
          title: 'Como ligar visibilidade, tráfego e crescimento.',
          items: [
            {
              question: 'Qual é a diferença entre SEO e GEO?',
              answer:
                'SEO procura aumentar a visibilidade de um website nos motores de pesquisa tradicionais. GEO procura tornar a informação de uma marca mais clara, estruturada e citável em experiências de pesquisa e resposta baseadas em inteligência artificial. As duas abordagens complementam-se e dependem de conteúdo útil, estrutura técnica e autoridade.',
            },
            {
              question: 'A Lumyo gere redes sociais e campanhas pagas?',
              answer:
                'Sim. O crescimento digital pode incluir gestão de redes sociais, Meta Ads, Google Ads, conteúdo, landing pages, tracking, analytics e otimização contínua, dependendo dos objetivos e canais mais adequados ao negócio.',
            },
            {
              question: 'Como é medido o desempenho das ações de crescimento digital?',
              answer:
                'O acompanhamento é feito através de dados como tráfego, leads, conversões, origem dos contactos, desempenho de campanhas e comportamento dos utilizadores. Sempre que possível, os canais são ligados a analytics e sistemas de gestão para reduzir decisões baseadas apenas em métricas de vaidade.',
            },
          ],
        },
      },
    },

    // =====================================================
    // CASES
    // =====================================================

    cases: {
      eyebrow: 'CASOS DE ESTUDO',

      heading: 'Problemas reais. Soluções construídas para os resolver.',

      intro:
        'Alguns exemplos de como combinamos estratégia, design, tecnologia, automação e crescimento para resolver problemas reais de negócio.',

      items: [
        {
          id: 'auto-silcar',
          number: '01',

          tag: 'WEBSITE PREMIUM · PLATAFORMA AUTOMÓVEL',

          title: 'AUTO SILCAR',

          result:
            'Um website que funciona também como ferramenta de gestão comercial.',

          body:
            'Plataforma automóvel com gestão de viaturas, área administrativa, base de dados e captação centralizada de contactos.',

          problemTitle: 'O PROBLEMA',

          problem:
            'A gestão manual das viaturas e dos contactos comerciais torna a atualização do website mais lenta e dispersa informação importante gerada pelos potenciais clientes.',

          solutionTitle: 'A SOLUÇÃO',

          solution:
            'Desenvolvemos uma plataforma com base de dados e área de administração própria, permitindo inserir e remover viaturas facilmente. Os formulários enviam notificações por email através do Resend e todos os contactos ficam também registados na área administrativa.',

          capabilities: [
            'Área administrativa',
            'Base de dados',
            'Gestão de viaturas',
            'Formulários',
            'Resend',
            'Gestão de leads',
          ],

          image: '/images/cases/ola/auto-silcar.png',

          cta: 'QUERO UM WEBSITE ASSIM',
          service: 'Website Premium',
        },

        {
          id: 'clinica-automacao',
          number: '02',

          tag: 'AUTOMAÇÃO · IA · LEAD MANAGEMENT',

          title: 'SISTEMA PARA CLÍNICAS',

          result:
            'Da primeira mensagem à marcação — e da marcação à retenção.',

          body:
            'Um sistema de qualificação, conversão e retenção que liga captação de leads, marcações, follow-ups e atendimento inteligente.',

          problemTitle: 'O PROBLEMA',

          problem:
            'Gerar contactos não chega. É necessário identificar rapidamente quem tem intenção real, responder sem atrasos, encaminhar potenciais clientes para uma marcação e manter o acompanhamento depois do primeiro contacto.',

          solutionTitle: 'A SOLUÇÃO',

          solution:
            'Criámos um sistema que centraliza captação de leads, qualificação, marcações e follow-ups, apoiado por um assistente disponível 24/7 no website, WhatsApp e Instagram.',

          capabilities: [
            'Qualificação de leads',
            'Marcações',
            'Follow-ups',
            'Chat 24/7',
            'WhatsApp',
            'Instagram',
            'Transferência humana',
          ],

          features: [
            'Explicar serviços e preços iniciais',
            'Indicar profissionais e especialidades',
            'Mostrar horários disponíveis',
            'Marcar, remarcar e cancelar consultas',
            'Enviar localização e instruções',
            'Responder a perguntas frequentes',
            'Transferir para uma pessoa quando necessário',
          ],

          image: '/images/cases/ola/clinic-automation.png',

          cta: 'QUERO AUTOMATIZAR O MEU NEGÓCIO',
          service: 'Automação',
        },

        {
          id: 'ola',
          number: '03',

          tag: 'PLATAFORMA SaaS · FITNESS & NUTRIÇÃO',

          title: 'OLÁ',

          result:
            'Treino, nutrição e acompanhamento profissional num único sistema.',

          body:
            'Uma plataforma criada para personal trainers, nutricionistas, ginásios e estúdios gerirem clientes, planos e acompanhamento sem depender de ferramentas dispersas.',

          problemTitle: 'O PROBLEMA',

          problem:
            'A gestão do acompanhamento pode ficar fragmentada entre folhas de cálculo, mensagens, aplicações de treino, ferramentas de nutrição e processos manuais. Isso cria trabalho repetitivo e dificulta uma visão completa de cada cliente.',

          solutionTitle: 'A SOLUÇÃO',

          solution:
            'A Olá centraliza a operação numa plataforma única, permitindo gerir clientes, criar planos de treino e nutrição, acompanhar progresso, comunicar e estruturar todo o acompanhamento profissional.',

          capabilities: [
            'Workout Builder',
            'Nutrition Builder',
            'Gestão de clientes',
            'Check-ins',
            'Chat',
            'Progresso',
            'Automação',
          ],

          image: '/images/cases/ola/ola-brand.png',

          cta: 'QUERO UM SISTEMA ASSIM',
          service: 'Soluções IA',
        },

        {
          id: 'crescimento-digital',
          number: '04',

          tag: 'CRESCIMENTO DIGITAL · SEO · GEO · PAID MEDIA',

          title: 'CRESCIMENTO DIGITAL',

          result:
            'Estratégias digitais orientadas por dados para aumentar visibilidade, tráfego e oportunidades.',

          body:
            'Gestão integrada de redes sociais, tráfego pago, SEO, GEO e análise de dados para transformar presença digital em crescimento mensurável.',

          problemTitle: 'O PROBLEMA',

          problem:
            'Redes sociais, publicidade e posicionamento digital são frequentemente trabalhados como canais separados, tornando difícil perceber o que realmente gera visibilidade, tráfego, contactos e oportunidades comerciais.',

          solutionTitle: 'A SOLUÇÃO',

          solution:
            'Construímos estratégias a partir da análise da presença digital, dos canais e dos dados do negócio, combinando redes sociais, Meta Ads, Google Ads, SEO, GEO e análise de desempenho.',

          capabilities: [
            'Meta Ads',
            'Google Ads',
            'SEO',
            'GEO',
            'Redes sociais',
            'Analytics',
            'Google Business Profile',
          ],

          image: '/images/cases/ola/digital-growth.png',

          cta: 'QUERO CRESCER O MEU NEGÓCIO',
          service: 'Crescimento Digital',
        },
      ],

      openCase: 'VER DETALHES',
      closeCase: 'FECHAR',

      cta: 'FALA-NOS DO TEU PROJETO',
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

      whatWeDoEyebrow: 'O QUE FAZEMOS',

      whatWeDoTitle:
        'Estratégia, tecnologia e crescimento no mesmo sistema.',

      whatWeDoIntro:
        'A Lumyo é um estúdio digital português especializado no desenvolvimento de websites premium, automação de processos, soluções de inteligência artificial e estratégias de crescimento digital para empresas.',

      services: [
        {
          number: '01',
          title: 'Websites Premium',
          description:
            'Desenvolvemos websites institucionais, lojas online, Shopify personalizado e landing pages com foco em design, performance, SEO e conversão.',
          path: '/solutions/websites',
        },
        {
          number: '02',
          title: 'Automação',
          description:
            'Ligamos sistemas e automatizamos CRM, gestão de leads, follow-ups, integrações e processos internos para reduzir trabalho manual.',
          path: '/solutions/automation',
        },
        {
          number: '03',
          title: 'Soluções IA',
          description:
            'Criamos assistentes, sistemas de classificação, processamento de documentos, geração de conteúdo e agentes de IA integrados nos processos do negócio.',
          path: '/solutions/ai',
        },
        {
          number: '04',
          title: 'Crescimento Digital',
          description:
            'Trabalhamos redes sociais, conteúdo, campanhas, SEO, otimização de conversão e analytics para transformar presença digital em crescimento.',
          path: '/solutions/growth',
        },
      ],

      systemTitle:
        'Não construímos peças digitais isoladas.',

      systemDescription:
        'Website, automação, inteligência artificial e crescimento podem funcionar de forma independente. Quando faz sentido, ligamo-los num único sistema para que tecnologia, operações e aquisição trabalhem para o mesmo objetivo.',

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

    // =====================================================
    // SOLUTIONS (GENERAL PAGE & DETAILED SERVICES)
    // =====================================================

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

      websites: {
        faq: {
          eyebrow: 'FREQUENTLY ASKED QUESTIONS',
          title: 'What you should know before building a website.',
          items: [
            {
              question: 'Does Lumyo build fully bespoke websites?',
              answer:
                'Yes. We build websites around each business’s identity, goals and real requirements. We do not rely on templates as a mandatory starting point and can create corporate websites, landing pages, online stores and custom Shopify experiences.',
            },
            {
              question: 'Can a website include an admin area, database and integrations?',
              answer:
                'Yes. When a project requires more than a simple corporate presence, we can integrate databases, administration areas, forms, CRM, payments, analytics, APIs and other systems needed by the business.',
            },
            {
              question: 'Are SEO and performance handled during development?',
              answer:
                'Yes. The website is structured from the beginning with performance, Core Web Vitals, technical SEO, metadata, indexing, structured data and information architecture in mind, rather than treating these areas only after launch.',
            },
          ],
        },
      },

      automation: {
        faq: {
          eyebrow: 'FREQUENTLY ASKED QUESTIONS',
          title: 'Where automation can reduce manual work.',
          items: [
            {
              question: 'Which business processes can be automated?',
              answer:
                'Processes such as lead capture and qualification, CRM updates, follow-ups, appointments, notifications, data synchronisation, record creation, reporting and other repetitive rule-based tasks can be automated.',
            },
            {
              question: 'Can websites, CRM, email and other tools be connected?',
              answer:
                'Yes. Automation can connect websites, CRM platforms, email tools, payments, marketing platforms and internal software so information moves automatically between systems and triggers the required actions.',
            },
            {
              question: 'Does automation completely replace human work?',
              answer:
                'No. The goal is to automate repetitive and predictable tasks while keeping human intervention where decisions, customer relationships or exceptional situations require it.',
            },
          ],
        },
      },

      ai: {
        faq: {
          eyebrow: 'FREQUENTLY ASKED QUESTIONS',
          title: 'How to apply artificial intelligence usefully in business.',
          items: [
            {
              question: 'Which artificial intelligence solutions can be integrated into a business?',
              answer:
                'We can integrate AI assistants, chatbots, classification systems, information search and analysis, document processing, content generation and agents connected to internal tools and business processes.',
            },
            {
              question: 'Can artificial intelligence work with systems a company already uses?',
              answer:
                'Yes. Where suitable integrations or APIs are available, AI can connect to CRM platforms, databases, websites, internal tools and other systems to retrieve information, perform tasks or support decisions.',
            },
            {
              question: 'When should AI be used instead of traditional automation?',
              answer:
                'Traditional automation is better suited to clear and predictable rule-based processes. AI becomes more useful when the task requires language understanding, classification, summarisation, data extraction or handling less deterministic situations.',
            },
          ],
        },
      },

      growth: {
        faq: {
          eyebrow: 'FREQUENTLY ASKED QUESTIONS',
          title: 'How to connect visibility, traffic and growth.',
          items: [
            {
              question: 'What is the difference between SEO and GEO?',
              answer:
                'SEO aims to improve website visibility in traditional search engines. GEO aims to make brand information clearer, better structured and easier to cite in AI-powered search and answer experiences. The two approaches complement each other and both depend on useful content, technical structure and authority.',
            },
            {
              question: 'Does Lumyo manage social media and paid advertising campaigns?',
              answer:
                'Yes. Digital growth can include social media management, Meta Ads, Google Ads, content, landing pages, tracking, analytics and ongoing optimisation, depending on the business goals and most appropriate channels.',
            },
            {
              question: 'How is digital growth performance measured?',
              answer:
                'Performance is tracked through data such as traffic, leads, conversions, lead sources, campaign performance and user behaviour. Whenever possible, channels are connected to analytics and management systems to avoid decisions based only on vanity metrics.',
            },
          ],
        },
      },
    },

    // =====================================================
    // CASES
    // =====================================================

    cases: {
      eyebrow: 'CASE STUDIES',

      heading: 'Real problems. Solutions built to solve them.',

      intro:
        'A selection of examples showing how we combine strategy, design, technology, automation and growth to solve real business problems.',

      items: [
        {
          id: 'auto-silcar',
          number: '01',

          tag: 'PREMIUM WEBSITE · AUTOMOTIVE PLATFORM',

          title: 'AUTO SILCAR',

          result:
            'A website that also works as a commercial management tool.',

          body:
            'An automotive platform with vehicle management, administration area, database and centralised lead capture.',

          problemTitle: 'THE PROBLEM',

          problem:
            'Manual vehicle and commercial contact management makes website updates slower and spreads valuable information generated by potential customers across different channels.',

          solutionTitle: 'THE SOLUTION',

          solution:
            'We developed a platform with its own database and administration area, making it easy to add and remove vehicles. Forms send email notifications through Resend while every contact is also stored in the administration area.',

          capabilities: [
            'Admin area',
            'Database',
            'Vehicle management',
            'Forms',
            'Resend',
            'Lead management',
          ],

          image: '/images/cases/ola/auto-silcar.png',

          cta: 'I WANT A WEBSITE LIKE THIS',
          service: 'Premium Website',
        },

        {
          id: 'clinica-automacao',
          number: '02',

          tag: 'AUTOMATION · AI · LEAD MANAGEMENT',

          title: 'SYSTEM FOR CLINICS',

          result:
            'From the first message to the appointment — and from appointment to retention.',

          body:
            'A qualification, conversion and retention system connecting lead capture, appointments, follow-ups and intelligent customer assistance.',

          problemTitle: 'THE PROBLEM',

          problem:
            'Generating leads is not enough. Clinics need to quickly identify real intent, respond without delays, move potential clients towards an appointment and maintain follow-up after the first contact.',

          solutionTitle: 'THE SOLUTION',

          solution:
            'We created a system that centralises lead capture, qualification, appointments and follow-ups, supported by a 24/7 assistant across the website, WhatsApp and Instagram.',

          capabilities: [
            'Lead qualification',
            'Appointments',
            'Follow-ups',
            '24/7 Chat',
            'WhatsApp',
            'Instagram',
            'Human handoff',
          ],

          features: [
            'Explain services and initial pricing',
            'Recommend professionals and specialties',
            'Show available appointment times',
            'Book, reschedule and cancel appointments',
            'Send location and instructions',
            'Answer frequently asked questions',
            'Transfer conversations to a person when necessary',
          ],

          image: '/images/cases/ola/clinic-automation.png',

          cta: 'I WANT TO AUTOMATE MY BUSINESS',
          service: 'Automation',
        },

        {
          id: 'ola',
          number: '03',

          tag: 'SaaS PLATFORM · FITNESS & NUTRITION',

          title: 'OLÁ',

          result:
            'Training, nutrition and professional client management in one system.',

          body:
            'A platform built for personal trainers, nutritionists, gyms and studios to manage clients, plans and ongoing support without relying on fragmented tools.',

          problemTitle: 'THE PROBLEM',

          problem:
            'Client management can become fragmented across spreadsheets, messaging apps, training platforms, nutrition tools and manual processes. This creates repetitive work and makes it difficult to maintain a complete view of each client.',

          solutionTitle: 'THE SOLUTION',

          solution:
            'Olá centralises operations in a single platform, allowing professionals to manage clients, create training and nutrition plans, track progress, communicate and structure ongoing support.',

          capabilities: [
            'Workout Builder',
            'Nutrition Builder',
            'Client management',
            'Check-ins',
            'Chat',
            'Progress tracking',
            'Automation',
          ],

          image: '/images/cases/ola/ola-brand.png',

          cta: 'I WANT A SYSTEM LIKE THIS',
          service: 'AI Solutions',
        },

        {
          id: 'digital-growth',
          number: '04',

          tag: 'DIGITAL GROWTH · SEO · GEO · PAID MEDIA',

          title: 'DIGITAL GROWTH',

          result:
            'Data-driven digital strategies designed to increase visibility, traffic and opportunities.',

          body:
            'Integrated social media management, paid traffic, SEO, GEO and data analysis designed to turn digital presence into measurable growth.',

          problemTitle: 'THE PROBLEM',

          problem:
            'Social media, advertising and digital positioning are often managed as separate channels, making it difficult to understand what is actually generating visibility, traffic, leads and commercial opportunities.',

          solutionTitle: 'THE SOLUTION',

          solution:
            'We build strategies around the company’s digital presence, channels and performance data, combining social media, Meta Ads, Google Ads, SEO, GEO and performance analysis.',

          capabilities: [
            'Meta Ads',
            'Google Ads',
            'SEO',
            'GEO',
            'Social media',
            'Analytics',
            'Google Business Profile',
          ],

          image: '/images/cases/ola/digital-growth.png',

          cta: 'I WANT TO GROW MY BUSINESS',
          service: 'Digital Growth',
        },
      ],

      openCase: 'VIEW DETAILS',
      closeCase: 'CLOSE',

      cta: 'TELL US ABOUT YOUR PROJECT',
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

      whatWeDoEyebrow: 'WHAT WE DO',

      whatWeDoTitle:
        'Strategy, technology and growth in one system.',

      whatWeDoIntro:
        'Lumyo is a Portuguese digital studio specialising in premium website development, process automation, artificial intelligence solutions and digital growth strategies for businesses.',

      services: [
        {
          number: '01',
          title: 'Premium Websites',
          description:
            'We build corporate websites, online stores, custom Shopify experiences and landing pages focused on design, performance, SEO and conversion.',
          path: '/solutions/websites',
        },
        {
          number: '02',
          title: 'Automation',
          description:
            'We connect systems and automate CRM, lead management, follow-ups, integrations and internal processes to reduce manual work.',
          path: '/solutions/automation',
        },
        {
          number: '03',
          title: 'AI Solutions',
          description:
            'We build assistants, classification systems, document processing, content generation and AI agents integrated into business processes.',
          path: '/solutions/ai',
        },
        {
          number: '04',
          title: 'Digital Growth',
          description:
            'We work across social media, content, advertising, SEO, conversion optimisation and analytics to turn digital presence into growth.',
          path: '/solutions/growth',
        },
      ],

      systemTitle:
        'We do not build disconnected digital pieces.',

      systemDescription:
        'Websites, automation, artificial intelligence and digital growth can work independently. When it makes sense, we connect them into one system so technology, operations and acquisition work towards the same objective.',

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

    // =====================================================
    // CONTACT (PAGE)
    // =====================================================

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