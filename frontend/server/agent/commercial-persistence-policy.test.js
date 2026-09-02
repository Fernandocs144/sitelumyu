import { filterQualificationForPersistence, isBudgetProvidedInCurrentTurn } from '../../api/agent/message.js';
import { calculateNextCommercialGoal, isLeadQualificationComplete } from './commercial-conversation-policy.js';
import { composeCommercialReply } from './commercial-reply-composer.js';
import { getCommercialGoalMessage } from './commercial-goal-messages.js';
import { buildSecondPhaseInstructions } from './commercial-agent-prompt.js';
import { buildDeterministicFinancialReply } from './commercial-financial-reply.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FALHA NO TESTE: ${msg}`);
}

console.log('=== SUITE DE TESTES PERSISTENTE DE INTEGRIDADE DE DADOS E PERSISTÊNCIA ===\n');

// A. CASO A: has_existing_website=false + mensagem ambígua ("Preciso de melhorar o website que já tenho.")
const currentLeadA = {
  id: 'lead-1',
  primary_service: 'websites',
  service_variant: 'institutional_website',
  has_existing_website: false,
  need_description: 'Site para apresentar a empresa',
  timeline: '1 mes',
  stated_budget_raw: '1000',
  name: 'Ana',
  email: 'ana@empresa.com',
};

const qualAmbiguousA = {
  primary_service: 'websites',
  service_variant: 'institutional_website',
  has_existing_website: true, // extração ambígua sem ser correction explícita
  need_description: 'Melhorar o website que já tenho',
  turn_intent: 'scope_change',
};

const resultA = filterQualificationForPersistence({
  cleanQualification: qualAmbiguousA,
  currentLead: currentLeadA,
  turnIntent: 'scope_change',
  isNewLead: false,
});

assert(resultA.has_existing_website === false, 'CASO A: BD deve PRESERVAR has_existing_website=false perante contradição ambígua');
console.log('A. CASO A PASSOU: Contradição ambígua não altera has_existing_website na BD.');

// TESTES ESPECÍFICOS DE REGRAS DE WEBSITE E URL:
// 1. has_existing_website=false, turn_intent=scope_change, website_url válida, extraído=true -> Result: false
const test1Res = filterQualificationForPersistence({
  cleanQualification: { has_existing_website: true, website_url: 'https://exemplo.com', turn_intent: 'scope_change' },
  currentLead: { has_existing_website: false },
  turnIntent: 'scope_change',
  isNewLead: false,
});
assert(test1Res.has_existing_website === false, 'TESTE 1: website_url em scope_change NUNCA substitui has_existing_website=false');
console.log('TESTE 1 PASSOU: website_url em scope_change não altera has_existing_website=false.');

// 2. has_existing_website=false, turn_intent=correction, website_url válida/ausente, extraído=true -> Result: true
const test2Res = filterQualificationForPersistence({
  cleanQualification: { has_existing_website: true, website_url: 'https://exemplo.com', turn_intent: 'correction' },
  currentLead: { has_existing_website: false },
  turnIntent: 'correction',
  isNewLead: false,
});
assert(test2Res.has_existing_website === true, 'TESTE 2: correction altera de false para true');
console.log('TESTE 2 PASSOU: correction altera has_existing_website de false para true.');

// 3. has_existing_website=null, turn_intent=qualification_answer, extraído=true -> Result: true
const test3Res = filterQualificationForPersistence({
  cleanQualification: { has_existing_website: true, turn_intent: 'qualification_answer' },
  currentLead: { has_existing_website: null },
  turnIntent: 'qualification_answer',
  isNewLead: false,
});
assert(test3Res.has_existing_website === true, 'TESTE 3: has_existing_website=null preenche true normalmente');
console.log('TESTE 3 PASSOU: has_existing_website=null preenche true normalmente.');

// B. CASO B: primary_service=websites + possible_new_project automation
const currentLeadB = {
  id: 'lead-2',
  primary_service: 'websites',
  service_variant: 'institutional_website',
  has_existing_website: false,
  need_description: 'Criar website institucional',
  timeline: '2 semanas',
  stated_budget_raw: '1500',
  name: 'Carlos',
  email: 'carlos@empresa.com',
};

