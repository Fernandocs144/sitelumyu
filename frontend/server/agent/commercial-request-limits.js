export const COMMERCIAL_REQUEST_LIMITS = Object.freeze({
  sessionMessagesPerMinute: 8,
  ipMessagesPerMinute: 20,
  conversationMessagesTotal: 40,
});

export const COMMERCIAL_REQUEST_LIMIT_CODES = Object.freeze([
  'session_rate_limited',
  'ip_rate_limited',
  'conversation_limit_reached',
]);

export function isCommercialRequestLimitCode(value) {
  return COMMERCIAL_REQUEST_LIMIT_CODES.includes(value);
}
