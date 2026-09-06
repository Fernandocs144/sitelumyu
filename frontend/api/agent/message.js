import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  getCommercialAgentPrompt,
  getCommercialAgentExtractionPrompt,
  buildSecondPhaseInstructions,
} from '../../server/agent/commercial-agent-prompt.js';
import {
  commercialAgentExtractionSchema,
  commercialAgentReplySchema,
} from '../../server/agent/commercial-agent-response-schema.js';
import { normalizeBudget } from '../../server/agent/budget-normalizer.js';
import { evaluateFinancialAlignment } from '../../server/agent/financial-alignment-evaluator.js';
import { classifyLead } from '../../server/agent/lead-classifier.js';
import { evaluateMeetingIntent } from '../../server/agent/meeting-intent-evaluator.js';
import { calculateNextCommercialGoal } from '../../server/agent/commercial-conversation-policy.js';
import { getCommercialGoalMessage } from '../../server/agent/commercial-goal-messages.js';
import { composeCommercialReply } from '../../server/agent/commercial-reply-composer.js';
import { buildDeterministicFinancialReply } from '../../server/agent/commercial-financial-reply.js';
import {
  isCommercialRequestLimitCode,
  normalizeCommercialMessageForFingerprint,
} from '../../server/agent/commercial-request-limits.js';
import { classifyCommercialMessageAbuse } from '../../server/agent/commercial-abuse-policy.js';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

function parseCookieHeader(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === cookieName) {
      return rest.join('=');
    }
  }
  return null;
}

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_WEBSITE_VARIANTS = [
  'landing_page',
  'institutional_website',
  'custom_website',
  'ecommerce',
];
const ALLOWED_MEETING_INTENT_SIGNALS = [
  'accepted',
  'considering',
  'declined',
  'human_contact_requested',
];
const ALLOWED_TURN_INTENTS = [
  'qualification_answer',
  'direct_question',
  'correction',
  'scope_change',
  'possible_new_project',
  'booking_response',
  'other',
];

export function buildCalComBookingUrl(baseUrlStr, name, email) {
  if (typeof baseUrlStr !== 'string' || !baseUrlStr.trim()) return null;
  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrlStr.trim());
  } catch (err) {
    console.error('Failed to parse Cal.com booking base URL', { code: 'calcom_url_invalid' });
    return null;
  }

  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'cal.com') {
    console.error('Cal.com booking base URL rejected due to security constraint', { code: 'calcom_url_untrusted' });
    return null;
  }

  const cleanNameVal = typeof name === 'string' && name.trim().length >= 1 ? name.trim() : null;
  const cleanEmailVal = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : null;

  if (cleanNameVal) {
    parsedUrl.searchParams.set('name', cleanNameVal);
  }
  if (cleanEmailVal) {
    parsedUrl.searchParams.set('email', cleanEmailVal);
  }

  return parsedUrl.toString();
}

function normalizeServicesList(list, primaryService) {
  if (!Array.isArray(list)) return [];
  const validSet = new Set();
  for (const item of list) {
    if (typeof item === 'string' && ALLOWED_SERVICES.includes(item) && item !== primaryService) {
      validSet.add(item);
    }
  }
  return Array.from(validSet).sort();
}

function numbersEqual(val1, val2) {
  if (val1 === null || val1 === undefined || val1 === '') {
    return val2 === null || val2 === undefined || val2 === '';
  }
  if (val2 === null || val2 === undefined || val2 === '') {
    return false;
  }
  const n1 = Number(val1);
  const n2 = Number(val2);
  if (isNaN(n1) || isNaN(n2)) return false;
  return n1 === n2;
}