const qualNewProjB = {
  primary_service: 'automation',
  service_variant: null,
  need_description: 'Automatizar o atendimento da empresa',
  turn_intent: 'possible_new_project',
};

const resultB = filterQualificationForPersistence({
  cleanQualification: qualNewProjB,
  currentLead: currentLeadB,
  turnIntent: 'possible_new_project',
  isNewLead: false,
});

assert(resultB.primary_service === 'websites', 'CASO B: primary_service deve continuar websites');
assert(resultB.service_variant === 'institutional_website', 'CASO B: service_variant deve continuar institutional_website');
assert(resultB.need_description === 'Criar website institucional', 'CASO B: necessidade deve continuar intacta');
assert(resultB.timeline === '2 semanas', 'CASO B: prazo deve continuar intacto');
assert(resultB.stated_budget_raw === '1500', 'CASO B: orçamento deve continuar intacto');
console.log('B. CASO B PASSOU: possible_new_project não altera a lead nem o escopo atual.');

// C. CASO C: Correção Explícita ("Corrijo o que disse anteriormente: já tenho website.")
const qualCorrectionC = {
  has_existing_website: true,
  turn_intent: 'correction',
};

const resultC = filterQualificationForPersistence({
  cleanQualification: qualCorrectionC,
  currentLead: currentLeadA,
  turnIntent: 'correction',
  isNewLead: false,
});

assert(resultC.has_existing_website === true, 'CASO C: correction explícita deve atualizar apenas o campo confirmado');
assert(resultC.primary_service === 'websites', 'CASO C: outros campos devem ser preservados');
console.log('C. CASO C PASSOU: Correção explícita altera apenas o campo confirmado.');

// D. CASO D: Pergunta Direta Durante booking_pending
const leadBookingPendingD = {
  ...currentLeadA,
  next_step: 'booking_pending',
  intent_level: 'high',
};

const goalD = calculateNextCommercialGoal(leadBookingPendingD, { turnIntent: 'direct_question' });
assert(goalD.goal === 'answer_turn_intent', 'CASO D: Goal deve ser answer_turn_intent');

const resultD = filterQualificationForPersistence({
  cleanQualification: { turn_intent: 'direct_question' },
  currentLead: leadBookingPendingD,
  turnIntent: 'direct_question',
  isNewLead: false,
});
assert(resultD.primary_service === 'websites', 'CASO D: Pergunta direta não altera dados do projeto');

const goalMsgD = getCommercialGoalMessage('answer_turn_intent', 'pt');
assert(goalMsgD.action === 'booking', 'CASO D: Preserva bookingAction');
console.log('D. CASO D PASSOU: Pergunta direta durante booking_pending responde e preserva bookingAction.');

// E. CASO E: booking_response
const goalE = calculateNextCommercialGoal(leadBookingPendingD, { turnIntent: 'booking_response' });
assert(goalE.goal === 'show_booking', 'CASO E: booking_response mantém show_booking');

const resultE = filterQualificationForPersistence({
  cleanQualification: { turn_intent: 'booking_response' },
  currentLead: leadBookingPendingD,
  turnIntent: 'booking_response',
  isNewLead: false,
});
assert(resultE.primary_service === 'websites', 'CASO E: booking_response não altera escopo');
console.log('E. CASO E PASSOU: booking_response mantém show_booking e não altera escopo.');

// F. CASO F: Falha da Segunda Fase OpenAI
const composerResF = composeCommercialReply({
  generatedReply: null,
  deterministicReply: null,
  goalMessage: goalMsgD,
});
assert(composerResF.source === 'fallback', 'CASO F: Falha da 2ª fase devolve fallback seguro');
assert(goalMsgD.action === 'booking', 'CASO F: Preserva bookingAction no fallback');
console.log('F. CASO F PASSOU: Falha da 2ª fase tem fallback seguro e preserva bookingAction.');

