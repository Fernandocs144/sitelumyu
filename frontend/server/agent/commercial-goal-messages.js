/**
 * Catálogo determinístico bilingue de instruções, perguntas finais, fallbacks e ações para cada objetivo comercial.
 * Função pura e síncrona sem efeitos secundários nem dependências externas.
 */

export function getCommercialGoalMessage(goal, language) {
  const lang = language === 'en' ? 'en' : 'pt';
  const cleanGoal = typeof goal === 'string' ? goal.trim() : null;

  switch (cleanGoal) {
    case 'identify_service':
      return {
        goal: 'identify_service',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What type of solution would you like to develop: a website, automation, an AI solution, or digital growth?'
          : 'Que tipo de solução pretende desenvolver: website, automação, solução de IA ou crescimento digital?',
        fallbackReply: lang === 'en'
          ? 'What type of solution would you like to develop: a website, automation, an AI solution, or digital growth?'
          : 'Que tipo de solução pretende desenvolver: website, automação, solução de IA ou crescimento digital?',
        action: 'none',
      };

    case 'clarify_need':
      return {
        goal: 'clarify_need',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What is the main need or result you want to achieve with this project?'
          : 'Qual é a principal necessidade ou resultado que pretende alcançar com este projeto?',
        fallbackReply: lang === 'en'
          ? 'What is the main need or result you want to achieve with this project?'
          : 'Qual é a principal necessidade ou resultado que pretende alcançar com este projeto?',
        action: 'none',
      };

    case 'identify_website_variant':
      return {
        goal: 'identify_website_variant',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'Do you need a landing page, a company website, an online store, or a custom web solution?'
          : 'Pretende uma landing page, um website institucional, uma loja online ou uma solução web personalizada?',
        fallbackReply: lang === 'en'
          ? 'Do you need a landing page, a company website, an online store, or a custom web solution?'
          : 'Pretende uma landing page, um website institucional, uma loja online ou uma solução web personalizada?',
        action: 'none',
      };

    case 'ask_existing_website':
      return {
        goal: 'ask_existing_website',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'Do you already have a website? If so, can you share its address?'
          : 'Já tem um website? Se sim, pode indicar o endereço?',
        fallbackReply: lang === 'en'
          ? 'Do you already have a website? If so, can you share its address?'
          : 'Já tem um website? Se sim, pode indicar o endereço?',
        action: 'none',
      };

    case 'ask_timeline':
      return {
        goal: 'ask_timeline',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What is your expected timeframe for launching or implementing the project?'
          : 'Qual é o prazo previsto para lançar ou implementar o projeto?',
        fallbackReply: lang === 'en'
          ? 'What is your expected timeframe for launching or implementing the project?'
          : 'Qual é o prazo previsto para lançar ou implementar o projeto?',
        action: 'none',
      };

    case 'ask_company_context':
      return {
        goal: 'ask_company_context',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Acknowledge only facts already provided. Do not invent company details, do not mention prices or meetings, and do not ask additional questions. The system will append the company context question.'
          : 'Reconheça apenas os factos já fornecidos. Não invente dados da empresa, não mencione preços nem reuniões e não faça perguntas adicionais. O sistema adicionará a pergunta sobre o contexto da empresa.',
        requiredClosing: lang === 'en'
          ? 'What is the name of your company and what is its main business activity?'
          : 'Qual é o nome da sua empresa e qual é a sua principal atividade?',
        fallbackReply: lang === 'en'
          ? 'What is the name of your company and what is its main business activity?'
          : 'Qual é o nome da sua empresa e qual é a sua principal atividade?',
        action: 'none',
      };

    case 'ask_target_audience':
      return {
        goal: 'ask_target_audience',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Acknowledge the company context concisely. Do not invent customer segments, do not mention prices or meetings, and do not ask additional questions. The system will append the target audience question.'
          : 'Reconheça sucintamente o contexto da empresa. Não invente segmentos de clientes, não mencione preços nem reuniões e não faça perguntas adicionais. O sistema adicionará a pergunta sobre o público-alvo.',
        requiredClosing: lang === 'en'
          ? 'Who are the main customers or target audience of your company?'
          : 'Quem são os principais clientes ou o público-alvo da sua empresa?',
        fallbackReply: lang === 'en'
          ? 'Who are the main customers or target audience of your company?'
          : 'Quem são os principais clientes ou o público-alvo da sua empresa?',
        action: 'none',
      };

    case 'ask_company_name':
      return {
        goal: 'ask_company_name',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Acknowledge the business activity already provided. Do not invent company details, mention prices or meetings, or ask additional questions. The system will append the company name question.'
          : 'Reconheça a atividade já indicada. Não invente dados da empresa, não mencione preços nem reuniões e não faça perguntas adicionais. O sistema adicionará a pergunta sobre o nome da empresa.',
        requiredClosing: lang === 'en' ? 'What is the name of your company?' : 'Qual é o nome da sua empresa?',
        fallbackReply: lang === 'en' ? 'What is the name of your company?' : 'Qual é o nome da sua empresa?',
        action: 'none',
      };

    case 'ask_company_activity':
      return {
        goal: 'ask_company_activity',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Acknowledge the company name already provided. Do not invent company details, mention prices or meetings, or ask additional questions. The system will append the business activity question.'
          : 'Reconheça o nome da empresa já indicado. Não invente dados empresariais, não mencione preços nem reuniões e não faça perguntas adicionais. O sistema adicionará a pergunta sobre a atividade.',
        requiredClosing: lang === 'en' ? 'What is the main business activity of your company?' : 'Qual é a principal atividade da sua empresa?',
        fallbackReply: lang === 'en' ? 'What is the main business activity of your company?' : 'Qual é a principal atividade da sua empresa?',
        action: 'none',
      };

    case 'ask_operational_impact':
      return {
        goal: 'ask_operational_impact',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Acknowledge the target audience concisely. Do not invent business impact, do not mention prices or meetings, and do not ask additional questions. The system will append the business result question.'
          : 'Reconheça sucintamente o público-alvo indicado. Não invente impacto empresarial, não mencione preços nem reuniões e não faça perguntas adicionais. O sistema adicionará a pergunta sobre o resultado de negócio.',
        requiredClosing: lang === 'en'
          ? 'What current problem should this project solve, or what business result do you want it to achieve?'
          : 'Que problema atual deve este projeto resolver ou que resultado pretende alcançar para a empresa?',
        fallbackReply: lang === 'en'
          ? 'What current problem should this project solve, or what business result do you want it to achieve?'
          : 'Que problema atual deve este projeto resolver ou que resultado pretende alcançar para a empresa?',
        action: 'none',
      };

    case 'ask_contact':
      return {
        goal: 'ask_contact',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'Could you share your name and email address?'
          : 'Pode indicar o seu nome e email?',
        fallbackReply: lang === 'en'
          ? 'Could you share your name and email address?'
          : 'Pode indicar o seu nome e email?',
        action: 'none',
      };

    case 'ask_name':
      return {
        goal: 'ask_name',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What is your name?'
          : 'Qual é o seu nome?',
        fallbackReply: lang === 'en'
          ? 'What is your name?'
          : 'Qual é o seu nome?',
        action: 'none',
      };

    case 'ask_email':
      return {
        goal: 'ask_email',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What is your contact email?'
          : 'Qual é o seu email de contacto?',
        fallbackReply: lang === 'en'
          ? 'What is your contact email?'
          : 'Qual é o seu email de contacto?',
        action: 'none',
      };

    case 'ask_budget':
      return {
        goal: 'ask_budget',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'What amount or range were you planning to invest in this project?'
          : 'Que valor ou intervalo tinha previsto investir neste projeto?',
        fallbackReply: lang === 'en'
          ? 'What amount or range were you planning to invest in this project?'
          : 'Que valor ou intervalo tinha previsto investir neste projeto?',
        action: 'none',
      };

    case 'propose_meeting':
      return {
        goal: 'propose_meeting',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'First respond concisely and directly to any question from the visitor. Acknowledge only facts present in the history. Do not ask questions, do not propose meetings or commercial steps, and end without a question mark. The system will append the closing question.'
          : 'Responda primeiro de forma curta e direta a qualquer pergunta do visitante. Reconheça apenas factos presentes no histórico. Não faça perguntas, não proponha reuniões ou passos comerciais e termine sem ponto de interrogação. O sistema adicionará a pergunta final.',
        requiredClosing: lang === 'en'
          ? 'Would you like to schedule a 30-minute diagnostic meeting with the Lumyo team?'
          : 'Gostaria de agendar uma reunião de diagnóstico de 30 minutos com a equipa Lumyo?',
        fallbackReply: lang === 'en'
          ? 'Would you like to schedule a 30-minute diagnostic meeting with the Lumyo team?'
          : 'Gostaria de agendar uma reunião de diagnóstico de 30 minutos com a equipa Lumyo?',
        action: 'none',
      };

    case 'show_booking':
      return {
        goal: 'show_booking',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Briefly inform the visitor that they can choose a time using the booking action provided. Do not include URLs, do not suggest specific availability, and do not claim the meeting is already scheduled. Do not ask questions.'
          : 'Indique sucintamente que o visitante pode escolher um horário através do botão de agendamento disponível. Não inclua URLs, não sugira disponibilidade específica e não diga que a reunião já está agendada. Não faça perguntas.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'You can now choose an available time for the diagnostic meeting.'
          : 'Pode agora escolher um horário disponível para a reunião de diagnóstico.',
        action: 'booking',
      };

    case 'answer_turn_intent':
      return {
        goal: 'answer_turn_intent',
        language: lang,
        modelInstruction: lang === 'en'
          ? "Respond concisely and directly to the visitor's most recent message. Use at most two short sentences. Do not repeat budget, project summary, or previously collected data. You may end with at most ONE short contextual question if it helps clarify their doubt or new requirement. Do NOT mention meetings, links, buttons, or scheduling, and do NOT restart qualification."
          : 'Responda de forma concisa e direta à mensagem mais recente do visitante. Utilize no máximo duas frases curtas. Não repita orçamento, resumo do projeto nem dados já recolhidos. Pode terminar com no máximo UMA pergunta contextual curta se esta ajudar a esclarecer a dúvida ou nova necessidade. NÃO mencione reuniões, links, botões nem agendamento, e NÃO reinicie a qualificação.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'I can help clarify that need.'
          : 'Posso ajudar a esclarecer essa necessidade.',
        action: 'booking',
      };

    case 'human_contact_requested':
      return {
        goal: 'human_contact_requested',
        language: lang,
        modelInstruction: lang === 'en'
          ? 'Briefly acknowledge the human contact request. Do not promise an immediate or completed contact, and do not ask questions.'
          : 'Reconheça sucintamente o pedido de contacto humano. Não prometa um contacto já realizado ou imediato e não faça perguntas.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'I have recorded your contact request. The Lumyo team can follow up on the project using the details provided.'
          : 'Registei o seu pedido de contacto. A equipa Lumyo poderá dar seguimento ao projeto através dos dados fornecidos.',
        action: 'human_contact',
      };

    case 'follow_up_later':
      return {
        goal: 'follow_up_later',
        language: lang,
        modelInstruction: lang === 'en'
          ? "Respect the visitor's decision to consider or follow up later. Answer any direct question, do not press for a meeting, do not resume qualification, and do not ask questions."
          : 'Respeite a decisão do visitante de ponderar ou agendar mais tarde. Responda a eventual dúvida direta, não insista no agendamento, não retome a qualificação e não faça perguntas.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'No problem. You can return to this conversation when you are ready to proceed.'
          : 'Sem problema. Pode retomar esta conversa quando estiver preparado para avançar.',
        action: 'none',
      };

    case 'no_commercial_action':
      return {
        goal: 'no_commercial_action',
        language: lang,
        modelInstruction: lang === 'en'
          ? "Respond politely and helpfully to any direct question about Lumyo's services. Do not propose meetings, budget, or contact, and do not ask questions."
          : 'Responda com cortesia e utilidade a qualquer dúvida direta sobre os serviços da Lumyo. Não proponha reuniões, orçamento ou contacto e não faça perguntas.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'Understood. If you need clarification about Lumyo\'s services, I can help.'
          : 'Compreendido. Se precisar de esclarecer alguma questão sobre os serviços da Lumyo, posso ajudar.',
        action: 'none',
      };

    default:
      return {
        goal: 'no_commercial_action',
        language: lang,
        modelInstruction: lang === 'en'
          ? "Respond politely and helpfully to any direct question about Lumyo's services. Do not propose meetings, budget, or contact, and do not ask questions."
          : 'Responda com cortesia e utilidade a qualquer dúvida direta sobre os serviços da Lumyo. Não proponha reuniões, orçamento ou contacto e não faça perguntas.',
        requiredClosing: null,
        fallbackReply: lang === 'en'
          ? 'I can help clarify any questions about Lumyo\'s services.'
          : 'Posso ajudar a esclarecer alguma questão sobre os serviços da Lumyo.',
        action: 'none',
      };
  }
}
