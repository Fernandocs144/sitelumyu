import { sendEmailWithResendProvider } from './resend-email-provider-adapter.js';

/**
 * FASE 8.2 — INTERNAL HANDOFF EMAIL NOTIFICATION SERVICE
 *
 * Envia 1 email interno para a equipa LUMYO sempre que for criada uma tarefa
 * válida de intervenção humana / handoff no CRM (chat ou scheduler).
 * Utiliza o context_fingerprint para garantir idempotência e evitar duplicações.
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
 * Envia a notificação por email para a equipa Lumyo.
 *
 * @param {Object} params
 * @param {Object} params.lead Objeto com os dados da lead (id, name, email, company_name, primary_service, need_description)
 * @param {string} [params.reasonCode] Código do motivo do handoff (ex: 'human_contact_requested', 'cadence_exhausted', 'negotiation_stale')
 * @param {string} [params.taskTitle] Título amigável do motivo/tarefa de handoff
 * @param {string} params.fingerprint Fingerprint contextual único para idempotência
 * @param {Object} [params.resendClient] Cliente Resend opcional (para injeção de dependência em testes)
 * @returns {Promise<Object>} Resultado do disparo
 */
export async function sendInternalHandoffNotification({
  lead,
  reasonCode = 'human_review',
  taskTitle = 'Intervenção Humana Necessária',
  fingerprint,
  resendClient = null
}) {
  if (!lead || !lead.id) {
    throw new Error('lead com id é obrigatório em sendInternalHandoffNotification');
  }
  if (!fingerprint || typeof fingerprint !== 'string' || !fingerprint.trim()) {
    throw new Error('fingerprint é obrigatório em sendInternalHandoffNotification');
  }

  const cleanFingerprint = fingerprint.trim();

  // 1. Resolução Fail-Closed do Destinatário
  const rawDestination = process.env.CONTACT_FORM_DESTINATION_EMAIL;
  const recipient = (typeof rawDestination === 'string' && rawDestination.trim())
    ? rawDestination.trim()
    : 'comercial@lumyo.pt';

  // 2. Chave de Idempotência
  const idempotencyKey = `handoff_email_${lead.id}_${cleanFingerprint}`.slice(0, 100);

  // 3. Formatação do Conteúdo do Email
  const leadName = lead.name || lead.company_name || 'Lead sem nome';
  const leadEmail = lead.email || 'Não especificado';
  const primaryService = lead.primary_service || 'Não especificado';
  const needDesc = lead.need_description || 'Não especificado';
  const leadId = lead.id;

  const subject = `[LUMYO Handoff] ${taskTitle} - ${leadName}`;

  const textBody = `
ALERTA DE ENCAMINHAMENTO HUMANO / HANDOFF

Informação da Lead:
- Nome: ${leadName}
- Email: ${leadEmail}
- Serviço / Interesse: ${primaryService}
- Necessidade: ${needDesc}
- ID da Lead: ${leadId}

Detalhes do Handoff:
- Motivo: ${taskTitle} (${reasonCode})
- Link de Acesso: https://www.lumyo.pt/admin/leads?id=${leadId}
- Fingerprint: ${cleanFingerprint}
`.trim();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #111827;">
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Alerta de Encaminhamento Humano / Handoff
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Lead:</td><td>${escapeHtml(leadName)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${escapeHtml(leadEmail)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Serviço / Interesse:</td><td>${escapeHtml(primaryService)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Necessidade:</td><td>${escapeHtml(needDesc)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">ID da Lead:</td><td><code>${escapeHtml(leadId)}</code></td></tr>
      </table>
      <div style="background-color: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">Motivo do Handoff:</p>
        <p style="margin: 0; color: #374151;">${escapeHtml(taskTitle)} (<code>${escapeHtml(reasonCode)}</code>)</p>
      </div>
      <div style="margin-top: 24px;">
        <a href="https://www.lumyo.pt/admin/leads?id=${encodeURIComponent(leadId)}" 
           style="background-color: #2563eb; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Abrir Lead no Painel Admin
        </a>
      </div>
    </div>
  `.trim();

  // 4. Disparo Factual via Resend Adapter com Tratamento Seguro de Erros
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
    console.error(`Erro ao disparar notificação por email de handoff para lead ${leadId}:`, err);
    return {
      ok: false,
      provider: 'resend',
      errorCode: 'INTERNAL_NOTIFICATION_FAILED',
      errorMessage: err?.message || 'Falha ao disparar email interno de handoff.'
    };
  }
}
