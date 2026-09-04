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

      editorialExperience: {
        titleLine1: 'CRIAMOS EXPERIÊNCIAS',
        titleLine2: 'QUE TORNAM ',
        titleLine3: 'O COMPLEXO SIMPLES.',

        description:
          'Websites, software, automação e inteligência artificial desenvolvidos em torno de problemas reais de negócio.',
      },

      aiCreative: {
        eyebrowTop: 'VÍDEO IA',
        titleLeft: 'AI',
        titleRight: 'CREATIVE',
        eyebrowBottom: 'INFLUENCIADORES DIGITAIS',

        description:
          'Vídeo, conteúdo visual e identidades digitais criados com inteligência artificial para marcas que querem comunicar de forma diferente.',
      },

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

      positioning: {
        brand: 'LUMYO',
        eyebrow: 'SISTEMAS DIGITAIS',

        line1: 'NÃO CONSTRUÍMOS APENAS PRODUTOS DIGITAIS.',
        line2: 'CONSTRUÍMOS O QUE',
        line3: 'O TEU NEGÓCIO PRECISA.',

        description:
          'Estratégia, design, desenvolvimento, automação e inteligência artificial combinados para resolver problemas reais de negócio.',
      },

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
        hero: {
          number: '01',
          eyebrow: 'WEBSITES PREMIUM',
          title: 'Não fazemos apenas websites.',
          highlight: 'Construímos plataformas digitais para crescer.',
          description:
            'Criamos experiências digitais à medida que combinam design, tecnologia, performance, SEO e conversão desde o primeiro momento.',
        },
        capabilitiesEyebrow: 'O QUE CONSTRUÍMOS',
        capabilitiesTitle: 'A infraestrutura digital do teu negócio.',
        capabilitiesDesc:
          'Do website institucional ao e-commerce, cada solução é construída para cumprir um objetivo concreto e integrar-se com o resto do negócio.',
        capabilities: [
          {
            number: '01',
            title: 'Websites à medida',
            description:
              'Design e desenvolvimento personalizados, construídos à volta da identidade, dos objetivos e das necessidades reais de cada negócio.',
          },
          {
            number: '02',
            title: 'E-commerce',
            description:
              'Lojas online rápidas, escaláveis e orientadas para conversão, incluindo experiências Shopify totalmente personalizadas.',
          },
          {
            number: '03',
            title: 'Landing pages',
            description:
              'Páginas focadas num único objetivo, pensadas para campanhas, aquisição de leads e conversão.',
          },
          {
            number: '04',
            title: 'Performance',
            description:
              'Experiências rápidas e responsivas, desenvolvidas com atenção à performance, Core Web Vitals e utilização em qualquer dispositivo.',
          },
          {
            number: '05',
            title: 'SEO técnico',
            description:
              'Estrutura, metadata, indexação, dados estruturados e arquitetura preparados desde a base para os motores de pesquisa.',
          },
          {
            number: '06',
            title: 'Integrações',
            description:
              'CRM, pagamentos, analytics, automações e sistemas externos ligados diretamente à experiência digital.',
          },
        ],
        processEyebrow: 'COMO TRABALHAMOS',
        processTitle: 'Da estratégia ao lançamento.',
        process: [
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
        ],
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
        cta: {
          eyebrow: 'A BASE DO SISTEMA',
          title: 'O website é onde tudo começa.',
          description:
            'É a infraestrutura que recebe tráfego, apresenta a proposta de valor, gera oportunidades e liga marketing, automação, inteligência artificial e dados num único sistema digital.',
          buttonText: 'FALAR SOBRE O PROJETO',
        },
      },

      automation: {
        hero: {
          number: '02',
          eyebrow: 'AUTOMAÇÃO',
          title: 'Menos tarefas repetitivas.',
          highlight: 'Mais tempo para fazer o negócio crescer.',
          description:
            'Desenhamos sistemas de automação que ligam ferramentas, dados e processos para reduzir trabalho manual, eliminar tarefas repetitivas e tornar as operações mais eficientes.',
        },
        capabilitiesEyebrow: 'O QUE AUTOMATIZAMOS',
        capabilitiesTitle:
          'Processos que trabalham mesmo quando tu não estás a trabalhar neles.',
        capabilitiesDesc:
          'Da entrada de um contacto à operação interna, criamos fluxos que fazem a informação chegar ao sítio certo e desencadeiam automaticamente as ações necessárias.',
        capabilities: [
          {
            number: '01',
            title: 'Workflows automatizados',
            description:
              'Transformamos processos repetitivos em fluxos automáticos que executam tarefas, movimentam informação e mantêm as operações a funcionar sem intervenção constante.',
          },
          {
            number: '02',
            title: 'CRM e gestão de leads',
            description:
              'Ligamos formulários, contactos e equipas comerciais para organizar oportunidades, atualizar estados e garantir que cada lead segue o processo certo.',
          },
          {
            number: '03',
            title: 'Follow-ups automáticos',
            description:
              'Criamos sequências de email, notificações e ações automáticas para acompanhar contactos e clientes nos momentos certos.',
          },
          {
            number: '04',
            title: 'Operações internas',
            description:
              'Automatizamos tarefas administrativas, sincronização de dados, criação de registos, documentos e outros processos internos que consomem tempo à equipa.',
          },
          {
            number: '05',
            title: 'Integrações entre sistemas',
            description:
              'Ligamos websites, CRM, e-commerce, pagamentos, ferramentas de marketing e software interno para que a informação circule entre sistemas.',
          },
          {
            number: '06',
            title: 'Dados e reporting',
            description:
              'Centralizamos informação e automatizamos recolha, organização e reporting para reduzir trabalho manual e melhorar a visibilidade sobre o negócio.',
          },
        ],
        processEyebrow: 'COMO TRABALHAMOS',
        processTitle: 'Primeiro percebemos o processo. Depois automatizamos.',
        process: [
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
        ],
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
        cta: {
          eyebrow: 'MENOS TRABALHO MANUAL',
          title: 'Se acontece repetidamente, provavelmente pode ser automatizado.',
          description:
            'Analisamos os processos do teu negócio e identificamos onde a tecnologia pode reduzir tarefas manuais, ligar sistemas e libertar a equipa para trabalho com maior valor.',
          buttonText: 'AUTOMATIZAR O MEU NEGÓCIO',
        },
      },

      ai: {
        hero: {
          number: '03',
          eyebrow: 'SOLUÇÕES IA',
          title: 'Inteligência aplicada',
          highlight: 'onde realmente cria valor.',
          description:
            'Desenvolvemos soluções de inteligência artificial integradas nos processos e sistemas do teu negócio — para interpretar informação, apoiar decisões e executar trabalho que não pode ser resolvido apenas com regras fixas.',
        },
        capabilitiesEyebrow: 'O QUE CONSTRUÍMOS',
        capabilitiesTitle: 'IA desenhada à volta do teu negócio.',
        capabilitiesDesc:
          'Não adicionamos inteligência artificial apenas porque é possível. Identificamos onde a capacidade de interpretar contexto, informação e linguagem pode resolver problemas concretos.',
        capabilities: [
          {
            number: '01',
            title: 'Assistentes de IA',
            description:
              'Criamos assistentes inteligentes para apoiar clientes, equipas e operações, capazes de trabalhar com informação e contexto específicos do teu negócio.',
          },
          {
            number: '02',
            title: 'Classificação inteligente',
            description:
              'Utilizamos IA para interpretar informação, classificar pedidos, organizar contactos e encaminhar automaticamente cada situação para o processo adequado.',
          },
          {
            number: '03',
            title: 'Documentos e informação',
            description:
              'Transformamos documentos, mensagens e outros conteúdos não estruturados em informação útil que pode ser pesquisada, extraída e utilizada pelos teus sistemas.',
          },
          {
            number: '04',
            title: 'Geração de conteúdo',
            description:
              'Criamos sistemas capazes de gerar, adaptar e estruturar conteúdo com base nas regras, dados e identidade do negócio.',
          },
          {
            number: '05',
            title: 'IA integrada nos processos',
            description:
              'Integramos modelos de inteligência artificial em websites, CRM, aplicações e workflows existentes, em vez de criar ferramentas isoladas.',
          },
          {
            number: '06',
            title: 'Agentes inteligentes',
            description:
              'Para processos mais avançados, desenvolvemos sistemas capazes de utilizar ferramentas, consultar informação e executar sequências de tarefas com supervisão e controlo.',
          },
        ],
        processEyebrow: 'COMO TRABALHAMOS',
        processTitle: 'O problema primeiro. A inteligência artificial depois.',
        process: [
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
        ],
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
        cta: {
          eyebrow: 'IA COM PROPÓSITO',
          title: 'Tens um processo que precisa de mais do que regras fixas?',
          description:
            'Analisamos o problema e determinamos se a inteligência artificial é realmente a solução adequada — e, quando é, construímo-la integrada no resto do teu sistema digital.',
          buttonText: 'EXPLORAR UMA SOLUÇÃO IA',
        },
      },

      growth: {
        hero: {
          number: '04',
          eyebrow: 'CRESCIMENTO DIGITAL',
          title: 'Atrair é apenas',
          highlight: 'o início.',
          description:
            'Criamos sistemas de crescimento que ligam redes sociais, conteúdo, campanhas, SEO, conversão e dados para transformar atenção em oportunidades reais de negócio.',
        },
        capabilitiesEyebrow: 'COMO FAZEMOS CRESCER',
        capabilitiesTitle: 'Da visibilidade à conversão.',
        capabilitiesDesc:
          'Não tratamos marketing como um conjunto de canais isolados. Ligamos conteúdo, aquisição, website e dados para que cada elemento contribua para o mesmo objetivo.',
        capabilities: [
          {
            number: '01',
            title: 'Redes sociais',
            description:
              'Planeamos e gerimos a presença da tua marca nas redes sociais, da estratégia editorial à criação e publicação de conteúdo alinhado com os objetivos do negócio.',
          },
          {
            number: '02',
            title: 'Conteúdo',
            description:
              'Criamos conteúdo pensado para diferentes momentos da jornada do cliente, transformando conhecimento, produtos e serviços em comunicação capaz de atrair e gerar interesse.',
          },
          {
            number: '03',
            title: 'Campanhas digitais',
            description:
              'Planeamos, lançamos e otimizamos campanhas pagas orientadas para objetivos concretos, ligando tráfego, landing pages e conversões num único sistema.',
          },
          {
            number: '04',
            title: 'SEO contínuo',
            description:
              'Trabalhamos conteúdo, estrutura, autoridade e desempenho técnico para aumentar progressivamente a visibilidade orgânica e captar procura relevante para o negócio.',
          },
          {
            number: '05',
            title: 'Conversão e CRO',
            description:
              'Analisamos páginas, jornadas e pontos de abandono para melhorar a experiência e transformar uma maior percentagem do tráfego existente em contactos, oportunidades ou vendas.',
          },
          {
            number: '06',
            title: 'Analytics e performance',
            description:
              'Medimos o percurso entre aquisição e resultado para perceber quais os canais, conteúdos e campanhas que realmente contribuem para o crescimento do negócio.',
          },
        ],
        processEyebrow: 'COMO TRABALHAMOS',
        processTitle: 'Crescimento baseado em dados, não em suposições.',
        process: [
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
        ],
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
        cta: {
          eyebrow: 'CRESCER COM DIREÇÃO',
          title: 'Mais tráfego só interessa se contribuir para o negócio.',
          description:
            'Analisamos onde estás, onde queres chegar e construímos uma estratégia digital que liga aquisição, conteúdo e conversão a resultados mensuráveis.',
          buttonText: 'FAZER CRESCER O MEU NEGÓCIO',
        },
      },
    },

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
            'Olá centralises a operação numa plataforma única, permitindo gerir clientes, criar planos de treino e nutrição, acompanhar progresso, comunicar e estruturar todo o acompanhamento profissional.',
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

    legal: {
      lastUpdated: 'Última atualização: agosto de 2026',
    },

    terms: {
      seoTitle: 'Termos de Utilização | Lumyo',
      seoDescription: 'Consulta os Termos de Utilização do website da Lumyo.',
      title: 'Termos de Utilização',
      sections: [
        {
          title: '1. Objeto',
          paragraphs: [
            'Os presentes Termos de Utilização regulam o acesso e utilização do website da Lumyo.',
            'Ao utilizar este website, o utilizador compromete-se a fazê-lo de forma lícita e de acordo com os presentes termos.',
          ],
        },
        {
          title: '2. Informação sobre os serviços',
          paragraphs: [
            'O website apresenta informação sobre serviços de desenvolvimento web, automação, inteligência artificial, crescimento digital e outras soluções digitais disponibilizadas pela Lumyo.',
            'A informação apresentada tem caráter geral e não constitui, por si só, uma proposta contratual vinculativa.',
          ],
        },
        {
          title: '3. Propostas e contratação',
          paragraphs: [
            'Cada projeto pode apresentar requisitos, âmbito, prazos e custos diferentes. A contratação de serviços será efetuada através das condições especificamente acordadas entre a Lumyo e o cliente.',
            'O envio de um formulário ou pedido de contacto através do website não implica a aceitação automática de qualquer projeto nem cria, por si só, uma relação contratual.',
          ],
        },
        {
          title: '4. Utilização do website',
          paragraphs: ['O utilizador não deverá:'],
          list: [
            'Utilizar o website para fins ilícitos;',
            'Tentar obter acesso não autorizado a sistemas, servidores ou informação;',
            'Interferir deliberadamente com o funcionamento ou segurança do website;',
            'Introduzir código malicioso ou utilizar mecanismos automatizados destinados a causar perturbação ou degradação do serviço.',
          ],
        },
        {
          title: '5. Propriedade intelectual',
          paragraphs: [
            'Salvo indicação em contrário, os conteúdos originais presentes no website, incluindo identidade visual, textos, elementos gráficos, interfaces, animações, código e outros materiais desenvolvidos pela Lumyo encontram-se protegidos pelos direitos de propriedade intelectual aplicáveis.',
            'Não é permitida a reprodução, distribuição, modificação ou utilização comercial desses conteúdos sem autorização, exceto nos casos permitidos por lei.',
          ],
        },
        {
          title: '6. Projetos e marcas apresentados',
          paragraphs: [
            'O website poderá apresentar projetos, marcas, interfaces ou outros elementos pertencentes a clientes ou terceiros para efeitos de apresentação de trabalho e portefólio.',
            'As marcas e conteúdos de terceiros permanecem propriedade dos respetivos titulares.',
          ],
        },
        {
          title: '7. Disponibilidade e exatidão',
          paragraphs: [
            'Procuramos manter a informação do website correta e atualizada, mas não garantimos que todos os conteúdos estejam permanentemente disponíveis ou isentos de erros.',
            'O website poderá ser alterado, suspenso ou atualizado sem aviso prévio quando necessário por razões técnicas, operacionais ou de segurança.',
          ],
        },
        {
          title: '8. Ligações externas',
          paragraphs: [
            'O website poderá incluir ligações para websites ou serviços de terceiros. A Lumyo não controla esses serviços e não é responsável pelo respetivo conteúdo, disponibilidade ou políticas.',
          ],
        },
        {
          title: '9. Proteção de dados',
          paragraphs: [
            'O tratamento de dados pessoais realizado através deste website é descrito na Política de Privacidade e, relativamente a cookies e tecnologias semelhantes, na Política de Cookies.',
          ],
        },
        {
          title: '10. Alterações',
          paragraphs: [
            'A Lumyo poderá atualizar estes Termos de Utilização sempre que necessário. A versão em vigor estará disponível nesta página.',
          ],
        },
        {
          title: '11. Lei aplicável',
          paragraphs: [
            'Estes Termos de Utilização são regidos pela legislação portuguesa, sem prejuízo das normas imperativas que sejam aplicáveis.',
          ],
        },
        {
          title: '12. Contacto',
          paragraphs: [
            'Para questões relacionadas com este website ou com os presentes termos, contacta a Lumyo através dos meios disponibilizados na página de contacto.',
          ],
        },
      ],
    },

    privacy: {
      seoTitle: 'Política de Privacidade | Lumyo',
      seoDescription:
        'Consulta a Política de Privacidade da Lumyo e percebe como recolhemos, utilizamos e protegemos os teus dados pessoais.',
      title: 'Política de Privacidade',
      sections: [
        {
          title: '1. Responsável pelo tratamento',
          paragraphs: [
            'A presente Política de Privacidade descreve a forma como a Lumyo trata os dados pessoais recolhidos através deste website e no âmbito dos contactos estabelecidos com potenciais clientes, clientes e outros utilizadores.',
            'Responsável pelo tratamento: Fernando Silva\nMarca: Lumyo\nPaís: Portugal\nEmail: fernando.silva@lumyo.pt',
          ],
        },
        {
          title: '2. Dados pessoais que podemos recolher',
          paragraphs: [
            'Podemos recolher dados fornecidos diretamente através dos formulários ou outros canais de contacto, nomeadamente nome, endereço de email, telefone, empresa, informação sobre o projeto ou serviço pretendido e o conteúdo das mensagens enviadas.',
            'Quando o utilizador aceita cookies de análise, o Microsoft Clarity pode tratar dados técnicos e de utilização, como tipo de dispositivo, navegador, páginas visitadas, origem da visita, cliques e deslocamento. O conteúdo do chatbot é explicitamente mascarado nas gravações.',
          ],
        },
        {
          title: '3. Finalidades do tratamento',
          paragraphs: ['Os dados pessoais poderão ser tratados para:'],
          list: [
            'Responder a pedidos de contacto e pedidos de informação;',
            'Analisar propostas e potenciais projetos;',
            'Preparar e prestar serviços solicitados;',
            'Gerir a relação com clientes;',
            'Garantir a segurança e funcionamento do website;',
            'Analisar a utilização e desempenho do website, quando aplicável;',
            'Cumprir obrigações legais ou regulamentares aplicáveis.',
          ],
        },
        {
          title: '4. Fundamentos jurídicos',
          paragraphs: [
            'Dependendo da finalidade, o tratamento poderá basear-se na execução de diligências pré-contratuais solicitadas pelo titular, na execução de um contrato, no cumprimento de obrigações legais, em interesses legítimos da Lumyo ou no consentimento, quando este seja legalmente necessário.',
          ],
        },
        {
          title: '5. Formulários e comunicações',
          paragraphs: [
            'Quando envias um formulário através do website, os dados introduzidos são utilizados para receber, analisar e responder ao teu pedido.',
            'O website pode recorrer a fornecedores tecnológicos para assegurar o envio e processamento das comunicações, incluindo serviços de infraestrutura e entrega de email.',
          ],
        },
        {
          title: '6. Chatbot e inteligência artificial',
          paragraphs: [
            'A Lumyo disponibiliza um assistente baseado em inteligência artificial para responder a questões, recolher informação sobre potenciais projetos, qualificar pedidos e permitir o agendamento de uma reunião.',
            'As mensagens e os dados fornecidos na conversa podem ser processados através da OpenAI para gerar respostas e extrair informação comercial, e armazenados na infraestrutura Supabase utilizada pela Lumyo para gerir a conversa e o potencial contacto comercial.',
            'Não deves introduzir informação sensível, confidencial ou desnecessária. O conteúdo do chatbot é explicitamente mascarado e não é enviado para as gravações de sessão do Microsoft Clarity.',
          ],
        },
        {
          title: '7. Partilha de dados',
          paragraphs: [
            'Os dados pessoais poderão ser tratados, na medida necessária, por fornecedores que suportam o website e o agente comercial, incluindo Vercel para alojamento e execução da aplicação, Supabase para base de dados e sessões, OpenAI para processamento das conversas, Microsoft Clarity para análise consentida da utilização e Cal.com quando o visitante abre o agendamento.',
            'Estes fornecedores apenas deverão tratar os dados na medida necessária à prestação dos respetivos serviços e de acordo com as obrigações legais aplicáveis.',
          ],
        },
        {
          title: '8. Transferências internacionais',
          paragraphs: [
            'Alguns fornecedores tecnológicos poderão tratar dados fora do Espaço Económico Europeu. Quando isso aconteça, serão utilizados os mecanismos legalmente aplicáveis para assegurar um nível adequado de proteção dos dados pessoais.',
          ],
        },
        {
          title: '9. Conservação dos dados',
          paragraphs: [
            'Os dados pessoais são conservados apenas durante o período necessário para as finalidades para que foram recolhidos, para cumprimento de obrigações legais ou durante os prazos necessários à defesa de direitos e interesses legítimos.',
            'Pedidos de contacto que não resultem numa relação comercial serão eliminados ou anonimizados quando deixarem de ser necessários, salvo quando exista fundamento legal para a sua conservação.',
          ],
        },
        {
          title: '10. Direitos dos titulares',
          paragraphs: [
            'Nos termos da legislação aplicável, podes solicitar, quando aplicável, o acesso aos teus dados pessoais, a sua retificação, apagamento, limitação do tratamento, portabilidade ou oposição ao tratamento.',
            'Quando o tratamento se baseie no consentimento, podes retirar esse consentimento a qualquer momento, sem afetar a licitude do tratamento realizado anteriormente.',
            'Para exercer os teus direitos, contacta: fernando.silva@lumyo.pt.',
          ],
        },
        {
          title: '11. Reclamações',
          paragraphs: [
            'Tens também o direito de apresentar uma reclamação junto da Comissão Nacional de Proteção de Dados (CNPD), enquanto autoridade de controlo em Portugal.',
          ],
        },
        {
          title: '12. Segurança',
          paragraphs: [
            'São adotadas medidas técnicas e organizativas destinadas a proteger os dados pessoais contra acesso não autorizado, perda, alteração, divulgação ou destruição indevida.',
          ],
        },
        {
          title: '13. Alterações a esta política',
          paragraphs: [
            'Esta Política de Privacidade poderá ser atualizada sempre que existam alterações nos serviços, tecnologias utilizadas ou requisitos legais. A versão atual estará permanentemente disponível nesta página.',
          ],
        },
      ],
    },

    cookieConsent: {
      title: 'Cookies de análise',
      description:
        'Utilizamos cookies necessários para o chatbot. Com a tua autorização, utilizamos também o Microsoft Clarity para perceber como o website é utilizado e melhorar a experiência.',
      learnMore: 'Consultar a Política de Cookies.',
      reject: 'REJEITAR ANÁLISE',
      accept: 'ACEITAR ANÁLISE',
      manage: 'GERIR COOKIES',
      currentChoice: 'Podes alterar ou retirar a tua escolha a qualquer momento.',
    },

    cookies: {
      seoTitle: 'Política de Cookies | Lumyo',
      seoDescription:
        'Consulta a Política de Cookies da Lumyo e percebe que tecnologias podem ser utilizadas neste website.',
      title: 'Política de Cookies',
      sections: [
        {
          title: '1. O que são cookies?',
          paragraphs: [
            'Cookies são pequenos ficheiros ou tecnologias semelhantes que podem ser armazenados ou consultados no dispositivo utilizado para aceder a um website.',
            'Podem ser utilizados para assegurar funcionalidades técnicas, guardar preferências, compreender a utilização do website ou medir a eficácia de ações de marketing.',
          ],
        },
        {
          title: '2. Cookies estritamente necessários',
          paragraphs: [
            'O website utiliza o cookie próprio lumyo_agent_session quando o visitante abre o chatbot. Este cookie protege e mantém a sessão da conversa, é HttpOnly, SameSite=Lax, Secure em produção e tem a duração máxima de 30 dias.',
            'As preferências lumyo_lang e lumyo_analytics_consent são guardadas localmente no navegador para manter, respetivamente, o idioma escolhido e a decisão sobre cookies de análise. Estas tecnologias são necessárias para prestar as funcionalidades solicitadas e memorizar a escolha do utilizador.',
          ],
        },
        {
          title: '3. Cookies de análise',
          paragraphs: [
            'Com consentimento, a Lumyo utiliza o Microsoft Clarity para compreender como o website é utilizado, incluindo páginas visitadas, cliques, deslocamento, dificuldades de navegação e gravações de sessão.',
            'O Microsoft Clarity e os respetivos cookies só são carregados depois de o utilizador aceitar a categoria de análise. O conteúdo do chatbot é explicitamente mascarado e não é enviado para as gravações do Clarity.',
          ],
          list: [
            '_clck — mantém um identificador pseudónimo do visitante e as preferências do Clarity;',
            '_clsk — associa diferentes visualizações à mesma sessão;',
            'CLID, ANONCHK, MR, MUID e SM — cookies da Microsoft que podem ser utilizados pelo Clarity após consentimento.',
          ],
        },
        {
          title: '4. Publicidade e medição',
          paragraphs: [
            'A Lumyo poderá futuramente utilizar tecnologias de publicidade e medição, incluindo Meta Pixel e ferramentas associadas a plataformas publicitárias, para medir campanhas, atribuir conversões e melhorar a relevância das ações de marketing.',
            'Estas tecnologias não deverão ser carregadas antes da obtenção do consentimento quando este seja legalmente necessário.',
          ],
        },
        {
          title: '5. Chatbot e serviços externos',
          paragraphs: [
            'O chatbot utiliza o cookie técnico lumyo_agent_session apenas quando é aberto, para criar, proteger e manter a sessão da conversa durante um máximo de 30 dias.',
            'Este cookie é estritamente necessário à funcionalidade solicitada e não é utilizado para publicidade ou análise comportamental.',
          ],
        },
        {
          title: '6. Consentimento',
          paragraphs: [
            'Quando o website utilizar cookies ou tecnologias não estritamente necessárias, será solicitado consentimento antes da sua ativação, de acordo com as opções apresentadas no mecanismo de gestão de cookies.',
            'O utilizador poderá aceitar ou rejeitar as categorias opcionais e alterar posteriormente a sua escolha.',
          ],
        },
        {
          title: '7. Alterar ou retirar o consentimento',
          paragraphs: [
            'A preferência pode ser revista ou retirada a qualquer momento através da opção “Gerir cookies” disponível no rodapé. A rejeição posterior termina a recolha pelo Clarity e elimina os respetivos cookies através do mecanismo de consentimento disponibilizado pela Microsoft.',
          ],
        },
        {
          title: '8. Cookies de terceiros',
          paragraphs: [
            'Algumas funcionalidades poderão ser fornecidas por terceiros e implicar a utilização das suas próprias tecnologias. Quando estas forem ativadas, a informação relevante será apresentada nesta política e no mecanismo de gestão de consentimento.',
          ],
        },
        {
          title: '9. Atualizações',
          paragraphs: [
            'Esta Política de Cookies será atualizada sempre que sejam adicionadas, removidas ou alteradas tecnologias utilizadas pelo website.',
          ],
        },
      ],
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

      editorialExperience: {
        titleLine1: 'SHAPING EXPERIENCES',
        titleLine2: 'THAT MAKE LIFE',
        titleLine3: 'SIMPLER.',

        description:
          'Websites, software, automation and artificial intelligence built around real business challenges.',
      },

      aiCreative: {
        eyebrowTop: 'AI VIDEO',
        titleLeft: 'AI',
        titleRight: 'CREATIVE',
        eyebrowBottom: 'DIGITAL INFLUENCERS',

        description:
          'Video, visual content and digital identities created with artificial intelligence for brands that want to communicate differently.',
      },

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

      positioning: {
        brand: 'LUMYO',
        eyebrow: 'DIGITAL SYSTEMS',

        line1: 'WE DO NOT JUST BUILD DIGITAL PRODUCTS.',
        line2: 'WE BUILD WHAT',
        line3: 'YOUR BUSINESS NEEDS.',

        description:
          'Strategy, design, development, automation and artificial intelligence combined to solve real business problems.',
      },

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

      websites: {
        hero: {
          number: '01',
          eyebrow: 'PREMIUM WEBSITES',
          title: 'We do not just build websites.',
          highlight: 'We build digital platforms to scale.',
          description:
            'We craft bespoke digital experiences combining design, technology, performance, SEO and conversion from day one.',
        },
        capabilitiesEyebrow: 'WHAT WE BUILD',
        capabilitiesTitle: 'Your business digital infrastructure.',
        capabilitiesDesc:
          'From corporate websites to e-commerce, each solution is built to meet specific goals and integrate seamlessly with your operations.',
        capabilities: [
          {
            number: '01',
            title: 'Bespoke Websites',
            description:
              'Custom design and development built around identity, goals and real business requirements.',
          },
          {
            number: '02',
            title: 'E-commerce',
            description:
              'Fast, scalable, conversion-focused online stores, including fully customized Shopify experiences.',
          },
          {
            number: '03',
            title: 'Landing Pages',
            description:
              'Single-goal pages optimized for marketing campaigns, lead generation and conversion.',
          },
          {
            number: '04',
            title: 'Performance',
            description:
              'Fast and responsive experiences built with Core Web Vitals and cross-device speed in mind.',
          },
          {
            number: '05',
            title: 'Technical SEO',
            description:
              'Architecture, metadata, indexing and structured data prepared from the ground up for search engines.',
          },
          {
            number: '06',
            title: 'Integrations',
            description:
              'CRM, payment gateways, analytics and workflows connected directly into the digital experience.',
          },
        ],
        processEyebrow: 'HOW WE WORK',
        processTitle: 'From strategy to launch.',
        process: [
          {
            number: '01',
            title: 'Strategy',
            description:
              'We understand the business, audience and the exact role the website plays in your ecosystem.',
          },
          {
            number: '02',
            title: 'Design',
            description:
              'We shape the visual identity and UX architecture around brand values and conversions.',
          },
          {
            number: '03',
            title: 'Development',
            description:
              'We turn designs into fast, responsive, scalable and robust web systems.',
          },
          {
            number: '04',
            title: 'Optimization',
            description:
              'We fine-tune performance, technical SEO, analytics and integrations for long-term growth.',
          },
        ],
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
        cta: {
          eyebrow: 'THE SYSTEM FOUNDATION',
          title: 'The website is where everything begins.',
          description:
            'The digital foundation that captures traffic, presents value, drives leads and connects automation, AI and data into one ecosystem.',
          buttonText: 'DISCUSS YOUR PROJECT',
        },
      },

      automation: {
        hero: {
          number: '02',
          eyebrow: 'AUTOMATION',
          title: 'Fewer repetitive tasks.',
          highlight: 'More time to grow your business.',
          description:
            'We build automation systems connecting tools, data and workflows to eliminate manual work, reduce repetitive tasks and improve operational efficiency.',
        },
        capabilitiesEyebrow: 'WHAT WE AUTOMATE',
        capabilitiesTitle: 'Workflows that run even when you are not working on them.',
        capabilitiesDesc:
          'From initial lead capture to internal operations, we build workflows that deliver data to the right place and trigger necessary actions automatically.',
        capabilities: [
          {
            number: '01',
            title: 'Automated Workflows',
            description:
              'We turn repetitive tasks into automated pipelines that execute work, transfer data and keep operations moving seamlessly.',
          },
          {
            number: '02',
            title: 'CRM & Lead Management',
            description:
              'We connect forms, contacts and sales teams to organize opportunities, update stages and route leads accurately.',
          },
          {
            number: '03',
            title: 'Automated Follow-ups',
            description:
              'We create email sequences, notifications and automated triggers to stay engaged with leads and clients at critical moments.',
          },
          {
            number: '04',
            title: 'Internal Operations',
            description:
              'We automate administrative duties, data syncs, document creation and back-office tasks that drain team capacity.',
          },
          {
            number: '05',
            title: 'System Integrations',
            description:
              'We connect websites, CRM platforms, e-commerce, payment gateways, marketing tools and custom internal software.',
          },
          {
            number: '06',
            title: 'Data & Reporting',
            description:
              'We centralize operational metrics and automate data collection to reduce manual reporting and provide clear visibility.',
          },
        ],
        processEyebrow: 'HOW WE WORK',
        processTitle: 'First we understand the process. Then we automate.',
        process: [
          {
            number: '01',
            title: 'Map',
            description:
              'We analyze the existing workflow, identifying bottleneck areas, manual steps and systems involved.',
          },
          {
            number: '02',
            title: 'Design',
            description:
              'We specify the logic, required data schemas and expected behavioral edge-cases before development.',
          },
          {
            number: '03',
            title: 'Integrate',
            description:
              'We link APIs and build production-ready pipelines to ensure consistent, reliable execution.',
          },
          {
            number: '04',
            title: 'Optimize',
            description:
              'We monitor pipeline health, gather performance metrics and fine-tune automations as operations evolve.',
          },
        ],
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
        cta: {
          eyebrow: 'LESS MANUAL WORK',
          title: 'If it happens repeatedly, it can probably be automated.',
          description:
            'We analyze your workflows and pinpoint where technology can eliminate manual overhead, link systems and free your team for higher-impact work.',
          buttonText: 'AUTOMATE MY BUSINESS',
        },
      },

      ai: {
        hero: {
          number: '03',
          eyebrow: 'AI SOLUTIONS',
          title: 'Applied intelligence',
          highlight: 'where it genuinely creates value.',
          description:
            'We engineer custom artificial intelligence systems integrated directly into your business processes to interpret context, empower decisions and execute complex tasks.',
        },
        capabilitiesEyebrow: 'WHAT WE BUILD',
        capabilitiesTitle: 'AI tailored around your business.',
        capabilitiesDesc:
          'We do not implement AI merely because it is possible. We identify where language understanding, classification and context solve concrete operational bottlenecks.',
        capabilities: [
          {
            number: '01',
            title: 'AI Assistants',
            description:
              'Custom intelligent assistants supporting customers, internal teams and operations with domain-specific context.',
          },
          {
            number: '02',
            title: 'Intelligent Classification',
            description:
              'AI systems to interpret incoming requests, organize inquiries and automatically route tasks to the right pipeline.',
          },
          {
            number: '03',
            title: 'Document Processing',
            description:
              'Transforming unstructured documents, messages and unstructured files into searchable, structured data.',
          },
          {
            number: '04',
            title: 'Content Generation',
            description:
              'Pipelines to create, adapt and structure business-aligned content based on custom guidelines and datasets.',
          },
          {
            number: '05',
            title: 'Integrated AI Workflows',
            description:
              'Embedding AI models directly inside existing web apps, CRMs and operational databases instead of isolated tools.',
          },
          {
            number: '06',
            title: 'Autonomous Agents',
            description:
              'Advanced systems capable of utilizing APIs, querying resources and completing multi-step tasks under human oversight.',
          },
        ],
        processEyebrow: 'HOW WE WORK',
        processTitle: 'The problem first. Artificial intelligence second.',
        process: [
          {
            number: '01',
            title: 'Identify',
            description:
              'We evaluate the problem to determine where AI delivers measurable speed, precision or operational capacity.',
          },
          {
            number: '02',
            title: 'Design',
            description:
              'We define data schemas, prompt architectures, API integrations and strict guardrails for reliable behavior.',
          },
          {
            number: '03',
            title: 'Build',
            description:
              'We construct and integrate the system within your infrastructure, connecting relevant enterprise knowledge bases.',
          },
          {
            number: '04',
            title: 'Evaluate',
            description:
              'We audit outputs, monitor inference latency and continuously fine-tune models based on real operational feedback.',
          },
        ],
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
        cta: {
          eyebrow: 'PURPOSE-BUILT AI',
          title: 'Have a process that demands more than fixed rules?',
          description:
            'We assess your requirements, confirm whether AI is the right fit, and build it directly into your core digital platform.',
          buttonText: 'EXPLORE AN AI SOLUTION',
        },
      },

      growth: {
        hero: {
          number: '04',
          eyebrow: 'DIGITAL GROWTH',
          title: 'Attracting attention is only',
          highlight: 'the beginning.',
          description:
            'We build growth systems linking social media, content, advertising, SEO, conversion pipelines and analytics to convert attention into qualified pipeline.',
        },
        capabilitiesEyebrow: 'HOW WE DRIVE GROWTH',
        capabilitiesTitle: 'From visibility to conversion.',
        capabilitiesDesc:
          'We do not treat marketing as isolated channels. We synchronize content, acquisition, web UX and analytics to serve unified revenue goals.',
        capabilities: [
          {
            number: '01',
            title: 'Social Media',
            description:
              'Strategic social media management from editorial direction to high-performing content aligned with brand objectives.',
          },
          {
            number: '02',
            title: 'Content Strategy',
            description:
              'Targeted content designed across customer journey stages to showcase expertise and engage qualified prospects.',
          },
          {
            number: '03',
            title: 'Digital Advertising',
            description:
              'Paid media campaigns designed for concrete conversion goals, linking paid traffic, landing pages and sales pipelines.',
          },
          {
            number: '04',
            title: 'Continuous SEO',
            description:
              'Optimizing technical foundation, content architecture and domain authority to capture sustained organic search demand.',
          },
          {
            number: '05',
            title: 'Conversion Rate Optimization (CRO)',
            description:
              'Auditing user journeys and friction points to turn a greater portion of existing traffic into leads and revenue.',
          },
          {
            number: '06',
            title: 'Analytics & Performance',
            description:
              'Full-funnel attribution tracking to measure which campaigns, assets and channels generate genuine commercial returns.',
          },
        ],
        processEyebrow: 'HOW WE WORK',
        processTitle: 'Data-driven growth, free of guesswork.',
        process: [
          {
            number: '01',
            title: 'Measure',
            description:
              'We evaluate your current baselines, audience data, channel performance and market demand before deploying budget.',
          },
          {
            number: '02',
            title: 'Plan',
            description:
              'We map an omnichannel roadmap combining the optimal mix of content, acquisition and UX conversion mechanisms.',
          },
          {
            number: '03',
            title: 'Execute',
            description:
              'We produce assets, launch targeted campaigns, configure tracking and deploy optimized landing pages.',
          },
          {
            number: '04',
            title: 'Optimize',
            description:
              'We analyze user behavior data to continuously refine creatives, bidding strategies and conversion paths.',
          },
        ],
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
        cta: {
          eyebrow: 'GROW WITH DIRECTION',
          title: 'Traffic is only valuable when it drives real business outcomes.',
          description:
            'We assess your market position and craft a predictable digital strategy connecting acquisition, content and conversion to measurable revenue.',
          buttonText: 'GROW MY BUSINESS',
        },
      },
    },

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

    legal: {
      lastUpdated: 'Last updated: August 2026',
    },

    terms: {
      seoTitle: 'Terms of Use | Lumyo',
      seoDescription: 'Read the Terms of Use for the Lumyo website.',
      title: 'Terms of Use',
      sections: [
        {
          title: '1. Purpose',
          paragraphs: [
            'These Terms of Use govern access to and use of the Lumyo website.',
            'By using this website, you agree to use it lawfully and in accordance with these terms.',
          ],
        },
        {
          title: '2. Information about our services',
          paragraphs: [
            'The website provides information about web development, automation, artificial intelligence, digital growth and other digital solutions offered by Lumyo.',
            'The information provided is general in nature and does not, by itself, constitute a binding contractual offer.',
          ],
        },
        {
          title: '3. Proposals and engagement',
          paragraphs: [
            'Each project may have different requirements, scope, timelines and costs. Services will be provided under the specific terms agreed between Lumyo and the client.',
            'Submitting a form or contact request through the website does not imply automatic acceptance of any project and does not, by itself, create a contractual relationship.',
          ],
        },
        {
          title: '4. Use of the website',
          paragraphs: ['You must not:'],
          list: [
            'Use the website for unlawful purposes;',
            'Attempt to gain unauthorised access to systems, servers or information;',
            'Deliberately interfere with the operation or security of the website;',
            'Introduce malicious code or use automated mechanisms intended to disrupt or degrade the service.',
          ],
        },
        {
          title: '5. Intellectual property',
          paragraphs: [
            'Unless otherwise stated, original content on this website, including its visual identity, text, graphic elements, interfaces, animations, code and other materials developed by Lumyo, is protected by applicable intellectual property rights.',
            'Reproduction, distribution, modification or commercial use of this content without authorisation is not permitted, except where allowed by law.',
          ],
        },
        {
          title: '6. Featured projects and brands',
          paragraphs: [
            'The website may feature projects, brands, interfaces or other elements belonging to clients or third parties for portfolio and work presentation purposes.',
            'Third-party brands and content remain the property of their respective owners.',
          ],
        },
        {
          title: '7. Availability and accuracy',
          paragraphs: [
            'We aim to keep the information on the website accurate and up to date, but we do not guarantee that all content will always be available or free from errors.',
            'The website may be modified, suspended or updated without prior notice where necessary for technical, operational or security reasons.',
          ],
        },
        {
          title: '8. External links',
          paragraphs: [
            'The website may include links to third-party websites or services. Lumyo does not control these services and is not responsible for their content, availability or policies.',
          ],
        },
        {
          title: '9. Data protection',
          paragraphs: [
            'The processing of personal data through this website is described in our Privacy Policy and, in relation to cookies and similar technologies, in our Cookie Policy.',
          ],
        },
        {
          title: '10. Changes',
          paragraphs: [
            'Lumyo may update these Terms of Use whenever necessary. The current version will be available on this page.',
          ],
        },
        {
          title: '11. Governing law',
          paragraphs: [
            'These Terms of Use are governed by Portuguese law, without prejudice to any mandatory legal provisions that may apply.',
          ],
        },
        {
          title: '12. Contact',
          paragraphs: [
            'For questions regarding this website or these terms, contact Lumyo using the details provided on our contact page.',
          ],
        },
      ],
    },

    privacy: {
      seoTitle: 'Privacy Policy | Lumyo',
      seoDescription:
        'Read the Lumyo Privacy Policy and learn how we collect, use and protect your personal data.',
      title: 'Privacy Policy',
      sections: [
        {
          title: '1. Data controller',
          paragraphs: [
            'This Privacy Policy describes how Lumyo processes personal data collected through this website and through communications with prospective clients, clients and other users.',
            'Data controller: Fernando Silva\nBrand: Lumyo\nCountry: Portugal\nEmail: fernando.silva@lumyo.pt',
          ],
        },
        {
          title: '2. Personal data we may collect',
          paragraphs: [
            'We may collect information provided directly through forms or other contact channels, including your name, email address, telephone number, company, information about the project or service you are interested in, and the content of messages you send us.',
            'When the user accepts analytics cookies, Microsoft Clarity may process technical and usage data such as device type, browser, pages visited, referral source, clicks and scrolling. Chatbot content is explicitly masked in recordings.',
          ],
        },
        {
          title: '3. Purposes of processing',
          paragraphs: ['Personal data may be processed to:'],
          list: [
            'Respond to contact requests and enquiries;',
            'Assess proposals and potential projects;',
            'Prepare and provide requested services;',
            'Manage client relationships;',
            'Ensure the security and operation of the website;',
            'Analyse website usage and performance, where applicable;',
            'Comply with applicable legal or regulatory obligations.',
          ],
        },
        {
          title: '4. Legal bases for processing',
          paragraphs: [
            'Depending on the purpose, processing may be based on taking pre-contractual steps requested by the data subject, performance of a contract, compliance with legal obligations, Lumyo’s legitimate interests or consent, where legally required.',
          ],
        },
        {
          title: '5. Forms and communications',
          paragraphs: [
            'When you submit a form through the website, the information you provide is used to receive, assess and respond to your request.',
            'The website may use technology providers to support the sending and processing of communications, including infrastructure and email delivery services.',
          ],
        },
        {
          title: '6. Chatbot and artificial intelligence',
          paragraphs: [
            'Lumyo provides an artificial intelligence-based assistant to answer questions, collect information about potential projects, qualify enquiries and enable meeting scheduling.',
            'Messages and data provided during the conversation may be processed through OpenAI to generate responses and extract commercial information, and stored in the Supabase infrastructure used by Lumyo to manage the conversation and potential commercial contact.',
            'You should not provide sensitive, confidential or unnecessary information. Chatbot content is explicitly masked and is not sent to Microsoft Clarity session recordings.',
          ],
        },
        {
          title: '7. Sharing of personal data',
          paragraphs: [
            'Personal data may be processed, where necessary, by providers supporting the website and commercial agent, including Vercel for hosting and application execution, Supabase for database and sessions, OpenAI for conversation processing, Microsoft Clarity for consented usage analytics, and Cal.com when the visitor opens the scheduling service.',
            'These providers should only process personal data to the extent necessary to provide their respective services and in accordance with applicable legal requirements.',
          ],
        },
        {
          title: '8. International data transfers',
          paragraphs: [
            'Some technology providers may process data outside the European Economic Area. Where this occurs, the legally applicable safeguards will be used to ensure an adequate level of protection for personal data.',
          ],
        },
        {
          title: '9. Data retention',
          paragraphs: [
            'Personal data is retained only for as long as necessary for the purposes for which it was collected, to comply with legal obligations or for the periods required to protect legitimate rights and interests.',
            'Contact requests that do not result in a commercial relationship will be deleted or anonymised when they are no longer required, unless there is a legal basis for retaining them.',
          ],
        },
        {
          title: '10. Your rights',
          paragraphs: [
            'Under applicable law, you may request, where applicable, access to your personal data, rectification, erasure, restriction of processing, data portability or objection to processing.',
            'Where processing is based on consent, you may withdraw that consent at any time without affecting the lawfulness of processing carried out before its withdrawal.',
            'To exercise your rights, contact: fernando.silva@lumyo.pt.',
          ],
        },
        {
          title: '11. Complaints',
          paragraphs: [
            'You also have the right to lodge a complaint with the Portuguese Data Protection Authority (Comissão Nacional de Proteção de Dados — CNPD), as the supervisory authority in Portugal.',
          ],
        },
        {
          title: '12. Security',
          paragraphs: [
            'Technical and organisational measures are implemented to protect personal data against unauthorised access, loss, alteration, disclosure or improper destruction.',
          ],
        },
        {
          title: '13. Changes to this policy',
          paragraphs: [
            'This Privacy Policy may be updated whenever there are changes to our services, the technologies we use or applicable legal requirements. The current version will remain available on this page.',
          ],
        },
      ],
    },

    cookieConsent: {
      title: 'Analytics cookies',
      description:
        'We use necessary cookies for the chatbot. With your permission, we also use Microsoft Clarity to understand how the website is used and improve the experience.',
      learnMore: 'Read the Cookie Policy.',
      reject: 'REJECT ANALYTICS',
      accept: 'ACCEPT ANALYTICS',
      manage: 'MANAGE COOKIES',
      currentChoice: 'You can change or withdraw your choice at any time.',
    },

    cookies: {
      seoTitle: 'Cookie Policy | Lumyo',
      seoDescription:
        'Read the Lumyo Cookie Policy and learn which technologies may be used on this website.',
      title: 'Cookie Policy',
      sections: [
        {
          title: '1. What are cookies?',
          paragraphs: [
            'Cookies are small files or similar technologies that may be stored on or accessed from the device used to visit a website.',
            'They may be used to provide technical functionality, store preferences, understand how the website is used or measure the effectiveness of marketing activities.',
          ],
        },
        {
          title: '2. Strictly necessary cookies',
          paragraphs: [
            'The website uses the first-party lumyo_agent_session cookie when a visitor opens the chatbot. It protects and maintains the conversation session, is HttpOnly, SameSite=Lax, Secure in production and has a maximum lifetime of 30 days.',
            'The lumyo_lang and lumyo_analytics_consent preferences are stored locally in the browser to retain the selected language and the analytics cookie decision, respectively. These technologies are necessary to provide requested functionality and remember the user’s choice.',
          ],
        },
        {
          title: '3. Analytics cookies',
          paragraphs: [
            'With consent, Lumyo uses Microsoft Clarity to understand how the website is used, including pages visited, clicks, scrolling, navigation difficulties and session recordings.',
            'Microsoft Clarity and its cookies are only loaded after the user accepts the analytics category. Chatbot content is explicitly masked and is not sent to Clarity recordings.',
          ],
          list: [
            '_clck — retains a pseudonymous visitor identifier and Clarity preferences;',
            '_clsk — connects different page views to the same session;',
            'CLID, ANONCHK, MR, MUID and SM — Microsoft cookies that may be used by Clarity after consent.',
          ],
        },
        {
          title: '4. Advertising and measurement',
          paragraphs: [
            'Lumyo may in the future use advertising and measurement technologies, including Meta Pixel and tools associated with advertising platforms, to measure campaigns, attribute conversions and improve the relevance of marketing activities.',
            'These technologies should not be loaded before consent has been obtained where consent is legally required.',
          ],
        },
        {
          title: '5. Chatbot and external services',
          paragraphs: [
            'The chatbot uses the technical lumyo_agent_session cookie only when it is opened, to create, protect and maintain the conversation session for up to 30 days.',
            'This cookie is strictly necessary for the requested functionality and is not used for advertising or behavioural analytics.',
          ],
        },
        {
          title: '6. Consent',
          paragraphs: [
            'Where the website uses cookies or technologies that are not strictly necessary, consent will be requested before they are activated, in accordance with the options presented through the cookie management mechanism.',
            'Users will be able to accept or reject optional categories and subsequently change their choices.',
          ],
        },
        {
          title: '7. Changing or withdrawing consent',
          paragraphs: [
            'The preference can be reviewed or withdrawn at any time through the “Manage cookies” option in the footer. Subsequent rejection stops Clarity collection and deletes its cookies through Microsoft’s consent mechanism.',
          ],
        },
        {
          title: '8. Third-party cookies',
          paragraphs: [
            'Some functionality may be provided by third parties and may involve the use of their own technologies. When these are activated, the relevant information will be provided in this policy and through the consent management mechanism.',
          ],
        },
        {
          title: '9. Updates',
          paragraphs: [
            'This Cookie Policy will be updated whenever technologies used by the website are added, removed or changed.',
          ],
        },
      ],
    },
  },
};

const LanguageContext = createContext(null);

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

export function useLang() {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error(
      'useLang must be used within LanguageProvider'
    );
  }

  return ctx;
}
