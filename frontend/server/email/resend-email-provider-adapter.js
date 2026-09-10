import { Resend } from 'resend';

/**
 * FASE 7I.1 — RESEND EMAIL PROVIDER ADAPTER
 *
 * Adaptador isolado para envio de emails via Resend API, com suporte a Safe Test Mode,
 * idempotência técnica e higienização rigorosa de credenciais e erros.
 */

/**
 * Envia um email através da API Resend com salvaguardas de Safe Test Mode.
 *
 * @param {Object} params
 * @param {string} params.idempotencyKey Chave única de idempotência
 * @param {string} [params.from] Remetente (opcional, por defeito das env vars)
 * @param {string} params.to Destinatário (email)
 * @param {string} [params.subject] Assunto da mensagem
 * @param {string} [params.text] Corpo em texto plano
 * @param {string} [params.html] Corpo em HTML
 * @param {Object} [params.resendClient] Cliente Resend opcional (para injeção de dependência em testes)
 * @returns {Promise<Object>} Resultado padronizado do disparo
 */
export async function sendEmailWithResendProvider({
  idempotencyKey,
  from = null,
  to,
  subject = null,
  text = null,
  html = null,
  resendClient = null
}) {
  if (!idempotencyKey) {
    throw new Error('idempotencyKey é obrigatório em sendEmailWithResendProvider');
  }
  if (!to || typeof to !== 'string' || !to.trim()) {
    throw new Error('to (destinatário) é obrigatório em sendEmailWithResendProvider');
  }

  const cleanRecipient = to.trim().toLowerCase();

  // 1. Configuração de Ambiente
  const apiKey = process.env.RESEND_API_KEY;
  const envFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@lumyo.pt';
  const envFromName = process.env.RESEND_FROM_NAME || 'Lumyo';
  const envReplyTo = process.env.RESEND_REPLY_TO || 'contacto@lumyo.pt';
  const testModeRaw = process.env.RESEND_TEST_MODE;
  const testAllowlistRaw = process.env.RESEND_TEST_RECIPIENT_ALLOWLIST || '';

  const isTestMode = testModeRaw === 'true' || testModeRaw === true || testModeRaw === '1';

  // 2. SAFE TEST MODE: Verificação Fail-Closed da Allowlist
  if (isTestMode) {
    const allowedEmails = testAllowlistRaw
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isAllowed = allowedEmails.includes(cleanRecipient);

    if (!isAllowed) {
      return {
        ok: false,
        provider: 'resend',
        providerMessageId: null,
        acceptedAt: null,
        errorCode: 'TEST_RECIPIENT_NOT_ALLOWED',
        errorMessage: `Modo de Teste ativo: O destinatário <${cleanRecipient}> não está na lista de permissões (${allowedEmails.join(', ') || 'vazia'}). Envio bloqueado por segurança.`
      };
    }
  }

  // 3. Validação de API Key
  if (!apiKey && !resendClient) {
    return {
      ok: false,
      provider: 'resend',
      providerMessageId: null,
      acceptedAt: null,
      errorCode: 'MISSING_RESEND_API_KEY',
      errorMessage: 'Configuração do servidor incompleta: RESEND_API_KEY não definida.'
    };
  }

  // 4. Formatação de Remetente e Headers
  let senderAddress = from;
  if (!senderAddress) {
    senderAddress = envFromName ? `${envFromName} <${envFromEmail}>` : envFromEmail;
  }

  const client = resendClient || new Resend(apiKey);

  const payload = {
    from: senderAddress,
    to: [cleanRecipient],
    subject: subject || 'Acompanhamento Comercial Lumyo',
    text: text || '',
    replyTo: envReplyTo || undefined
  };

  if (html) {
    payload.html = html;
  }

  // 5. Invocação da Resend API SDK
  try {
    const { data, error } = await client.emails.send(payload, {
      idempotencyKey: idempotencyKey
    });

    if (error) {
      return {
        ok: false,
        provider: 'resend',
        providerMessageId: null,
        acceptedAt: null,
        errorCode: sanitizeErrorCode(error.name || error.code || 'RESEND_API_ERROR'),
        errorMessage: sanitizeErrorMessage(error.message || 'Erro na API do Resend')
      };
    }

    if (!data || !data.id) {
      return {
        ok: false,
        provider: 'resend',
        providerMessageId: null,
        acceptedAt: null,
        errorCode: 'INVALID_RESEND_RESPONSE',
        errorMessage: 'A Resend API não retornou um ID de mensagem válido.'
      };
    }

    return {
      ok: true,
      provider: 'resend',
      providerMessageId: data.id,
      acceptedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null
    };
  } catch (err) {
    return {
      ok: false,
      provider: 'resend',
      providerMessageId: null,
      acceptedAt: null,
      errorCode: sanitizeErrorCode(err.name || err.code || 'RESEND_EXCEPTION'),
      errorMessage: sanitizeErrorMessage(err.message || 'Exceção não tratada na comunicação com a API Resend')
    };
  }
}

function sanitizeErrorCode(code) {
  if (!code || typeof code !== 'string') return 'RESEND_ERROR';
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 50);
  return clean || 'RESEND_ERROR';
}

function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Erro não especificado no envio de email.';
  let clean = msg;
  clean = clean.replace(/(Bearer\s+|re_|key=|[a-z0-9_-]*key[a-z0-9_-]*=)[^\s&]+/gi, '$1[REDACTED]');
  clean = clean.replace(/re_[a-zA-Z0-9_]{20,}/g, '[REDACTED_API_KEY]');
  clean = clean.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
  clean = clean.split('\n').filter(line => !line.trim().startsWith('at ')).join(' ');
  return clean.trim().slice(0, 500);
}
