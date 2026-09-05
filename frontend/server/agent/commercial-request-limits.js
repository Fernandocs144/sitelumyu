export const COMMERCIAL_REQUEST_LIMITS = Object.freeze({
  qualificationSessionMessagesPerMinute: 15,
  qualificationIpMessagesPerMinute: 30,
  qualificationConversationMessagesTotal: 30,
  postQualificationSessionMessagesPerMinute: 5,
  postQualificationIpMessagesPerMinute: 15,
  postQualificationMessagesTotal: 10,
});

export const COMMERCIAL_REQUEST_LIMIT_CODES = Object.freeze([
  'session_rate_limited',
  'ip_rate_limited',
  'conversation_limit_reached',
]);

export function isCommercialRequestLimitCode(value) {
  return COMMERCIAL_REQUEST_LIMIT_CODES.includes(value);
}
