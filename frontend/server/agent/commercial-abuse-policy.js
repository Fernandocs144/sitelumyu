import { normalizeCommercialMessageForFingerprint } from './commercial-request-limits.js';

const SEVERE_PATTERNS = Object.freeze([
  /\b(?:vou|vamos) (?:(?:te|vos) )?(?:matar|agredir|bater|violar|destruir)(?: (?:te|vos))?\b/,
  /\bquero (?:(?:te|vos) )?(?:matar|agredir|violar|foder)(?: (?:te|vos))?\b/,
  /\b(?:mato|agredo|bato|violo) (?:te|vos)\b/,
  /\b(?:devias|deviam) morrer\b/,
  /\b(?:i will|we will|i m going to) (?:kill|hurt|attack|rape) (?:you|you all)\b/,
  /\bkill yourself\b/,
  /\b(?:preto|negro|gay|cigano|judeu) de merda\b/,
  /\b(?:nigger|faggot|kike)\b/,
]);

const DIRECT_ABUSE_PATTERNS = Object.freeze([
  /\b(?:vai te|vao se) (?:foder|lixar)\b/,
  /\bvai (?:a|para a|para o|pa|po|pra|pro) (?:merda|caralho)\b/,
  /\bvai (?:foder|tomar no cu)\b/,
  /\bvai para a puta que te pariu\b/,
  /\bfode te\b/,
  /\bcala (?:te|a boca)\b/,
  /\b(?:fuck|screw) you\b/,
  /\b(?:go to hell|shut up)\b/,
  /\b(?:tu es|voce e|voces sao|you are) (?:um |uma )?(?:idiota|burro|burra|estupido|estupida|imbecil|inutil|lixo|merda)\b/,
  /\b(?:chatbot|bot|assistente|lumyo) (?:e|is) (?:um |uma )?(?:idiota|burro|estupido|imbecil|inutil|lixo|merda)\b/,
  /\b(?:filho|filha) da puta\b/,
  /\b(?:motherfucker|asshole|bastard)\b/,
]);

const ABUSIVE_ONLY_WORDS = new Set([
  'merda',
  'porra',
  'caralho',
  'foda',
  'fodasse',
  'foder',
  'fdp',
  'pqp',
  'puta',
  'cu',
  'idiota',
  'burro',
  'burra',
  'estupido',
  'estupida',
  'imbecil',
  'inutil',
  'lixo',
  'fuck',
  'shit',
  'asshole',
  'bastard',
  'motherfucker',
]);

const ABUSIVE_FILLER_WORDS = new Set([
  'a', 'as', 'da', 'de', 'do', 'e', 'grande', 'na', 'no', 'o', 'os', 'pa',
  'para', 'po', 'pra', 'pro', 'se', 'seu', 'sua', 'te', 'tomar', 'tu', 'um',
  'uma', 'vai', 'vao', 'vos', 'you', 'your',
]);

export function classifyCommercialMessageAbuse(value) {
  const normalized = normalizeCommercialMessageForFingerprint(value);
  if (!normalized) return Object.freeze({ severity: 'none', normalized });

  if (SEVERE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return Object.freeze({ severity: 'severe', normalized });
  }

  if (DIRECT_ABUSE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return Object.freeze({ severity: 'abusive', normalized });
  }

  const words = normalized.split(' ');
  const hasAbusiveWord = words.some((word) => ABUSIVE_ONLY_WORDS.has(word));
  const hasMeaningfulNonAbusiveWord = words.some(
    (word) => !ABUSIVE_ONLY_WORDS.has(word) && !ABUSIVE_FILLER_WORDS.has(word)
  );

  if (hasAbusiveWord && !hasMeaningfulNonAbusiveWord) {
    return Object.freeze({ severity: 'abusive', normalized });
  }

  return Object.freeze({ severity: 'none', normalized });
}