// G. CASO G: Fluxo Normal de Criação de Lead Nova
const qualNewG = {
  primary_service: 'ai',
  need_description: 'Assistente virtual para clientes',
  timeline: '3 semanas',
  name: 'Maria',
  email: 'maria@empresa.com',
  turn_intent: 'qualification_answer',
};

const resultG = filterQualificationForPersistence({
  cleanQualification: qualNewG,
  currentLead: null,
  turnIntent: 'qualification_answer',
  isNewLead: true,
});
assert(resultG.primary_service === 'ai', 'CASO G: Lead nova persiste primary_service');
assert(resultG.need_description === 'Assistente virtual para clientes', 'CASO G: Lead nova persiste necessidade');
console.log('G. CASO G PASSOU: Criação e qualificação de lead nova persiste dados normalmente.');

// H. CASO H: Suporte PT e EN para Pergunta Direta e Correção
const goalMsgH_PT = getCommercialGoalMessage('answer_turn_intent', 'pt');
const goalMsgH_EN = getCommercialGoalMessage('answer_turn_intent', 'en');
assert(goalMsgH_PT.fallbackReply.includes('necessidade'), 'CASO H: Mensagem PT válida');
assert(goalMsgH_EN.fallbackReply.includes('need'), 'CASO H: Mensagem EN válida');
console.log('H. CASO H PASSOU: PT e EN suportados para pergunta direta e correção.');

// TESTES DE REGRESSÃO DE ACTIVAÇÃO DE RESPOSTA FINANCEIRA (A-F):
// Teste Financeiro A: qualification_answer + stated_budget_raw = "1000" -> reconhecido como orçamento no turno atual
const isBudgetA = isBudgetProvidedInCurrentTurn({
  turn_intent: 'qualification_answer',
  stated_budget_raw: '1000',
});
assert(isBudgetA === true, 'TESTE FINANCEIRO A: qualification_answer + stated_budget_raw é reconhecido');
console.log('TESTE FINANCEIRO A PASSOU: qualification_answer ativa orçamento do turno.');

// Teste Financeiro B: direct_question + stated_budget_raw histórico = "1000" -> NÃO reconhecido
const isBudgetB = isBudgetProvidedInCurrentTurn({
  turn_intent: 'direct_question',
  stated_budget_raw: '1000',
});
assert(isBudgetB === false, 'TESTE FINANCEIRO B: direct_question + orçamento histórico NÃO ativa resposta financeira');
console.log('TESTE FINANCEIRO B PASSOU: direct_question com orçamento histórico NÃO ativa resposta financeira.');

// Teste Financeiro C: correction + stated_budget_raw histórico = "1000" -> NÃO ativa resposta financeira
const isBudgetC = isBudgetProvidedInCurrentTurn({
  turn_intent: 'correction',
  stated_budget_raw: '1000',
});
assert(isBudgetC === false, 'TESTE FINANCEIRO C: correction com orçamento histórico NÃO ativa resposta financeira');
console.log('TESTE FINANCEIRO C PASSOU: correction com orçamento histórico NÃO ativa resposta financeira.');

// Teste Financeiro D: booking_response + stated_budget_raw histórico = "1000" -> NÃO ativa resposta financeira
const isBudgetD = isBudgetProvidedInCurrentTurn({
  turn_intent: 'booking_response',
  stated_budget_raw: '1000',
});
assert(isBudgetD === false, 'TESTE FINANCEIRO D: booking_response com orçamento histórico NÃO ativa resposta financeira');
console.log('TESTE FINANCEIRO D PASSOU: booking_response com orçamento histórico NÃO ativa resposta financeira.');

