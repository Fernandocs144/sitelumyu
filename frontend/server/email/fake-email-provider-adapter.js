/**
 * FASE 7F.1 / 7I.1 — FAKE EMAIL PROVIDER ADAPTER
 *
 * Adaptador fake/mock para testes locais determinísticos de envio de email.
 */

export async function sendEmailWithFakeProvider({
  idempotencyKey,
  from,
  to,
  subject,
  text,
  html,
  simulateMode = 'accepted',
  now = new Date()
}) {
  if (!idempotencyKey) throw new Error('idempotencyKey é obrigatório em sendEmailWithFakeProvider');
  if (!to) throw new Error('to (destinatário) é obrigatório em sendEmailWithFakeProvider');

  if (simulateMode === 'failed') {
    return {
      ok: false,
      provider: 'fake',
      providerMessageId: null,
      acceptedAt: null,
      errorCode: 'SIMULATED_PROVIDER_REJECTION',
      errorMessage: 'Simulação: O provider rejeitou a mensagem.'
    };
  }

  if (simulateMode === 'unknown') {
    return {
      ok: false,
      provider: 'fake',
      providerMessageId: null,
      acceptedAt: null,
      errorCode: 'PROVIDER_TIMEOUT',
      errorMessage: 'Simulação: Timeout ou incerteza na resposta do provider.'
    };
  }

  const fakeMsgId = `msg_fake_${idempotencyKey.slice(0, 16)}`;
  const acceptedDate = typeof now === 'string' ? new Date(now) : now;

  return {
    ok: true,
    provider: 'fake',
    providerMessageId: fakeMsgId,
    acceptedAt: acceptedDate.toISOString(),
    errorCode: null,
    errorMessage: null
  };
}
