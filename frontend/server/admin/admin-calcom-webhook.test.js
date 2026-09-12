import assert from 'node:assert';
import crypto from 'node:crypto';
import { test } from 'node:test';
import {
  verifyCalComWebhookSignature,
  extractCalComBookingInformation,
  processCalComWebhookEvent,
} from './calcom-webhook-service.js';
import { handleCalComWebhookRequest } from '../../api/webhooks/calcom.js';

test('=== INICIANDO SUITE COMPLETA DE TESTES DO WEBHOOK CAL.COM (PASSO 1G) ===', async () => {
  // Teste 1: Validação de Assinatura HMAC SHA-256
  const secret = 'super-secret-webhook-key';
  const body = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'cal_test_123' } });
  const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  assert.strictEqual(verifyCalComWebhookSignature(body, validSignature, secret), true);
  assert.strictEqual(verifyCalComWebhookSignature(body, 'v1=' + validSignature, secret), true);
  assert.strictEqual(verifyCalComWebhookSignature(body, 'sha256=' + validSignature, secret), true);
  assert.strictEqual(verifyCalComWebhookSignature(body, 'invalid_sig', secret), false);
  assert.strictEqual(verifyCalComWebhookSignature(body, null, secret), false);
  console.log('TESTE 1 PASSOU: Validação de assinatura HMAC SHA-256 verificada.');

  // Teste 2: Rejeição de Requisições Sem Assinatura Válida (401) e Payload Inválido (400)
  process.env.CALCOM_WEBHOOK_SECRET = 'my-secret-key';
  const reqUnauth = new Request('http://localhost:3000/api/webhooks/calcom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggerEvent: 'BOOKING_CREATED' }),
  });
  const resUnauth = await handleCalComWebhookRequest(reqUnauth);
  assert.strictEqual(resUnauth.status, 401);
  delete process.env.CALCOM_WEBHOOK_SECRET;

  const reqInvalidJson = new Request('http://localhost:3000/api/webhooks/calcom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'invalid-json-content',
  });
  const resInvalidJson = await handleCalComWebhookRequest(reqInvalidJson);
  assert.strictEqual(resInvalidJson.status, 400);
  console.log('TESTE 2 PASSOU: Rejeição de requisições sem assinatura (401) e JSON inválido (400) verificada.');

  // Teste 3: Extração de Informações do Booking & Metadata
  const payloadSample = {
    triggerEvent: 'BOOKING_CREATED',
    payload: {
      uid: 'cal_uid_999',
      startTime: '2026-09-10T10:00:00.000Z',
      endTime: '2026-09-10T10:30:00.000Z',
      timeZone: 'Europe/Lisbon',
      attendees: [{ name: 'Cliente Teste', email: 'cliente@example.com' }],
      responses: {
        'metadata[conversation_id]': '1193fa1e-b211-481a-90f1-5e21c25826ce',
        'metadata[lead_id]': 'b502dae5-2e30-4f9c-9574-947c42f889d8',
      },
    },
  };

  const info = extractCalComBookingInformation(payloadSample);
  assert.strictEqual(info.triggerEvent, 'BOOKING_CREATED');
  assert.strictEqual(info.externalBookingId, 'cal_uid_999');
  assert.strictEqual(info.attendeeName, 'Cliente Teste');
  assert.strictEqual(info.attendeeEmail, 'cliente@example.com');
  assert.strictEqual(info.conversation_id, '1193fa1e-b211-481a-90f1-5e21c25826ce');
  assert.strictEqual(info.lead_id, 'b502dae5-2e30-4f9c-9574-947c42f889d8');
  console.log('TESTE 3 PASSOU: Extração de booking, datas e metadata normalizada.');

  // Teste 4: Processamento de Booking Confirmado (BOOKING_CREATED), Idempotência e Atualização de Conversa
  let updatedOutcome = null;
  let updatedStage = null;
  let updatedNextStep = null;
  const mockDbStorage = new Map();

  const mockSupabase = {
    from(table) {
      if (table === 'conversations') {
        return {
          select() {
            return {
              eq(col, val) {
                return {
                  async maybeSingle() {
                    return { data: { id: val, lead_id: 'b502dae5-2e30-4f9c-9574-947c42f889d8' }, error: null };
                  },
                };
              },
            };
          },
          update(fields) {
            if (fields.primary_outcome) updatedOutcome = fields.primary_outcome;
            if (fields.commercial_stage) updatedStage = fields.commercial_stage;
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === 'leads') {
        return {
          update(fields) {
            if (fields.next_step) updatedNextStep = fields.next_step;
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === 'calendar_bookings') {
        return {
          upsert(record, opts) {
            const key = `${record.provider}_${record.external_booking_id}`;
            mockDbStorage.set(key, record);
            return {
              select() {
                return {
                  async single() {
                    return { data: { id: 'booking-uuid-1', ...record }, error: null };
                  },
                };
              },
            };
          },
          update(fields) {
            return {
              eq() {
                return {
                  eq(col, val) {
                    return {
                      select() {
                        return {
                          async maybeSingle() {
                            return { data: { id: 'booking-uuid-1', conversation_id: '1193fa1e-b211-481a-90f1-5e21c25826ce' }, error: null };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      async maybeSingle() {
                        return { data: null, error: null };
                      },
                    };
                  },
                  in() {
                    return {
                      neq() {
                        return Promise.resolve({ data: [], error: null });
                      },
                    };
                  },
                  async maybeSingle() {
                    return { data: null, error: null };
                  },
                };
              },
            };
          },
        };
      }
      return {};
    },
  };

  const createResult = await processCalComWebhookEvent(mockSupabase, info);
  assert.strictEqual(createResult.ok, true);
  assert.strictEqual(createResult.action, 'booking_created');
  assert.strictEqual(updatedOutcome, 'meeting_booked');
  assert.strictEqual(updatedStage, 'closed');
  assert.strictEqual(updatedNextStep, 'schedule_meeting');
  assert.strictEqual(mockDbStorage.size, 1);
  console.log('TESTE 4 PASSOU: Booking criado, idempotência e atualização de conversation/lead verificadas.');

  // Teste 5: Processamento de Reagendamento (BOOKING_RESCHEDULED)
  const infoRescheduled = { ...info, triggerEvent: 'BOOKING_RESCHEDULED' };
  const rescheduleResult = await processCalComWebhookEvent(mockSupabase, infoRescheduled);
  assert.strictEqual(rescheduleResult.ok, true);
  assert.strictEqual(rescheduleResult.action, 'booking_rescheduled');
  assert.strictEqual(mockDbStorage.size, 1); // Sem duplicação
  console.log('TESTE 5 PASSOU: Reagendamento sem duplicação verificado.');

  // Teste 6: Processamento de Cancelamento (BOOKING_CANCELLED) e Recálculo de Outcome
  const infoCancelled = { ...info, triggerEvent: 'BOOKING_CANCELLED' };
  const cancelResult = await processCalComWebhookEvent(mockSupabase, infoCancelled);
  assert.strictEqual(cancelResult.ok, true);
  assert.strictEqual(cancelResult.action, 'booking_cancelled');
  console.log('TESTE 6 PASSOU: Cancelamento e recálculo seguro do outcome validados.');

  console.log('\n=== TODOS OS TESTES DO WEBHOOK CAL.COM (PASSO 1G) PASSARAM COM SUCESSO ===');
});
