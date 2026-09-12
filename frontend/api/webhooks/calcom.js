import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../_lib/env.js';
import {
  verifyCalComWebhookSignature,
  extractCalComBookingInformation,
  processCalComWebhookEvent,
} from '../../server/admin/calcom-webhook-service.js';
import { sendInternalCriticalAlertNotification } from '../../server/email/internal-critical-alert-service.js';

export async function handleCalComWebhookRequest(request) {
  loadLocalEnv();
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBodyText = await request.text();
  const signatureHeader =
    request.headers.get('x-cal-signature-256') ||
    request.headers.get('x-signature-sha256') ||
    request.headers.get('authorization') ||
    '';

  const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET;

  if (webhookSecret && !verifyCalComWebhookSignature(rawBodyText, signatureHeader, webhookSecret)) {
    return new Response(JSON.stringify({ ok: false, error: 'Assinatura de webhook inválida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payloadBody;
  try {
    payloadBody = JSON.parse(rawBodyText || '{}');
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Corpo da requisição JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const triggerEvent = (payloadBody?.triggerEvent || payloadBody?.event || '').toString().trim().toUpperCase();
  if (triggerEvent === 'PING') {
    return new Response(JSON.stringify({ ok: true, action: 'ping_acknowledged' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bookingInfo = extractCalComBookingInformation(payloadBody);

  if (!bookingInfo || !bookingInfo.externalBookingId) {
    return new Response(JSON.stringify({ ok: false, error: 'Payload de agendamento incompleto ou inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Configuração de servidor incompleta' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const result = await processCalComWebhookEvent(serviceClient, bookingInfo);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      try {
        await sendInternalCriticalAlertNotification({
          component: 'Cal.com Webhook',
          errorType: 'calcom_webhook_fatal_error',
          errorTitle: 'Erro Fatal no Processamento de Webhook Cal.com',
          errorMessage: err.message || 'Erro interno no processamento de agendamento.',
          referenceId: bookingInfo?.externalBookingId || null
        });
      } catch (_) {}
    }
    return new Response(JSON.stringify({ ok: false, error: err.message || 'Erro ao processar webhook' }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default {
  async fetch(request) {
    return handleCalComWebhookRequest(request);
  },
};