function cleanRawText(str) {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim().replace(/[.,;\s]+$/, '');
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

function cleanTrimmedString(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIntentText(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferShortBusinessGoalAnswer(visitorMessage, previousAgentMessage) {
  const answer = cleanTrimmedString(visitorMessage);
  const previousAgent = normalizeIntentText(previousAgentMessage);
  const normalizedAnswer = normalizeIntentText(answer);

  if (!answer || answer.length > 300 || answer.includes('?')) return null;

  const askedForBusinessGoal = [
    'principal necessidade ou resultado',
    'problema atual deve este projeto resolver',
    'resultado pretende alcancar',
    'main need or result',
    'current problem should this project solve',
    'result do you want to achieve',
  ].some((fragment) => previousAgent.includes(fragment));

  if (!askedForBusinessGoal) return null;

  const vagueAnswers = new Set([
    'sim',
    'nao',
    'nao sei',
    'talvez',
    'qualquer coisa',
    'yes',
    'no',
    'i dont know',
    'not sure',
    'anything',
  ]);
  if (vagueAnswers.has(normalizedAnswer)) return null;

  const businessGoalPattern = /\b(notoriedade|visibilidade|presenca|vendas?|clientes?|contactos?|credibilidade|conversao|tempo|erros?|custos?|manual|respostas?|organiz|automat|simplif|melhor|crescer|crescimento|reduzir|aumentar|poupar|awareness|visibility|presence|sales?|customers?|clients?|leads?|credibility|conversion|time|errors?|costs?|manual|responses?|organi[sz]|automat|simplif|improv|growth|grow|reduce|increase|save)\b/i;

  return businessGoalPattern.test(normalizedAnswer) ? answer : null;
}

function cleanEmail(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim().toLowerCase();
  if (trimmed.length < 1 || trimmed.length > 200) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

function isManualClassificationProtected(currentLead) {
  return (
    currentLead?.lead_classification === 'priority' ||
    currentLead?.lead_classification === 'disqualified'
  );
}

function hasFinancialStateChanged(currentLead, effectiveState) {
  if (!currentLead) return true;

  if ((currentLead.primary_service || null) !== (effectiveState.primary_service || null)) return true;
  if ((currentLead.service_variant || null) !== (effectiveState.service_variant || null)) return true;

  const currentSec = normalizeServicesList(currentLead.secondary_services, effectiveState.primary_service);
  const effectiveSec = normalizeServicesList(effectiveState.secondary_services, effectiveState.primary_service);
  if (JSON.stringify(currentSec) !== JSON.stringify(effectiveSec)) return true;

  if (cleanRawText(currentLead.stated_budget_raw) !== cleanRawText(effectiveState.stated_budget_raw)) return true;
  if (!numbersEqual(currentLead.stated_budget_min, effectiveState.stated_budget_min)) return true;
  if (!numbersEqual(currentLead.stated_budget_max, effectiveState.stated_budget_max)) return true;
  if ((currentLead.stated_budget_currency || null) !== (effectiveState.stated_budget_currency || null)) return true;
  if ((currentLead.stated_budget_period || 'unknown') !== (effectiveState.stated_budget_period || 'unknown')) return true;
  if ((currentLead.budget_normalization_status || 'not_attempted') !== (effectiveState.budget_normalization_status || 'not_attempted')) return true;
  if ((currentLead.budget_normalization_source || 'unknown') !== (effectiveState.budget_normalization_source || 'unknown')) return true;

  return false;
}

function hasClassificationStateChanged(currentLead, effectiveClassificationState) {
  if (!currentLead) return true;

  if (isManualClassificationProtected(currentLead)) {
    return false;
  }

  if (currentLead.lead_classification === 'informational' && currentLead.classification_reason === null) {
    return true;
  }

  if ((currentLead.primary_service || null) !== (effectiveClassificationState.primary_service || null)) return true;
  if ((currentLead.service_variant || null) !== (effectiveClassificationState.service_variant || null)) return true;
  if (cleanTrimmedString(currentLead.need_description) !== cleanTrimmedString(effectiveClassificationState.need_description)) return true;
  if (cleanEmail(currentLead.email) !== cleanEmail(effectiveClassificationState.email)) return true;
  if (cleanTrimmedString(currentLead.timeline) !== cleanTrimmedString(effectiveClassificationState.timeline)) return true;
  if ((currentLead.financial_alignment_status || 'unknown') !== (effectiveClassificationState.financial_alignment_status || 'unknown')) return true;

  return false;
}

function extractEmailFromText(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (!match) return null;
  const email = match[0].toLowerCase().trim();
  if (email.length < 5 || email.length > 200) return null;
  return email;
}

export function extractFallbackContact(recentText) {
  if (typeof recentText !== 'string') return { name: null, email: null };

  const extractedEmail = extractEmailFromText(recentText);
  if (!extractedEmail) {
    return { name: null, email: null };
  }

  const escapedEmail = extractedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let remaining = recentText.replace(new RegExp(escapedEmail, 'i'), '');
  remaining = remaining.replace(/^[\s,;:/\-]+|[\s,;:/\-]+$/g, '').trim();

  if (!remaining) {
    return { name: null, email: extractedEmail };
  }

  const words = remaining.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) {
    return { name: null, email: extractedEmail };
  }

  if (!/^[\p{L}\s'\-]+$/u.test(remaining)) {
    return { name: null, email: extractedEmail };
  }

  const prohibitedKeywords = new Set([
    'quero', 'preciso', 'gostaria', 'website', 'site', 'orçamento', 'orcamento',
    'euros', 'euro', 'empresa', 'projeto', 'projecto', 'contacto', 'contato',
    'telefone', 'suporte', 'ajuda', 'prazo', 'meses', 'mês', 'mes', 'semanas',
    'semana', 'dias', 'dia', 'responder', 'enviar', 'envia', 'liga', 'chamo',
    'chama', 'nome', 'email', 'mail', 'comercial', 'equipa', 'equipe', 'reunião',
    'reuniao', 'solução', 'solucao', 'ia', 'automação', 'automacao'
  ]);

  const tokens = words.map((w) => w.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''));
  for (const token of tokens) {
    if (prohibitedKeywords.has(token)) {
      return { name: null, email: extractedEmail };
    }
  }

  const cleanName = remaining.trim();
  if (cleanName.length < 1 || cleanName.length > 120) {
    return { name: null, email: extractedEmail };
  }

  return {
    name: cleanName,
    email: extractedEmail,
  };
}

export function safeDiagnosticString(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.slice(0, maxLength)
    : null;
}

export function isBudgetProvidedInCurrentTurn(cleanQualification) {
  return (
    cleanQualification?.turn_intent === 'qualification_answer' &&
    typeof cleanQualification?.stated_budget_raw === 'string' &&
    cleanQualification.stated_budget_raw.trim().length > 0
  );
}

export function isPricingRequestedInCurrentTurn(messageText, turnIntent) {
  if (turnIntent !== 'direct_question' || typeof messageText !== 'string') {
    return false;
  }

  const normalized = messageText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return false;

  const pricingQuestionPatterns = [
    /\bquanto\s+(?:custa|custam|fica|ficam)\b/,
    /\bqual\s+(?:e\s+)?(?:o\s+)?(?:preco|custo|valor|investimento|orcamento)\b/,
    /\b(?:preco|precos|pricing|price|prices|cost|costs|quote|quotation)\b/,
    /\bhow\s+much\b/,
    /\bwhat(?:'s|\s+is)?\s+the\s+(?:price|cost|investment|budget)\b/,
  ];

  return pricingQuestionPatterns.some((pattern) => pattern.test(normalized));
}

export function sanitizeQualification(qual, recentText = null) {
  if (!qual || typeof qual !== 'object') return null;

  const sanitizeString = (val, maxLen) => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (trimmed.length < 1 || trimmed.length > maxLen) return null;
    return trimmed;
  };

  const primaryService = ALLOWED_SERVICES.includes(qual.primary_service)
    ? qual.primary_service
    : null;

  const serviceVariant = ALLOWED_WEBSITE_VARIANTS.includes(qual.service_variant)
    ? qual.service_variant
    : null;

  let secondaryServices = [];
  if (Array.isArray(qual.secondary_services)) {
    const validSet = new Set();
    for (const item of qual.secondary_services) {
      if (ALLOWED_SERVICES.includes(item) && item !== primaryService) {
        validSet.add(item);
      }
    }
    secondaryServices = Array.from(validSet);
  }

  let name = sanitizeString(qual.name, 120);

  let email = sanitizeString(qual.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = null;
  }

  if (typeof recentText === 'string') {
    const fallback = extractFallbackContact(recentText);
    if (!name && fallback.name) {
      name = fallback.name;
    }
    if (!email && fallback.email) {
      email = fallback.email;
    }
  }

  const companyName = sanitizeString(qual.company_name, 120);
  const companyActivity = sanitizeString(qual.company_activity, 300);
  const targetAudience = sanitizeString(qual.target_audience, 500);

  let websiteUrl = null;
  if (typeof qual.website_url === 'string') {
    const rawUrl = qual.website_url.trim();
    if (rawUrl.length >= 1 && rawUrl.length <= 250) {
      try {
        const parsedUrl = new URL(rawUrl);
        if (
          (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
          parsedUrl.hostname
        ) {
          websiteUrl = rawUrl;
        }
      } catch {
        websiteUrl = null;
      }
    }
  }

  const needDescription = sanitizeString(qual.need_description, 2000);
  const operationalImpact = sanitizeString(qual.operational_impact, 1000);
  const timeline = sanitizeString(qual.timeline, 50);
  const decisionInvolvement = sanitizeString(qual.decision_involvement, 50);
  const statedBudgetRaw = sanitizeString(qual.stated_budget_raw, 200);

  const meetingIntentSignal = ALLOWED_MEETING_INTENT_SIGNALS.includes(qual.meeting_intent_signal)
    ? qual.meeting_intent_signal
    : null;

  let hasExistingWebsite = null;
  if (typeof qual.has_existing_website === 'boolean') {
    hasExistingWebsite = qual.has_existing_website;
  }
  if (websiteUrl) {
    hasExistingWebsite = true;
  }

  const turnIntent = ALLOWED_TURN_INTENTS.includes(qual.turn_intent)
    ? qual.turn_intent
    : 'other';

  return {
    primary_service: primaryService,
    service_variant: serviceVariant,
    secondary_services: secondaryServices,
    has_existing_website: hasExistingWebsite,
    name,
    email,
    company_name: companyName,
    company_activity: companyActivity,
    target_audience: targetAudience,
    website_url: websiteUrl,
    need_description: needDescription,
    operational_impact: operationalImpact,
    timeline,
    decision_involvement: decisionInvolvement,
    stated_budget_raw: statedBudgetRaw,
    meeting_intent_signal: meetingIntentSignal,
    turn_intent: turnIntent,
  };
}

async function deleteCandidateLead(supabase, candidateId) {
  if (!candidateId) return false;
  const { error: deleteError } = await supabase
    .from('leads')
    .delete()
    .eq('id', candidateId);

  if (deleteError) {
    console.error('Failed to delete candidate lead', {
      code: deleteError.code || 'unknown',
    });
    return false;
  }
  return true;
}

export function filterQualificationForPersistence({
  cleanQualification,
  currentLead = null,
  turnIntent = 'other',
  isNewLead = false,
}) {
  if (!cleanQualification || typeof cleanQualification !== 'object') {
    return null;
  }

  if (isNewLead || !currentLead) {
    return { ...cleanQualification };
  }

  const allowed = {
    primary_service: currentLead.primary_service || null,
    service_variant: currentLead.service_variant || null,
    secondary_services: Array.isArray(currentLead.secondary_services) ? currentLead.secondary_services : [],
    has_existing_website: currentLead.has_existing_website ?? null,
    need_description: currentLead.need_description || null,
    operational_impact: currentLead.operational_impact || null,
    timeline: currentLead.timeline || null,
    stated_budget_raw: currentLead.stated_budget_raw || null,
    name: currentLead.name || null,
    email: currentLead.email || null,
    company_name: currentLead.company_name || null,
    company_activity: currentLead.company_activity || null,
    target_audience: currentLead.target_audience || null,
    website_url: currentLead.website_url || null,
    decision_involvement: currentLead.decision_involvement || null,
    meeting_intent_signal: currentLead.meeting_intent_signal || null,
  };

  if (!currentLead.name && cleanQualification.name) allowed.name = cleanQualification.name;
  if (!currentLead.email && cleanQualification.email) allowed.email = cleanQualification.email;
  if (cleanQualification.meeting_intent_signal) allowed.meeting_intent_signal = cleanQualification.meeting_intent_signal;

  const resolveWebsitePersistence = (allowContradiction = false) => {
    const currentHas = currentLead.has_existing_website ?? null;
    const extractedHas = typeof cleanQualification.has_existing_website === 'boolean'
      ? cleanQualification.has_existing_website
      : (cleanQualification.website_url ? true : null);

    if (currentHas === null) {
      if (extractedHas !== null) {
        allowed.has_existing_website = extractedHas;
      }
      if (cleanQualification.website_url) {
        allowed.website_url = cleanQualification.website_url;
      }
    } else {
      if (extractedHas !== null && extractedHas !== currentHas) {
        if (allowContradiction) {
          allowed.has_existing_website = extractedHas;
          if (cleanQualification.website_url) {
            allowed.website_url = cleanQualification.website_url;
          }
        } else {
          allowed.has_existing_website = currentHas;
        }
      } else if (extractedHas === currentHas) {
        if (cleanQualification.website_url) {
          allowed.website_url = cleanQualification.website_url;
        }
      }
    }
  };

  if (turnIntent === 'possible_new_project' || turnIntent === 'direct_question' || turnIntent === 'booking_response') {
    return allowed;
  }

  if (turnIntent === 'correction') {
    if (cleanQualification.primary_service) allowed.primary_service = cleanQualification.primary_service;
    if (cleanQualification.service_variant !== undefined) allowed.service_variant = cleanQualification.service_variant;
    if (cleanQualification.secondary_services?.length) allowed.secondary_services = cleanQualification.secondary_services;
    if (cleanQualification.need_description) allowed.need_description = cleanQualification.need_description;
    if (cleanQualification.operational_impact) allowed.operational_impact = cleanQualification.operational_impact;
    if (cleanQualification.timeline) allowed.timeline = cleanQualification.timeline;
    if (cleanQualification.stated_budget_raw) allowed.stated_budget_raw = cleanQualification.stated_budget_raw;
    if (cleanQualification.company_name) allowed.company_name = cleanQualification.company_name;
    if (cleanQualification.company_activity) allowed.company_activity = cleanQualification.company_activity;
    if (cleanQualification.target_audience) allowed.target_audience = cleanQualification.target_audience;
    if (cleanQualification.decision_involvement) allowed.decision_involvement = cleanQualification.decision_involvement;

    resolveWebsitePersistence(true);
    return allowed;
  }

  if (turnIntent === 'scope_change') {
    if (cleanQualification.primary_service) allowed.primary_service = cleanQualification.primary_service;
    if (cleanQualification.service_variant !== undefined && cleanQualification.service_variant !== null) allowed.service_variant = cleanQualification.service_variant;
    if (cleanQualification.secondary_services?.length) allowed.secondary_services = cleanQualification.secondary_services;
    if (cleanQualification.need_description) allowed.need_description = cleanQualification.need_description;
    if (cleanQualification.operational_impact) allowed.operational_impact = cleanQualification.operational_impact;
    if (cleanQualification.timeline) allowed.timeline = cleanQualification.timeline;
    if (cleanQualification.stated_budget_raw) allowed.stated_budget_raw = cleanQualification.stated_budget_raw;
    if (cleanQualification.company_name) allowed.company_name = cleanQualification.company_name;
    if (cleanQualification.company_activity) allowed.company_activity = cleanQualification.company_activity;
    if (cleanQualification.target_audience) allowed.target_audience = cleanQualification.target_audience;
    if (cleanQualification.decision_involvement) allowed.decision_involvement = cleanQualification.decision_involvement;

    resolveWebsitePersistence(false);
    return allowed;
  }

  for (const key of Object.keys(cleanQualification)) {
    if (key === 'turn_intent' || key === 'meeting_intent_signal' || key === 'has_existing_website' || key === 'website_url') continue;
    const val = cleanQualification[key];
    if (val === null || val === undefined) continue;

    const currentVal = currentLead[key];
    if (currentVal === null || currentVal === undefined) {
      allowed[key] = val;
    } else {
      allowed[key] = currentVal;
    }
  }

  resolveWebsitePersistence(false);

  return allowed;
}

async function updateExistingLead(supabase, leadId, activeLanguage, cleanQualification) {
  const { data: currentLead, error: currentLeadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (currentLeadError || !currentLead) {
    console.error('Failed to read existing lead qualification', {
      code: currentLeadError?.code || 'not_found',
    });
    return null;
  }

  const qualToPersist = filterQualificationForPersistence({
    cleanQualification,
    currentLead,
    turnIntent: cleanQualification?.turn_intent || 'other',
    isNewLead: false,
  });

  const updatePayload = {
    language: activeLanguage,
    last_interaction_at: new Date().toISOString(),
  };

  if (qualToPersist.primary_service && qualToPersist.primary_service !== currentLead.primary_service) {
    updatePayload.primary_service = qualToPersist.primary_service;
  }

  const targetPrimaryService = updatePayload.primary_service || currentLead?.primary_service;

  if (targetPrimaryService === 'websites') {
    if (qualToPersist.service_variant !== undefined && qualToPersist.service_variant !== currentLead.service_variant) {
      updatePayload.service_variant = qualToPersist.service_variant;
    }
  }

  if (qualToPersist.secondary_services && qualToPersist.secondary_services.length > 0) {
    const existingSecondary = Array.isArray(currentLead?.secondary_services) ? currentLead.secondary_services : [];
    const mergedSet = new Set([...existingSecondary, ...qualToPersist.secondary_services]);
    if (targetPrimaryService) {
      mergedSet.delete(targetPrimaryService);
    }
    updatePayload.secondary_services = Array.from(mergedSet);
  }

  if (qualToPersist.name && qualToPersist.name !== currentLead.name) updatePayload.name = qualToPersist.name;
  if (qualToPersist.email && qualToPersist.email !== currentLead.email) updatePayload.email = qualToPersist.email;
  if (qualToPersist.company_name && qualToPersist.company_name !== currentLead.company_name) updatePayload.company_name = qualToPersist.company_name;
  if (qualToPersist.company_activity && qualToPersist.company_activity !== currentLead.company_activity) updatePayload.company_activity = qualToPersist.company_activity;
  if (qualToPersist.target_audience && qualToPersist.target_audience !== currentLead.target_audience) updatePayload.target_audience = qualToPersist.target_audience;

  if (typeof qualToPersist.has_existing_website === 'boolean' && qualToPersist.has_existing_website !== currentLead.has_existing_website) {
    updatePayload.has_existing_website = qualToPersist.has_existing_website;
  }
  if (qualToPersist.website_url && qualToPersist.website_url !== currentLead.website_url) {
    updatePayload.website_url = qualToPersist.website_url;
  }

  if (qualToPersist.need_description && qualToPersist.need_description !== currentLead.need_description) updatePayload.need_description = qualToPersist.need_description;
  if (qualToPersist.operational_impact && qualToPersist.operational_impact !== currentLead.operational_impact) updatePayload.operational_impact = qualToPersist.operational_impact;
  if (qualToPersist.timeline && qualToPersist.timeline !== currentLead.timeline) updatePayload.timeline = qualToPersist.timeline;
  if (qualToPersist.decision_involvement && qualToPersist.decision_involvement !== currentLead.decision_involvement) updatePayload.decision_involvement = qualToPersist.decision_involvement;

  if (typeof qualToPersist.stated_budget_raw === 'string' && qualToPersist.stated_budget_raw.trim().length > 0 && qualToPersist.stated_budget_raw !== currentLead.stated_budget_raw) {
    const rawText = qualToPersist.stated_budget_raw.trim();
    const effectivePrimaryService = targetPrimaryService || null;
    const norm = normalizeBudget(rawText, effectivePrimaryService);

    updatePayload.stated_budget_raw = rawText;
    updatePayload.stated_budget_min = norm.min;
    updatePayload.stated_budget_max = norm.max;
    updatePayload.stated_budget_currency = norm.currency;
    updatePayload.stated_budget_period = norm.period;
    updatePayload.budget_normalization_status = norm.status;
    updatePayload.budget_normalization_source = norm.source;
  }

  const effectiveState = {
    primary_service: updatePayload.primary_service !== undefined ? updatePayload.primary_service : (currentLead.primary_service || null),
    service_variant: updatePayload.service_variant !== undefined ? updatePayload.service_variant : (currentLead.service_variant || null),
    secondary_services: updatePayload.secondary_services !== undefined ? updatePayload.secondary_services : (currentLead.secondary_services || []),
    stated_budget_raw: updatePayload.stated_budget_raw !== undefined ? updatePayload.stated_budget_raw : (currentLead.stated_budget_raw || null),
    stated_budget_min: updatePayload.stated_budget_min !== undefined ? updatePayload.stated_budget_min : (currentLead.stated_budget_min ?? null),
    stated_budget_max: updatePayload.stated_budget_max !== undefined ? updatePayload.stated_budget_max : (currentLead.stated_budget_max ?? null),
    stated_budget_currency: updatePayload.stated_budget_currency !== undefined ? updatePayload.stated_budget_currency : (currentLead.stated_budget_currency || null),
    stated_budget_period: updatePayload.stated_budget_period !== undefined ? updatePayload.stated_budget_period : (currentLead.stated_budget_period || 'unknown'),
    budget_normalization_status: updatePayload.budget_normalization_status !== undefined ? updatePayload.budget_normalization_status : (currentLead.budget_normalization_status || 'not_attempted'),
    budget_normalization_source: updatePayload.budget_normalization_source !== undefined ? updatePayload.budget_normalization_source : (currentLead.budget_normalization_source || 'unknown'),
  };

  if (hasFinancialStateChanged(currentLead, effectiveState)) {
    try {
      const alignment = evaluateFinancialAlignment(effectiveState);
      updatePayload.financial_alignment_status = alignment.status;
      updatePayload.financial_alignment_reason = alignment.reason;
      updatePayload.financial_rule_version = alignment.ruleVersion;
      updatePayload.financial_evaluated_at = alignment.evaluatedAt;
    } catch (err) {
      console.error('Failed to evaluate financial alignment', {
        code: 'financial_evaluation_failed',
      });
    }
  }

  if (cleanQualification.meeting_intent_signal) {
    try {
      const intentEval = evaluateMeetingIntent(cleanQualification.meeting_intent_signal);
      if (intentEval.shouldUpdate) {
        updatePayload.intent_level = intentEval.intentLevel;
        updatePayload.next_step = intentEval.nextStep;
      }
    } catch (err) {
      console.error('Failed to evaluate meeting intent', {
        code: 'meeting_intent_evaluation_failed',
      });
    }
  }

  if (!isManualClassificationProtected(currentLead)) {
    const effectiveClassificationState = {
      primary_service:
        updatePayload.primary_service !== undefined
          ? updatePayload.primary_service
          : currentLead.primary_service ?? null,

      service_variant:
        updatePayload.service_variant !== undefined
          ? updatePayload.service_variant
          : currentLead.service_variant ?? null,

      need_description:
        updatePayload.need_description !== undefined
          ? updatePayload.need_description
          : currentLead.need_description ?? null,

      email:
        updatePayload.email !== undefined
          ? updatePayload.email
          : currentLead.email ?? null,

      timeline:
        updatePayload.timeline !== undefined
          ? updatePayload.timeline
          : currentLead.timeline ?? null,

      financial_alignment_status:
        updatePayload.financial_alignment_status !== undefined
          ? updatePayload.financial_alignment_status
          : currentLead.financial_alignment_status ?? 'unknown',
    };

    if (hasClassificationStateChanged(currentLead, effectiveClassificationState)) {
      try {
        const classification = classifyLead(effectiveClassificationState);
        updatePayload.lead_classification = classification.classification;
        updatePayload.classification_reason = classification.reason;
      } catch (err) {
        console.error('Failed to classify lead', {
          code: 'lead_classification_failed',
        });
      }
    }
  }

  const { data: updatedLead, error: updateErr } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId)
    .select('*')
    .single();

  if (updateErr) {
    console.error('Failed to update lead qualification', { code: updateErr.code || 'unknown' });
    return null;
  }

  return updatedLead;
}

async function linkConversationToLead(supabase, conversationId, leadId) {
  if (!conversationId || !leadId) return;
  const { error: convUpdateErr } = await supabase
    .from('conversations')
    .update({ lead_id: leadId })
    .eq('id', conversationId);

  if (convUpdateErr) {
    console.error('Failed to link lead to conversation', { code: convUpdateErr.code || 'unknown' });
  }
}

async function processLeadQualification(supabase, sessionData, conversationId, activeLanguage, cleanQualification) {
  if (!cleanQualification) return null;

  try {
    let existingLeadId = sessionData.lead_id;

    if (!existingLeadId) {
      const { data: freshSession, error: freshSessionError } = await supabase
        .from('visitor_sessions')
        .select('lead_id')
        .eq('id', sessionData.id)
        .maybeSingle();

      if (freshSessionError) {
        console.error('Failed to refresh session lead link', {
          code: freshSessionError.code || 'unknown',
        });
        return null;
      }

      if (freshSession?.lead_id) {
        existingLeadId = freshSession.lead_id;
        sessionData.lead_id = existingLeadId;
      }
    }

    if (existingLeadId) {
      const updatedLead = await updateExistingLead(supabase, existingLeadId, activeLanguage, cleanQualification);
      await linkConversationToLead(supabase, conversationId, existingLeadId);
      return updatedLead;
    }

    const hasSignal =
      Boolean(cleanQualification.need_description) ||
      Boolean(cleanQualification.timeline) ||
      Boolean(cleanQualification.stated_budget_raw) ||
      Boolean(cleanQualification.company_name) ||
      Boolean(cleanQualification.company_activity) ||
      Boolean(cleanQualification.target_audience) ||
      Boolean(cleanQualification.email) ||
      Boolean(cleanQualification.website_url) ||
      typeof cleanQualification.has_existing_website === 'boolean';

    const shouldCreateLead = Boolean(cleanQualification.primary_service) && hasSignal;

    if (!shouldCreateLead) {
      return null;
    }

    const insertPayload = {
      language: activeLanguage,
      source: 'website_agent',
      last_interaction_at: new Date().toISOString(),
      ...(cleanQualification.primary_service ? { primary_service: cleanQualification.primary_service } : {}),
      ...(cleanQualification.primary_service === 'websites' && cleanQualification.service_variant ? { service_variant: cleanQualification.service_variant } : {}),
      ...(cleanQualification.secondary_services?.length ? { secondary_services: cleanQualification.secondary_services } : {}),
      ...(cleanQualification.name ? { name: cleanQualification.name } : {}),
      ...(cleanQualification.email ? { email: cleanQualification.email } : {}),
      ...(cleanQualification.company_name ? { company_name: cleanQualification.company_name } : {}),
      ...(cleanQualification.company_activity ? { company_activity: cleanQualification.company_activity } : {}),
      ...(cleanQualification.target_audience ? { target_audience: cleanQualification.target_audience } : {}),
      ...(cleanQualification.website_url
        ? { website_url: cleanQualification.website_url, has_existing_website: true }
        : typeof cleanQualification.has_existing_website === 'boolean'
        ? { has_existing_website: cleanQualification.has_existing_website }
        : {}),
      ...(cleanQualification.need_description ? { need_description: cleanQualification.need_description } : {}),
      ...(cleanQualification.operational_impact ? { operational_impact: cleanQualification.operational_impact } : {}),
      ...(cleanQualification.timeline ? { timeline: cleanQualification.timeline } : {}),
      ...(cleanQualification.decision_involvement ? { decision_involvement: cleanQualification.decision_involvement } : {}),
    };

    if (typeof cleanQualification.stated_budget_raw === 'string' && cleanQualification.stated_budget_raw.trim().length > 0) {
      const rawText = cleanQualification.stated_budget_raw.trim();
      const norm = normalizeBudget(rawText, cleanQualification.primary_service || null);

      insertPayload.stated_budget_raw = rawText;
      insertPayload.stated_budget_min = norm.min;
      insertPayload.stated_budget_max = norm.max;
      insertPayload.stated_budget_currency = norm.currency;
      insertPayload.stated_budget_period = norm.period;
      insertPayload.budget_normalization_status = norm.status;
      insertPayload.budget_normalization_source = norm.source;
    }

    const candidateState = {
      primary_service: insertPayload.primary_service || null,
      service_variant: insertPayload.service_variant || null,
      secondary_services: insertPayload.secondary_services || [],
      stated_budget_raw: insertPayload.stated_budget_raw || null,
      stated_budget_min: insertPayload.stated_budget_min ?? null,
      stated_budget_max: insertPayload.stated_budget_max ?? null,
      stated_budget_currency: insertPayload.stated_budget_currency || null,
      stated_budget_period: insertPayload.stated_budget_period || 'unknown',
      budget_normalization_status: insertPayload.budget_normalization_status || 'not_attempted',
      budget_normalization_source: insertPayload.budget_normalization_source || 'unknown',
    };

    try {
      const alignment = evaluateFinancialAlignment(candidateState);
      insertPayload.financial_alignment_status = alignment.status;
      insertPayload.financial_alignment_reason = alignment.reason;
      insertPayload.financial_rule_version = alignment.ruleVersion;
      insertPayload.financial_evaluated_at = alignment.evaluatedAt;
    } catch (err) {
      console.error('Failed to evaluate financial alignment', {
        code: 'financial_evaluation_failed',
      });
    }

    if (cleanQualification.meeting_intent_signal) {
      try {
        const intentEval = evaluateMeetingIntent(cleanQualification.meeting_intent_signal);
        if (intentEval.shouldUpdate) {
          insertPayload.intent_level = intentEval.intentLevel;
          insertPayload.next_step = intentEval.nextStep;
        }
      } catch (err) {
        console.error('Failed to evaluate meeting intent', {
          code: 'meeting_intent_evaluation_failed',
        });
      }
    }

    const candidateClassificationState = {
      primary_service: insertPayload.primary_service ?? null,
      service_variant: insertPayload.service_variant ?? null,
      need_description: insertPayload.need_description ?? null,
      email: insertPayload.email ?? null,
      timeline: insertPayload.timeline ?? null,
      financial_alignment_status: insertPayload.financial_alignment_status ?? 'unknown',
    };

    try {
      const classification = classifyLead(candidateClassificationState);
      insertPayload.lead_classification = classification.classification;
      insertPayload.classification_reason = classification.reason;
    } catch (err) {
      console.error('Failed to classify lead', {
        code: 'lead_classification_failed',
      });
    }

    const { data: candidateLead, error: insertLeadErr } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertLeadErr || !candidateLead) {
      console.error('Failed to insert candidate lead', { code: insertLeadErr?.code || 'unknown' });
      return null;
    }

    const candidateId = candidateLead.id;

    const { data: updatedSession, error: sessUpdateErr } = await supabase
      .from('visitor_sessions')
      .update({ lead_id: candidateId })
      .eq('id', sessionData.id)
      .is('lead_id', null)
      .select('id, lead_id')
      .maybeSingle();

    if (sessUpdateErr) {
      console.error('Failed to associate lead to session', { code: sessUpdateErr.code || 'unknown' });
      await deleteCandidateLead(supabase, candidateId);
      return null;
    }

    if (updatedSession && updatedSession.lead_id === candidateId) {
      sessionData.lead_id = candidateId;
      await linkConversationToLead(supabase, conversationId, candidateId);
      return candidateLead;
    }

    const { data: latestSession, error: latestSessionError } = await supabase
      .from('visitor_sessions')
      .select('lead_id')
      .eq('id', sessionData.id)
      .maybeSingle();

    const deletedOk = await deleteCandidateLead(supabase, candidateId);

    if (latestSessionError || !deletedOk) {
      return null;
    }

    const winningLeadId = latestSession?.lead_id;
    if (winningLeadId) {
      sessionData.lead_id = winningLeadId;
      const updatedLead = await updateExistingLead(supabase, winningLeadId, activeLanguage, cleanQualification);
      await linkConversationToLead(supabase, conversationId, winningLeadId);
      return updatedLead;
    }

    return null;
  } catch (err) {
    console.error('Unexpected lead qualification failure', { code: err?.code || 'unknown' });
    return null;
  }
}

async function insertMessageWithSequence(supabase, conversationId, messageType, senderRole, contentText) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data: maxSeqData, error: maxSeqError } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxSeqError) {
      console.error('Failed to query max sequence number', {
        code: maxSeqError.code || 'unknown',
      });
      return { success: false, error: maxSeqError };
    }

    const nextSeq = maxSeqData && maxSeqData.sequence_number ? Number(maxSeqData.sequence_number) + 1 : 1;

    const { data: insertedMsg, error: insertMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sequence_number: nextSeq,
        message_type: messageType,
        sender_role: senderRole,
        content: contentText,
        status: 'delivered',
      })
      .select('id, sequence_number')
      .single();

    if (!insertMsgError && insertedMsg) {
      return { success: true, data: insertedMsg };
    }

    if (insertMsgError && insertMsgError.code === '23505') {
      continue;
    }

    console.error('Failed to insert message', {
      code: insertMsgError?.code || 'unknown',
    });
    return { success: false, error: insertMsgError };
  }

  console.error('Failed to insert message after sequence retries', { code: 'max_retries_exceeded' });
  return { success: false, error: new Error('Max retries exceeded') };
}

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return Response.json(
      {
        success: false,
        error: 'Method not allowed',
      },
      {
        status: 405,
        headers: {
          Allow: 'POST',
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const requiredEnvs = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
  ];
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

  if (missingEnvs.length > 0) {
    console.error(`Missing required environment variable(s): ${missingEnvs.join(', ')}`);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const token = parseCookieHeader(cookieHeader, 'lumyo_agent_session');

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return Response.json(
      {
        success: false,
        error: 'Session required',
        code: 'SESSION_REQUIRED',
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const { message, language } = body;

  if (typeof message !== 'string') {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length < 1 || cleanMessage.length > 2000) {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (language !== undefined && language !== 'pt' && language !== 'en') {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const requestedLanguage = language === 'en' ? 'en' : 'pt';

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const tokenHash = await sha256Hex(token);
    const nowIso = new Date().toISOString();
    const updateLastSeenIso = new Date(Date.now() + 1000).toISOString();

    const { data: sessionData, error: sessionError } = await supabase
      .from('visitor_sessions')
      .update({ last_seen_at: updateLastSeenIso })
      .eq('session_token_hash', tokenHash)
      .gt('expires_at', nowIso)
      .select('id, lead_id')
      .maybeSingle();

    if (sessionError) {
      console.error('Failed to validate visitor session', {
        code: sessionError.code || 'unknown',
      });
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!sessionData) {
      return Response.json(
        {
          success: false,
          error: 'Session required',
          code: 'SESSION_REQUIRED',
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: blockedConversation, error: blockedConversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionData.id)
      .eq('status', 'completed')
      .eq('primary_outcome', 'spam_detected')
      .limit(1)
      .maybeSingle();

    if (blockedConversationError) {
      console.error('Failed to verify blocked commercial conversation', {
        code: blockedConversationError.code || 'unknown',
      });
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (blockedConversation) {
      const { data: closedForAbuse, error: closedForAbuseError } = await supabase
        .from('commercial_abuse_attempts')
        .select('id')
        .eq('conversation_id', blockedConversation.id)
        .eq('outcome', 'closed')
        .limit(1)
        .maybeSingle();

      if (closedForAbuseError) {
        console.error('Failed to resolve commercial conversation closure reason', {
          code: closedForAbuseError.code || 'unknown',
        });
        return Response.json(
          {
            success: false,
            error: 'Internal server error',
          },
          {
            status: 500,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const closureCode = closedForAbuse
        ? 'abusive_message_limit_reached'
        : 'repeated_message_limit_reached';

      return Response.json(
        {
          success: false,
          error: 'Conversation closed',
          code: closureCode,
          retryAfterSeconds: 0,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let conversationId;
    let activeLanguage = requestedLanguage;

    const { data: existingConv, error: getConvError } = await supabase
      .from('conversations')
      .select('id, language')
      .eq('session_id', sessionData.id)
      .eq('status', 'active')
      .maybeSingle();

    if (getConvError) {
      console.error('Failed to query active conversation', {
        code: getConvError.code || 'unknown',
      });
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (existingConv) {
      conversationId = existingConv.id;
      activeLanguage = existingConv.language;
    } else {
      const { data: newConv, error: insertConvError } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionData.id,
          lead_id: sessionData.lead_id || null,
          status: 'active',
          commercial_stage: 'discovery',
          language: requestedLanguage,
        })
        .select('id, language')
        .single();

      if (insertConvError) {
        if (insertConvError.code === '23505') {
          const { data: retryConv, error: retryConvError } = await supabase
            .from('conversations')
            .select('id, language')
            .eq('session_id', sessionData.id)
            .eq('status', 'active')
            .single();

          if (!retryConvError && retryConv) {
            conversationId = retryConv.id;
            activeLanguage = retryConv.language;
          } else {
            console.error('Failed to resolve active conversation after unique conflict', {
              code: retryConvError?.code || 'unknown',
            });
            return Response.json(
              {
                success: false,
                error: 'Internal server error',
              },
              {
                status: 500,
                headers: {
                  'Cache-Control': 'no-store',
                  'Content-Type': 'application/json',
                },
              }
            );
          }
        } else {
          console.error('Failed to insert conversation', {
            code: insertConvError.code || 'unknown',
          });
          return Response.json(
            {
              success: false,
              error: 'Internal server error',
            },
            {
              status: 500,
              headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/json',
              },
            }
          );
        }
      } else if (newConv) {
        conversationId = newConv.id;
        activeLanguage = newConv.language;
      }
    }

    const abuseClassification = classifyCommercialMessageAbuse(cleanMessage);
    if (abuseClassification.severity !== 'none') {
      const { data: abuseData, error: abuseError } = await supabase
        .rpc('check_commercial_message_abuse', {
          p_session_id: sessionData.id,
          p_conversation_id: conversationId,
          p_severity: abuseClassification.severity,
        })
        .single();

      if (abuseError || !abuseData) {
        console.error('Failed to check abusive commercial message', {
          code: abuseError?.code || 'abuse_result_missing',
        });
        return Response.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            code: 'ABUSE_CHECK_FAILED',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!isCommercialRequestLimitCode(abuseData.reason)) {
        console.warn('Commercial abuse check returned an invalid reason', {
          code: abuseData.reason || 'abuse_unknown_reason',
        });
        return Response.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            code: 'ABUSE_CONTEXT_INVALID',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'Abusive message detected',
          code: abuseData.reason,
          retryAfterSeconds: 0,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const normalizedMessage = normalizeCommercialMessageForFingerprint(cleanMessage);
    const messageFingerprint = await sha256Hex(normalizedMessage);
    const { data: repetitionData, error: repetitionError } = await supabase
      .rpc('check_commercial_message_repetition', {
        p_session_id: sessionData.id,
        p_conversation_id: conversationId,
        p_message_fingerprint: messageFingerprint,
      })
      .single();

    if (repetitionError || !repetitionData) {
      console.error('Failed to check repeated commercial message', {
        code: repetitionError?.code || 'repetition_result_missing',
      });
      return Response.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
          code: 'REPETITION_CHECK_FAILED',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!repetitionData.allowed) {
      if (!isCommercialRequestLimitCode(repetitionData.reason)) {
        console.warn('Commercial repetition check returned an invalid reason', {
          code: repetitionData.reason || 'repetition_unknown_reason',
        });
        return Response.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            code: 'REPETITION_CONTEXT_INVALID',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'Repeated message detected',
          code: repetitionData.reason,
          retryAfterSeconds: 0,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: requestLimitData, error: requestLimitError } = await supabase
      .rpc('check_commercial_request_limits', {
        p_session_id: sessionData.id,
        p_conversation_id: conversationId,
      })
      .single();

    if (requestLimitError || !requestLimitData) {
      console.error('Failed to check commercial request limits', {
        code: requestLimitError?.code || 'request_limit_result_missing',
      });
      return Response.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
          code: 'REQUEST_LIMIT_CHECK_FAILED',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!requestLimitData.allowed) {
      if (!isCommercialRequestLimitCode(requestLimitData.reason)) {
        console.warn('Commercial request limit check rejected invalid context', {
          code: requestLimitData.reason || 'request_limit_unknown_reason',
        });
        return Response.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            code: 'REQUEST_LIMIT_CONTEXT_INVALID',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const limitCode = requestLimitData.reason;
      const retryAfterSeconds = Math.max(
        0,
        Number(requestLimitData.retry_after_seconds) || 0
      );

      return Response.json(
        {
          success: false,
          error: 'Request limit reached',
          code: limitCode,
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
            ...(retryAfterSeconds > 0
              ? { 'Retry-After': String(retryAfterSeconds) }
              : {}),
          },
        }
      );
    }

    const visitorRes = await insertMessageWithSequence(
      supabase,
      conversationId,
      'visitor_text',
      'visitor',
      cleanMessage
    );

    if (!visitorRes.success) {
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: rawHistory, error: historyError } = await supabase
      .from('messages')
      .select('message_type, content, sequence_number')
      .eq('conversation_id', conversationId)
      .in('message_type', ['visitor_text', 'agent_text'])
      .order('sequence_number', { ascending: false })
      .limit(12);

    if (historyError) {
      console.error('Failed to query message history', {
        code: historyError.code || 'unknown',
      });
    }

    let history = [];
    if (!historyError && rawHistory) {
      const sortedHistory = [...rawHistory].reverse();
      history = sortedHistory.map((msg) => ({
        role: msg.message_type === 'visitor_text' ? 'user' : 'assistant',
        content: msg.content,
      }));

      while (history.length > 0 && history[0].role === 'assistant') {
        history.shift();
      }
    }

    // FASE 1 — EXTRAÇÃO E QUALIFICAÇÃO ESTRUTURADA
    let rawQualification = null;

    const isHistoryValid =
      !historyError &&
      history.length >= 1 &&
      history[history.length - 1].role === 'user' &&
      !history.some((msg) => msg.role !== 'user' && msg.role !== 'assistant');

    if (!isHistoryValid) {
      console.warn('OpenAI extraction skipped: invalid history', {
        code: 'extraction_history_invalid',
        isHistoryValid: false,
        historyLength: history.length,
        firstRole: history[0]?.role || null,
        lastRole: history[history.length - 1]?.role || null,
      });
    } else {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 15000,
          maxRetries: 1,
        });

        const extractionInstructions = getCommercialAgentExtractionPrompt(activeLanguage);

        const extractionResponse = await openai.responses.create({
          model: process.env.OPENAI_MODEL,
          instructions: extractionInstructions,
          input: history,
          reasoning: { effort: 'none' },
          text: {
            verbosity: 'low',
            format: {
              type: 'json_schema',
              name: 'commercial_agent_extraction',
              strict: true,
              schema: commercialAgentExtractionSchema,
            },
          },
          max_output_tokens: 800,
          store: false,
        });

        if (!extractionResponse) {
          console.error('OpenAI extraction returned empty response', {
            code: 'extraction_response_missing',
          });
        } else if (extractionResponse.status !== 'completed') {
          console.error('OpenAI extraction response status not completed', {
            code: 'extraction_not_completed',
            status: safeDiagnosticString(extractionResponse.status),
            incompleteReason: safeDiagnosticString(extractionResponse?.incomplete_details?.reason),
            hasError: !!extractionResponse?.error,
            errorCode: safeDiagnosticString(extractionResponse?.error?.code),
          });
        } else if (typeof extractionResponse.output_text !== 'string' || extractionResponse.output_text.trim().length === 0) {
          console.error('OpenAI extraction output_text missing or empty', {
            code: 'extraction_output_missing',
            status: safeDiagnosticString(extractionResponse.status),
            outputType: typeof extractionResponse.output_text,
            outputLength: typeof extractionResponse.output_text === 'string' ? extractionResponse.output_text.length : 0,
          });
        } else {
          try {
            const parsedExtraction = JSON.parse(extractionResponse.output_text);
            if (parsedExtraction && typeof parsedExtraction === 'object') {
              if (parsedExtraction.language === 'pt' || parsedExtraction.language === 'en') {
                if (parsedExtraction.language !== activeLanguage) {
                  activeLanguage = parsedExtraction.language;
                  await supabase
                    .from('conversations')
                    .update({ language: activeLanguage })
                    .eq('id', conversationId);
                }
              }
              if (parsedExtraction.qualification && typeof parsedExtraction.qualification === 'object') {
                rawQualification = parsedExtraction.qualification;
              } else {
                console.error('OpenAI extraction qualification missing in JSON', {
                  code: 'extraction_qualification_missing',
                  parsedType: typeof parsedExtraction,
                  hasQualification: typeof parsedExtraction?.qualification === 'object',
                });
              }
            }
          } catch (parseErr) {
            console.error('Failed to parse OpenAI Extraction Structured Output', {
              code: 'extraction_parse_failed',
              status: safeDiagnosticString(extractionResponse.status),
              outputType: typeof extractionResponse.output_text,
              outputLength: extractionResponse.output_text.length,
            });
          }
        }
      } catch (error) {
        console.error('OpenAI extraction failure', {
          code: 'extraction_request_failed',
          name: safeDiagnosticString(error?.name),
          status: typeof error?.status === 'number' ? error.status : safeDiagnosticString(error?.status),
          errorCode: safeDiagnosticString(error?.code),
          type: safeDiagnosticString(error?.type),
          param: safeDiagnosticString(error?.param),
          message: safeDiagnosticString(error?.message),
        });
      }
    }

    // FASE 2 — CONSOLIDAÇÃO DA LEAD NA BASE DE DADOS
    let cleanQualification = null;
    let consolidatedLead = null;

    if (rawQualification || cleanMessage) {
      cleanQualification = sanitizeQualification(rawQualification || {}, cleanMessage);
      if (cleanQualification) {
        const previousAgentMessage = [...history]
          .slice(0, -1)
          .reverse()
          .find((entry) => entry.role === 'assistant')?.content;
        const inferredBusinessGoal = inferShortBusinessGoalAnswer(
          cleanMessage,
          previousAgentMessage
        );

        if (inferredBusinessGoal) {
          cleanQualification = {
            ...cleanQualification,
            need_description:
              cleanQualification.need_description || inferredBusinessGoal,
            operational_impact:
              cleanQualification.operational_impact || inferredBusinessGoal,
          };
        }

        consolidatedLead = await processLeadQualification(
          supabase,
          sessionData,
          conversationId,
          activeLanguage,
          cleanQualification
        );
      }
    }

    const budgetProvidedThisTurn = isBudgetProvidedInCurrentTurn(cleanQualification);

    // CONSTRUIR ESTADO EFETIVO DA LEAD
    const effectiveLeadState = consolidatedLead || {
      id: sessionData.lead_id || null,
      primary_service: cleanQualification?.primary_service || null,
      service_variant: cleanQualification?.service_variant || null,
      secondary_services: cleanQualification?.secondary_services || [],
      has_existing_website: typeof cleanQualification?.has_existing_website === 'boolean'
        ? cleanQualification.has_existing_website
        : null,
      need_description: cleanQualification?.need_description || null,
      timeline: cleanQualification?.timeline || null,
      name: cleanQualification?.name || null,
      email: cleanQualification?.email || null,
      company_name: cleanQualification?.company_name || null,
      company_activity: cleanQualification?.company_activity || null,
      target_audience: cleanQualification?.target_audience || null,
      operational_impact: cleanQualification?.operational_impact || null,
      website_url: cleanQualification?.website_url || null,
      stated_budget_raw: cleanQualification?.stated_budget_raw || null,
      financial_alignment_status: null,
      financial_alignment_reason: null,
      next_step: cleanQualification?.meeting_intent_signal === 'accepted'
        ? 'booking_pending'
        : (cleanQualification?.meeting_intent_signal === 'human_contact_requested' ? 'human_contact_requested' : null),
      intent_level: cleanQualification?.meeting_intent_signal === 'accepted' || cleanQualification?.meeting_intent_signal === 'human_contact_requested' ? 'high' : null,
    };

    // FASE 3 — CÁLCULO DO GOAL COMERCIAL E DA MENSAGEM DE META
    const commercialGoal = calculateNextCommercialGoal(effectiveLeadState, {
      turnIntent: cleanQualification?.turn_intent || null,
    });
    const goalMessage = getCommercialGoalMessage(commercialGoal.goal, activeLanguage);
    const pricingRequestedThisTurn = isPricingRequestedInCurrentTurn(
      cleanMessage,
      cleanQualification?.turn_intent || null
    );

    const turnIntentRequiresResponse = [
      'direct_question',
      'correction',
      'scope_change',
      'possible_new_project',
    ].includes(cleanQualification?.turn_intent);

    const deterministicFinancialReply =
      budgetProvidedThisTurn && !turnIntentRequiresResponse
        ? buildDeterministicFinancialReply(effectiveLeadState, activeLanguage)
        : null;

    let finalReplyText = null;

    if (
      (commercialGoal.goal === 'show_booking' && !turnIntentRequiresResponse) ||
      commercialGoal.goal === 'human_contact_requested'
    ) {
      // NÃO CHAMAR O SEGUNDO MODELO PARA SHOW_BOOKING OU HUMAN_CONTACT_REQUESTED SEM PERGUNTA/CORREÇÃO
      const composerRes = composeCommercialReply({
        generatedReply: null,
        deterministicReply: null,
        goalMessage,
      });
      finalReplyText = composerRes.reply;
    } else if (deterministicFinancialReply) {
      // USAR RESPOSTA FINANCEIRA DETERMINÍSTICA E NÃO CHAMAR A SEGUNDA FASE OPENAI
      const composerRes = composeCommercialReply({
        generatedReply: null,
        deterministicReply: deterministicFinancialReply,
        goalMessage,
      });
      finalReplyText = composerRes.reply;
    } else {
      // CHAMAR O SEGUNDO MODELO COM commercialAgentReplySchema
      let generatedSecondPhaseReply = null;
      if (!isHistoryValid) {
        console.warn('OpenAI second phase skipped: invalid history', {
          code: 'second_phase_history_invalid',
          isHistoryValid: false,
          historyLength: history.length,
          firstRole: history[0]?.role || null,
          lastRole: history[history.length - 1]?.role || null,
        });
      } else {
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 15000,
            maxRetries: 1,
          });

          const secondPhaseInstructions = buildSecondPhaseInstructions({
            language: activeLanguage,
            goalMessage,
            effectiveLeadState,
            turnIntent: cleanQualification?.turn_intent || null,
          });

          const secondPhaseResponse = await openai.responses.create({
            model: process.env.OPENAI_MODEL,
            instructions: secondPhaseInstructions,
            input: history,
            reasoning: { effort: 'none' },
            text: {
              verbosity: 'low',
              format: {
                type: 'json_schema',
                name: 'commercial_agent_reply',
                strict: true,
                schema: commercialAgentReplySchema,
              },
            },
            max_output_tokens: 300,
            store: false,
          });

          if (!secondPhaseResponse) {
            console.error('OpenAI second phase returned empty response', {
              code: 'second_phase_response_missing',
            });
          } else if (secondPhaseResponse.status !== 'completed') {
            console.error('OpenAI second phase response status not completed', {
              code: 'second_phase_not_completed',
              status: safeDiagnosticString(secondPhaseResponse.status),
              incompleteReason: safeDiagnosticString(secondPhaseResponse?.incomplete_details?.reason),
              hasError: !!secondPhaseResponse?.error,
              errorCode: safeDiagnosticString(secondPhaseResponse?.error?.code),
            });
          } else if (typeof secondPhaseResponse.output_text !== 'string' || secondPhaseResponse.output_text.trim().length === 0) {
            console.error('OpenAI second phase output_text missing or empty', {
              code: 'second_phase_output_missing',
              status: safeDiagnosticString(secondPhaseResponse.status),
              outputType: typeof secondPhaseResponse.output_text,
              outputLength: typeof secondPhaseResponse.output_text === 'string' ? secondPhaseResponse.output_text.length : 0,
            });
          } else {
            try {
              const parsedReplyObj = JSON.parse(secondPhaseResponse.output_text);
              if (parsedReplyObj && typeof parsedReplyObj.reply === 'string' && parsedReplyObj.reply.trim().length > 0) {
                generatedSecondPhaseReply = parsedReplyObj.reply;
              } else {
                console.error('OpenAI second phase reply field missing or empty in JSON', {
                  code: 'second_phase_reply_missing',
                  parsedType: typeof parsedReplyObj,
                  hasReply: typeof parsedReplyObj?.reply === 'string',
                  replyLength: typeof parsedReplyObj?.reply === 'string' ? parsedReplyObj.reply.length : 0,
                });
              }
            } catch (parseErr) {
              console.error('Failed to parse OpenAI Reply Structured Output', {
                code: 'reply_parse_failed',
                status: safeDiagnosticString(secondPhaseResponse.status),
                outputType: typeof secondPhaseResponse.output_text,
                outputLength: secondPhaseResponse.output_text.length,
              });
            }
          }
        } catch (err) {
          console.error('OpenAI second phase reply failure', {
            code: 'commercial_reply_generation_failed',
            name: safeDiagnosticString(err?.name),
            status: typeof err?.status === 'number' ? err.status : safeDiagnosticString(err?.status),
            errorCode: safeDiagnosticString(err?.code),
            type: safeDiagnosticString(err?.type),
            param: safeDiagnosticString(err?.param),
            message: safeDiagnosticString(err?.message),
          });
        }
      }

      const composerRes = composeCommercialReply({
        generatedReply: generatedSecondPhaseReply,
        deterministicReply: null,
        goalMessage,
        pricingRequestedThisTurn,
      });

      if (composerRes?.source === 'fallback' && typeof generatedSecondPhaseReply === 'string' && generatedSecondPhaseReply.trim().length > 0) {
        console.warn('OpenAI second phase reply rejected by composer', {
          code: 'second_phase_composer_rejected',
          goal: safeDiagnosticString(goalMessage?.goal),
          validationReason: safeDiagnosticString(composerRes?.validationReason),
          generatedReplyLength: generatedSecondPhaseReply.length,
        });
      }

      finalReplyText = composerRes.reply;
    }

    // AVALIAÇÃO DETERMINÍSTICA DE BOOKING ACTION
    let bookingAction = null;
    const isBookingState =
      commercialGoal.goal === 'show_booking' ||
      commercialGoal.goal === 'answer_turn_intent' ||
      effectiveLeadState?.next_step === 'booking_pending';

    if (isBookingState && (goalMessage.action === 'booking' || effectiveLeadState?.next_step === 'booking_pending')) {
      const associatedLeadId = sessionData.lead_id || effectiveLeadState?.id;
      if (associatedLeadId) {
        const calComBaseUrl = process.env.CALCOM_BOOKING_URL;
        if (calComBaseUrl) {
          let leadName = effectiveLeadState?.name || cleanQualification?.name || null;
          let leadEmail = effectiveLeadState?.email || cleanQualification?.email || null;

          if (!leadName || !leadEmail) {
            const { data: dbLead } = await supabase
              .from('leads')
              .select('name, email')
              .eq('id', associatedLeadId)
              .maybeSingle();
            if (dbLead) {
              if (!leadName) leadName = dbLead.name;
              if (!leadEmail) leadEmail = dbLead.email;
            }
          }

          const calComUrl = buildCalComBookingUrl(calComBaseUrl, leadName, leadEmail);

          if (calComUrl) {
            bookingAction = {
              type: 'calcom',
              label: activeLanguage === 'en' ? 'Choose a time' : 'Escolher horário',
              url: calComUrl,
            };
          }
        }
      }

      if (!bookingAction) {
        finalReplyText = activeLanguage === 'en'
          ? 'The booking page is temporarily unavailable. The Lumyo team can help complete the booking.'
          : 'Não foi possível disponibilizar agora a página de agendamento. A equipa Lumyo poderá ajudar a concluir a marcação.';
      }
    }

    const agentRes = await insertMessageWithSequence(
      supabase,
      conversationId,
      'agent_text',
      'agent',
      finalReplyText
    );

    if (!agentRes.success) {
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: updateConvError } = await supabase
      .from('conversations')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateConvError) {
      console.error('Failed to update conversation activity', {
        code: updateConvError.code || 'unknown',
      });
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          reply: finalReplyText,
          language: activeLanguage,
          ...(bookingAction ? { bookingAction } : {}),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected message endpoint failure', {
      name: error?.name || 'Error',
    });
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
