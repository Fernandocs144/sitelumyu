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