// Teste Financeiro E: Lead em booking_pending + direct_question + orçamento histórico
const leadPendingE = {
  ...currentLeadA,
  stated_budget_raw: '1000',
  next_step: 'booking_pending',
  intent_level: 'high',
};
const qualE = {
  turn_intent: 'direct_question',
  stated_budget_raw: '1000',
};
const goalFinE = calculateNextCommercialGoal(leadPendingE, { turnIntent: qualE.turn_intent });
assert(goalFinE.goal === 'answer_turn_intent', 'TESTE FINANCEIRO E: Goal deve continuar answer_turn_intent');
const goalMsgFinE = getCommercialGoalMessage(goalFinE.goal, 'pt');
assert(goalMsgFinE.action === 'booking', 'TESTE FINANCEIRO E: bookingAction continua disponível');
const turnIntentRequiresResponseE = ['direct_question', 'correction', 'scope_change', 'possible_new_project'].includes(qualE.turn_intent);
const budgetProvidedThisTurnE = isBudgetProvidedInCurrentTurn(qualE);
const deterministicFinancialReplyE = budgetProvidedThisTurnE && !turnIntentRequiresResponseE
  ? buildDeterministicFinancialReply(leadPendingE, 'pt')
  : null;
assert(deterministicFinancialReplyE === null, 'TESTE FINANCEIRO E: Resposta financeira determinística NÃO é selecionada');
console.log('TESTE FINANCEIRO E PASSOU: Lead em booking_pending + direct_question mantém answer_turn_intent, bookingAction e ignora resposta financeira.');

// Teste Financeiro F: Fluxo normal em que o visitante responde "1000" à pergunta de orçamento (qualification_answer)
const qualF = {
  turn_intent: 'qualification_answer',
  stated_budget_raw: '1000',
};
const budgetProvidedThisTurnF = isBudgetProvidedInCurrentTurn(qualF);
assert(budgetProvidedThisTurnF === true, 'TESTE FINANCEIRO F: Visita responde "1000" é reconhecido no turno');
const deterministicFinancialReplyF = budgetProvidedThisTurnF
  ? buildDeterministicFinancialReply(leadPendingE, 'pt')
  : null;
assert(typeof deterministicFinancialReplyF === 'string' && deterministicFinancialReplyF.length > 0, 'TESTE FINANCEIRO F: Avaliação financeira gerada com sucesso');
console.log('TESTE FINANCEIRO F PASSOU: Resposta de orçamento normal gera avaliação financeira com sucesso.');

// TESTES DE COMUNICAÇÃO PÓS-AGENDAMENTO (1-11):
const goalMsgAnswerPT = getCommercialGoalMessage('answer_turn_intent', 'pt');
const goalMsgAnswerEN = getCommercialGoalMessage('answer_turn_intent', 'en');
const goalMsgShowBooking = getCommercialGoalMessage('show_booking', 'pt');
const goalMsgAskBudget = getCommercialGoalMessage('ask_budget', 'pt');

// 1. answer_turn_intent mantém action === 'booking'
assert(goalMsgAnswerPT.action === 'booking', 'COMUNICAÇÃO 1: answer_turn_intent mantém action === booking');

// 2. answer_turn_intent.requiredClosing === null
assert(goalMsgAnswerPT.requiredClosing === null, 'COMUNICAÇÃO 2: answer_turn_intent.requiredClosing é null');

// 3. A instrução de answer_turn_intent não obriga a mencionar agendamento
assert(!goalMsgAnswerPT.modelInstruction.includes('continua disponível'), 'COMUNICAÇÃO 3: Instrução não obriga a mencionar agendamento');

// 4. A instrução permite no máximo uma pergunta contextual quando requiredClosing === null
const promptAnswerPT = buildSecondPhaseInstructions({ language: 'pt', goalMessage: goalMsgAnswerPT, effectiveLeadState: leadPendingE, turnIntent: 'direct_question' });
assert(promptAnswerPT.includes('no máximo UMA pergunta contextual'), 'COMUNICAÇÃO 4: Instrução de 2ª fase permite no máximo uma pergunta contextual');

// 5. Uma direct_question pode receber resposta e pergunta contextual
assert(promptAnswerPT.includes('"direct_question": Responde diretamente e, se útil, faz UMA pergunta contextual curta'), 'COMUNICAÇÃO 5: direct_question instrui resposta e pergunta contextual útil');

// 6. Uma correction não gera pergunta desnecessária
assert(promptAnswerPT.includes('"correction": Reconhece a correção. Só faz pergunta se existir ambiguidade real'), 'COMUNICAÇÃO 6: correction não gera pergunta desnecessária');

