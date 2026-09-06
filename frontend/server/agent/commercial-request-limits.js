export const COMMERCIAL_REQUEST_LIMITS = Object.freeze({
  qualificationSessionMessagesPerMinute: 12,
  qualificationIpMessagesPerMinute: 30,
  qualificationConversationMessagesTotal: 20,
  postQualificationSessionMessagesPerMinute: 3,
  postQualificationIpMessagesPerMinute: 15,
  postQualificationMessagesTotal: 3,
});

export const COMMERCIAL_REQUEST_LIMIT_CODES = Object.freeze([
  'session_rate_limited',
  'ip_rate_limited',
  'conversation_limit_reached',
  'post_qualification_limit_reached',
  'repeated_message_warning',
  'repeated_message_limit_reached',
]);

export function isCommercialRequestLimitCode(value) {
  return COMMERCIAL_REQUEST_LIMIT_CODES.includes(value);
}

export function normalizeCommercialMessageForFingerprint(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
