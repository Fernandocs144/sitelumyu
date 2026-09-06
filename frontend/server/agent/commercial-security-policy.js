import { normalizeCommercialMessageForFingerprint } from './commercial-request-limits.js';

const PROMPT_INJECTION_PATTERNS = Object.freeze([
  /\b(?:ignora|esquece|desconsidera) (?:todas? as |as )?(?:instrucoes|regras)(?: anteriores| do sistema)?\b/,
  /\b(?:ignore|forget|disregard) (?:all )?(?:previous |prior |system )?(?:instructions|rules)\b/,
  /\b(?:mostra|revela|copia|imprime|repete|diz me) (?:o |as |a )?(?:teu |tuas? )?(?:prompt(?: de sistema)?|instrucoes internas|regras internas|mensagem de sistema|segredos|variaveis de ambiente|chave da api|api key)\b/,
  /\b(?:show|reveal|copy|print|repeat|tell me) (?:your |the )?(?:system prompt|internal instructions|hidden rules|system message|secrets|environment variables|api key)\b/,
  /\b(?:a partir de agora|doravante) (?:es|tu es|age como|atua como)\b/,
  /\bfrom now on (?:you are|act as|behave as)\b/,
  /\b(?:act as|enable|enter) (?:dan|developer mode|jailbreak mode)\b/,
  /\b(?:jailbreak|bypass) (?:as |the )?(?:regras|restricoes|rules|restrictions|safety)\b/,
  /\b(?:codifica|encode) (?:o |your |the )?(?:prompt|system prompt|instrucoes) (?:em |in )?(?:base64|hex)\b/,
]);

const LEGITIMATE_SECURITY_DISCUSSION_PATTERNS = Object.freeze([
  /\b(?:como (?:podem |conseguem )?|podem |conseguem )(?:proteger|prevenir|detetar|bloquear) (?:um |o )?(?:assistente|chatbot|agente) (?:contra |de )?(?:prompt injection|instrucoes maliciosas)\b/,
  /\b(?:how do you|can you) (?:protect|prevent|detect|block) (?:an? |the )?(?:assistant|chatbot|agent) (?:against |from )?(?:prompt injection|malicious instructions)\b/,
]);

const OFF_TOPIC_PATTERNS = Object.freeze([
  /^(?:qual e|diz me) (?:a capital|o resultado do jogo|a previsao do tempo)\b/,
  /^(?:quem e|quem foi) (?:o presidente|a presidente|o primeiro ministro|a primeira ministra)\b/,
  /^(?:escreve|faz|cria) (?:me )?(?:um poema|uma historia|os meus trabalhos de casa)\b/,
  /^(?:conta|diz) (?:me )?(?:uma piada|o meu horoscopo)\b/,
  /^(?:da|diz|ensina) (?:me )?(?:uma receita|a receita)\b/,
  /^(?:resolve|calcula) (?:esta |a )?(?:equacao|conta)\b/,
  /^(?:what is|tell me) (?:the capital|the weather|the football score)\b/,
  /^(?:who is|who was) (?:the president|the prime minister)\b/,
  /^(?:write|make|create) (?:me )?(?:a poem|a story|my homework)\b/,
  /^(?:tell me) (?:a joke|my horoscope|a recipe)\b/,
  /^(?:solve|calculate) (?:this |the )?(?:equation|sum)\b/,
]);

const COMMERCIAL_CONTEXT_WORDS = new Set([
  'automacao', 'campanha', 'cliente', 'clientes', 'conteudo', 'empresa', 'loja',
  'marca', 'marketing', 'negocio', 'produto', 'produtos', 'projeto', 'redes',
  'servico', 'servicos', 'site', 'website',
]);

export function classifyCommercialSecurityIntent(value) {
  const normalized = normalizeCommercialMessageForFingerprint(value);
  if (!normalized) return Object.freeze({ category: 'none', normalized });

  if (LEGITIMATE_SECURITY_DISCUSSION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return Object.freeze({ category: 'none', normalized });
  }

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return Object.freeze({ category: 'prompt_injection', normalized });
  }

  const hasCommercialContext = normalized
    .split(' ')
    .some((word) => COMMERCIAL_CONTEXT_WORDS.has(word));

  if (
    !hasCommercialContext &&
    OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return Object.freeze({ category: 'off_topic', normalized });
  }

  return Object.freeze({ category: 'none', normalized });
}