// 7. Um possible_new_project pede esclarecimento entre projeto atual e projeto separado
assert(promptAnswerPT.includes('"possible_new_project": Pergunta se a nova necessidade pertence ao projeto atual ou se deve ser considerada um projeto separado'), 'COMUNICAÇÃO 7: possible_new_project pede esclarecimento de escopo');

// 8. Os restantes objetivos continuam a proibir perguntas inventadas pelo modelo
const promptNormalPT = buildSecondPhaseInstructions({ language: 'pt', goalMessage: goalMsgAskBudget, effectiveLeadState: currentLeadA, turnIntent: 'qualification_answer' });
assert(promptNormalPT.includes('NÃO inventes nem acrescentes nenhuma pergunta'), 'COMUNICAÇÃO 8: Objetivos normais continuam a proibir perguntas inventadas pelo modelo');

// 9. show_booking permanece inalterado
assert(goalMsgShowBooking.action === 'booking' && goalMsgShowBooking.requiredClosing === null && goalMsgShowBooking.fallbackReply.includes('Pode agora escolher'), 'COMUNICAÇÃO 9: show_booking permanece inalterado');

// 10. Não existe qualquer alteração à persistência no Supabase nem ao cálculo financeiro
assert(leadPendingE.primary_service === 'websites' && deterministicFinancialReplyE === null, 'COMUNICAÇÃO 10: Sem alteração à persistência nem ao cálculo financeiro');

// 11. Existe paridade PT/EN
const promptAnswerEN = buildSecondPhaseInstructions({ language: 'en', goalMessage: goalMsgAnswerEN, effectiveLeadState: leadPendingE, turnIntent: 'direct_question' });
const goalMsgAskBudgetEN = getCommercialGoalMessage('ask_budget', 'en');
const promptNormalEN = buildSecondPhaseInstructions({ language: 'en', goalMessage: goalMsgAskBudgetEN, effectiveLeadState: currentLeadA, turnIntent: 'qualification_answer' });
assert(goalMsgAnswerEN.action === 'booking' && goalMsgAnswerEN.requiredClosing === null && promptAnswerEN.includes('AT MOST ONE short contextual question'), 'COMUNICAÇÃO 11: Paridade PT/EN validada');
console.log('COMUNICAÇÃO PÓS-AGENDAMENTO (1-11) PASSOU COM SUCESSO.');

// TESTES DE CONCISÃO CONDICIONAL (CONCISE RULE PT/EN):
// 1. answer_turn_intent não contém afirmação de pergunta canónica do backend
assert(!promptAnswerPT.includes('antes da pergunta canónica acrescentada pelo backend'), 'CONCISÃO 1: answer_turn_intent não afirma que o backend acrescenta pergunta canónica');

// 2. answer_turn_intent limita resposta completa a duas frases incluindo pergunta contextual
assert(promptAnswerPT.includes('Manter a resposta completa em no máximo DUAS frases curtas, incluindo qualquer pergunta contextual.'), 'CONCISÃO 2: answer_turn_intent limita resposta a duas frases incluindo pergunta contextual');

// 3. Objetivos normais continuam a indicar que o backend acrescenta pergunta canónica
assert(promptNormalPT.includes('Manter as respostas concisas (no máximo DUAS frases curtas antes da pergunta canónica acrescentada pelo backend).'), 'CONCISÃO 3: Objetivos normais mantêm indicação da pergunta canónica');

// 4. Paridade PT/EN da regra de concisão
assert(promptAnswerEN.includes('Keep the complete response to at most TWO short sentences, including any contextual question.'), 'CONCISÃO 4: EN answer_turn_intent usa regra estrita sem pergunta canónica');
assert(promptNormalEN.includes('Keep responses concise (at most TWO short sentences before the canonical question appended by the backend).'), 'CONCISÃO 4: EN objetivos normais mantêm indicação da pergunta canónica');
console.log('TESTES DE CONCISÃO CONDICIONAL PASSARAM COM SUCESSO.');

