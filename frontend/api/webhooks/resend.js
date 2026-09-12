import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../_lib/env.js';
import { sendInternalCriticalAlertNotification } from '../../server/email/internal-critical-alert-service.js';

export const SUPPORTED_DISPATCH_EVENTS = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed'
]);

/**
 * FASE 7I.1 — RESEND WEBHOOK HANDLER
 *
 * Endpoint server-side para receção, verificação de assinatura Svix e auditoria
 * de eventos assíncronos de entrega de email da Resend.
 */

export async function handleResendWebhookRequest(request) {
  loadLocalEnv();

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET não configurado no servidor.');
    return new Response(JSON.stringify({ ok: false, error: 'Configuração de webhook incompleta' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 1. Extração do corpo cru e headers Svix
  let rawBody = '';
  try {
    if (typeof request.text === 'function') {
      rawBody = await request.text();
    } else if (typeof request.body === 'string') {
      rawBody = request.body;
    } else {
      rawBody = JSON.stringify(request.body || {});
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Erro ao ler corpo da requisição' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = {};
  if (request.headers && typeof request.headers.get === 'function') {
    headers['svix-id'] = request.headers.get('svix-id') || request.headers.get('Svix-Id');
    headers['svix-timestamp'] = request.headers.get('svix-timestamp') || request.headers.get('Svix-Timestamp');
    headers['svix-signature'] = request.headers.get('svix-signature') || request.headers.get('Svix-Signature');
  } else if (request.headers) {
    headers['svix-id'] = request.headers['svix-id'] || request.headers['Svix-Id'];
    headers['svix-timestamp'] = request.headers['svix-timestamp'] || request.headers['Svix-Timestamp'];
    headers['svix-signature'] = request.headers['svix-signature'] || request.headers['Svix-Signature'];
  }

  // 2. Verificação de Assinatura Svix / HMAC
  const isValidSignature = verifySvixSignature({ payload: rawBody, headers, secret });
  if (!isValidSignature) {
    return new Response(JSON.stringify({ ok: false, error: 'Assinatura do webhook inválida ou expirada' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Parsing do Evento Resend
  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'JSON de webhook inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventType = payload.type || 'unknown_event';
  const providerMessageId = payload.data?.email_id || payload.data?.id || payload.email_id || null;

  // 4. Inicialização do Cliente Supabase service_role
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Servidor indisponível' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 5. Localizar Dispatch Correspondente em communication_dispatches
  let dispatch = null;
  if (providerMessageId) {
    const { data } = await serviceClient
      .from('communication_dispatches')
      .select('id, status, provider_message_id, last_event_at, last_event_type')
      .eq('provider_message_id', providerMessageId)
      .maybeSingle();
    dispatch = data;
  }

  // 6. Inserir Registo em communication_dispatch_events com deduplicação
  const svixId = headers['svix-id'] || null;
  const providerEventAt = payload.created_at || payload.data?.created_at || null;

  const eventPayload = {
    dispatch_id: dispatch?.id || null,
    provider_message_id: providerMessageId || 'unknown',
    event_type: eventType,
    svix_id: svixId,
    provider_event_at: providerEventAt,
    payload: payload,
    created_at: new Date().toISOString()
  };

  const { error: eventInsertErr } = await serviceClient
    .from('communication_dispatch_events')
    .insert(eventPayload);

  if (eventInsertErr) {
    const isDuplicate = eventInsertErr.code === '23505' ||
      (eventInsertErr.message && (
        eventInsertErr.message.includes('duplicate key') ||
        eventInsertErr.message.includes('unique constraint') ||
        eventInsertErr.message.includes('idx_dispatch_events_svix_id_unique') ||
        eventInsertErr.message.includes('idx_dispatch_events_factual_unique')
      ));

    if (isDuplicate) {
      return new Response(JSON.stringify({
        ok: true,
        received: true,
        duplicate: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error('Erro ao guardar evento de webhook resend:', eventInsertErr);
  }

  // 7. Avançar Metadados de Último Evento no Dispatch Atomicamente na BD (Apenas eventos suportados com timestamp factual)
  if (dispatch?.id && SUPPORTED_DISPATCH_EVENTS.has(eventType) && providerEventAt) {
    const providerDate = new Date(providerEventAt);
    if (!isNaN(providerDate.getTime())) {
      const { error: rpcErr } = await serviceClient.rpc('advance_communication_dispatch_event', {
        p_dispatch_id: dispatch.id,
        p_event_type: eventType,
        p_provider_event_at: providerDate.toISOString()
      });

      if (rpcErr) {
        console.error('Erro ao avançar estado factual do dispatch via RPC:', rpcErr);
        try {
          await sendInternalCriticalAlertNotification({
            component: 'Resend Webhook',
            errorType: 'resend_webhook_rpc_failure',
            errorTitle: 'Erro ao Atualizar Estado Factual do Dispatch',
            errorMessage: rpcErr.message || 'Falha ao executar RPC advance_communication_dispatch_event',
            referenceId: providerMessageId
          });
        } catch (_) {}
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    received: true,
    event_type: eventType,
    dispatch_id: dispatch?.id || null
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Valida a assinatura de webhooks formatados segundo o padrão Svix / Resend.
 */
export function verifySvixSignature({ payload, headers, secret }) {
  if (!secret || !headers) return false;
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Verificação de Tolerância Temporal (5 minutos)
  const timestampNum = parseInt(svixTimestamp, 10);
  if (isNaN(timestampNum)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 300) {
    return false;
  }

  try {
    const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(rawSecret, 'base64');
    const toSign = `${svixId}.${svixTimestamp}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
    const hmac = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');

    const signatureParts = svixSignature.split(' ');
    for (const part of signatureParts) {
      const [version, sig] = part.split(',');
      if (version === 'v1' && sig) {
        const sigBuf = Buffer.from(sig);
        const hmacBuf = Buffer.from(hmac);
        if (sigBuf.length === hmacBuf.length && crypto.timingSafeEqual(sigBuf, hmacBuf)) {
          return true;
        }
      }
    }
  } catch (err) {
    return false;
  }

  return false;
}

export default async function handler(req, res) {
  const response = await handleResendWebhookRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
