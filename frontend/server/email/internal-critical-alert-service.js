import { sendEmailWithResendProvider } from './resend-email-provider-adapter.js';

/**
 * FASE 8.3 — INTERNAL CRITICAL ALERT SERVICE
 *
 * Envia notificações por email para a equipa LUMYO sobre falhas críticas do sistema
 * (ex: falhas globais no scheduler, erros no Zoho sync, falhas fatais em webhooks ou no agente chat).
 * Utiliza chaves de idempotência por balde de tempo (1 hora) ou ID de referência para evitar tempestades de emails.
 */

function escapeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Gera uma chave de idempotência determinística com janela temporal de 1 hora.
 *
 * @param {string} errorType Código curto do tipo de erro
 * @param {string|null} [referenceId] ID opcional do objeto/evento para maior especificidade
 * @param {Date|string} [now=new Date()] Data de referência
 * @returns {string} Idempotency Key formatada (máx. 100 carateres)
 */
export function buildHourlyIdempotencyKey(errorType, referenceId = null, now = new Date()) {
  const cleanType = (errorType || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const dateObj = typeof now === 'string' ? new Date(now) : (now || new Date());
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const year = validDate.getUTCFullYear();
  const month = String(validDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(validDate.getUTCDate()).padStart(2, '0');
  const hour = String(validDate.getUTCHours()).padStart(2, '0');
  const timeBucket = `${year}${month}${day}_H${hour}`;

  if (referenceId) {
    const cleanRef = String(referenceId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `crit_alert_${cleanType}_${cleanRef}_${timeBucket}`.slice(0, 100);
  }

  return `crit_alert_${cleanType}_${timeBucket}`.slice(0, 100);
}

/**
 * Dispara notificação de alerta crítico por email para a equipa Lumyo com garantias de fail-safe.
 *
 * @param {Object} params
 * @param {string} [params.component] Nome do componente/serviço afetado
 * @param {string} [params.errorType] Código determinístico do erro
 * @param {string} [params.errorTitle] Título descritivo curto do alerta
 * @param {string} [params.errorMessage] Mensagem/descrição técnica do erro
 * @param {string|null} [params.referenceId] ID de referência para deduplicação
 * @param {any} [params.details] Detalhes adicionais legíveis
 * @param {Date|string} [params.now] Data de avaliação
 * @param {Object} [params.resendClient] Cliente Resend para testes
 * @returns {Promise<Object>} Resultado do disparo
 */
export async function sendInternalCriticalAlertNotification({
  component = 'Sistema Comercial',
  errorType = 'critical_error',
  errorTitle = 'Falha Crítica Registada',
  errorMessage = 'Ocorreu um erro crítico no sistema.',
  referenceId = null,
  details = null,
  now = new Date(),
  resendClient = null
} = {}) {
  // 1. Resolução Fail-Closed do Destinatário
  const rawDestination = process.env.CONTACT_FORM_DESTINATION_EMAIL;
  const recipient = (typeof rawDestination === 'string' && rawDestination.trim())
    ? rawDestination.trim()
    : 'comercial@lumyo.pt';

  // 2. Chave de Idempotência com Janela de 1 Hora
  const idempotencyKey = buildHourlyIdempotencyKey(errorType, referenceId, now);

  const subject = `[LUMYO Alerta Crítico] ${component} - ${errorTitle}`;
  const timestampIso = (typeof now === 'string' ? new Date(now) : (now || new Date())).toISOString();

  let formattedDetails = '';
  if (details) {
    if (typeof details === 'object') {
      try {
        formattedDetails = JSON.stringify(details, null, 2);
      } catch (_) {
        formattedDetails = String(details);
      }
    } else {
      formattedDetails = String(details);
    }
  }

  const textBody = `
ALERTA CRÍTICO DE SISTEMA - LUMYO

Componente: ${component}
Tipo de Erro: ${errorType}
Título: ${errorTitle}
Timestamp: ${timestampIso}
Idempotency Key: ${idempotencyKey}

Descrição Técnica:
${errorMessage}

${formattedDetails ? `Detalhes Adicionais:\n${formattedDetails}` : ''}

Ação Recomendada:
Por favor, verifique os registos do sistema e o estado do serviço no painel administrativo.
`.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #111827;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
        ⚠️ Alerta Crítico — ${escapeHtml(component)}
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Componente:</td><td>${escapeHtml(component)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Tipo de Erro:</td><td><code>${escapeHtml(errorType)}</code></td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Título:</td><td>${escapeHtml(errorTitle)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Timestamp:</td><td>${escapeHtml(timestampIso)}</td></tr>
      </table>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #991b1b;">Descrição Técnica:</p>
        <p style="margin: 0; color: #7f1d1d; white-space: pre-wrap;">${escapeHtml(errorMessage)}</p>
      </div>
      ${formattedDetails ? `
      <div style="background-color: #f3f4f6; padding: 10px; margin-top: 12px; border-radius: 4px; font-size: 12px; font-family: monospace;">
        ${escapeHtml(formattedDetails)}
      </div>
      ` : ''}
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
        Idempotency Key: <code>${escapeHtml(idempotencyKey)}</code>
      </p>
    </div>
  `.trim();

  // 3. Disparo Factual Fail-Safe (Nunca lança exceção para não partir o fluxo chamador)
  try {
    const result = await sendEmailWithResendProvider({
      idempotencyKey,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
      resendClient
    });
    return result;
  } catch (err) {
    console.error(`[Fail-Safe] Erro ao disparar alerta crítico (${errorType}):`, err?.message || err);
    return {
      ok: false,
      provider: 'resend',
      errorCode: 'CRITICAL_ALERT_DISPATCH_FAILED',
      errorMessage: err?.message || 'Exceção ao disparar email de alerta crítico.'
    };
  }
}