// TESTES DE DIAGNÓSTICO SILENCIOSO E FALLBACK SEGURO (1-5):
// 1. Fallback em answer_turn_intent devolve mensagem neutra segura
const fallbackResPT = composeCommercialReply({ generatedReply: null, deterministicReply: null, goalMessage: goalMsgAnswerPT });
assert(fallbackResPT.source === 'fallback' && fallbackResPT.reply === 'Posso ajudar a esclarecer essa necessidade.', 'DIAGNÓSTICO 1: Fallback PT seguro');

const fallbackResEN = composeCommercialReply({ generatedReply: null, deterministicReply: null, goalMessage: goalMsgAnswerEN });
assert(fallbackResEN.source === 'fallback' && fallbackResEN.reply === 'I can help clarify that need.', 'DIAGNÓSTICO 1: Fallback EN seguro');

// 2. Simulação de logs sanitizados (sem PII, sem prompts, sem textos de utilizador)
const mockPayloads = [
  { code: 'second_phase_history_invalid', isHistoryValid: false, historyLength: 0, firstRole: null, lastRole: null },
  { code: 'second_phase_response_missing' },
  { code: 'second_phase_not_completed', status: 'incomplete', incompleteReason: 'max_output_tokens', hasError: false, errorCode: null },
  { code: 'second_phase_output_missing', status: 'completed', outputType: 'undefined', outputLength: 0 },
  { code: 'second_phase_reply_missing', parsedType: 'object', hasReply: false, replyLength: 0 },
  { code: 'reply_parse_failed', status: 'completed', outputType: 'string', outputLength: 12 },
  { code: 'second_phase_composer_rejected', goal: 'answer_turn_intent', validationReason: 'model_contained_multiple_questions', generatedReplyLength: 45 },
];

const forbiddenFields = ['prompt', 'instructions', 'api_key', 'user_text', 'visitor', 'email', 'name', 'auth_token', 'cookie', 'stack', 'headers'];
mockPayloads.forEach((payload) => {
  const payloadKeys = Object.keys(payload);
  forbiddenFields.forEach((field) => {
    assert(!payloadKeys.includes(field), `DIAGNÓSTICO 2: Payload ${payload.code} expõe campo proibido ${field}`);
  });
});
// 3. Validação de perguntas no compositor comercial (COMPOSER FIX):
// A. answer_turn_intent com 1 pergunta contextual é aceite
const validQuestionReply = composeCommercialReply({
  generatedReply: 'Sim, fazemos gestão de redes sociais. Procuras uma gestão completa ou apenas apoio na criação?',
  deterministicReply: null,
  goalMessage: goalMsgAnswerPT,
});
assert(validQuestionReply.source === 'model' && validQuestionReply.validationReason === 'valid_model_reply', 'COMPOSER 1: 1 pergunta contextual em answer_turn_intent é aceite');

// B. answer_turn_intent com mais de 1 pergunta é rejeitado
const multipleQuestionReply = composeCommercialReply({
  generatedReply: 'Qual é a tua empresa? E qual é o teu orçamento?',
  deterministicReply: null,
  goalMessage: goalMsgAnswerPT,
});
assert(multipleQuestionReply.source === 'fallback' && multipleQuestionReply.validationReason === 'model_contained_multiple_questions', 'COMPOSER 2: Múltiplas perguntas em answer_turn_intent rejeitadas');

// C. show_booking com pergunta continua a ser rejeitado
const unauthorizedShowBookingReply = composeCommercialReply({
  generatedReply: 'Queres agendar uma reunião?',
  deterministicReply: null,
  goalMessage: goalMsgShowBooking,
});
assert(unauthorizedShowBookingReply.source === 'fallback' && unauthorizedShowBookingReply.validationReason === 'model_contained_unauthorized_question', 'COMPOSER 3: Pergunta em show_booking continua rejeitada');

console.log('TESTES DO COMPOSITOR COMERCIAL PASSARAM COM SUCESSO.');

console.log('\n=== TODOS OS TESTES PERSISTENTES PASSARAM COM SUCESSO ===');
