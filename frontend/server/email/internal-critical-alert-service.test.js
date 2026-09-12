import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sendInternalCriticalAlertNotification,
  buildHourlyIdempotencyKey
} from './internal-critical-alert-service.js';

describe('Internal Critical Alert Service', () => {
  it('deve gerar chave de idempotência com balde temporal de 1 hora', () => {
    const date1 = new Date('2026-09-12T14:15:00.000Z');
    const date2 = new Date('2026-09-12T14:45:00.000Z');
    const dateNextHour = new Date('2026-09-12T15:05:00.000Z');

    const key1 = buildHourlyIdempotencyKey('scheduler_failure', null, date1);
    const key2 = buildHourlyIdempotencyKey('scheduler_failure', null, date2);
    const key3 = buildHourlyIdempotencyKey('scheduler_failure', null, dateNextHour);

    assert.strictEqual(key1, key2, 'Mesmo erro dentro da mesma hora deve produzir a mesma chave');
    assert.notStrictEqual(key1, key3, 'Erro na hora seguinte deve produzir chave diferente');
    assert.ok(key1.startsWith('crit_alert_scheduler_failure_'));
  });

  it('deve incluir referenceId na chave quando fornecido', () => {
    const dateRef = new Date('2026-09-12T14:00:00.000Z');
    const keyWithRef = buildHourlyIdempotencyKey('dispatch_failed', 'disp_123', dateRef);
    assert.ok(keyWithRef.includes('disp_123'));
  });

  it('deve montar e disparar notificação de alerta crítico com sucesso', async () => {
    let sentPayload = null;
    let sentOptions = null;

    const mockResendClient = {
      emails: {
        send: async (payload, options) => {
          sentPayload = payload;
          sentOptions = options;
          return { data: { id: 'alert_msg_123' }, error: null };
        }
      }
    };

    const res = await sendInternalCriticalAlertNotification({
      component: 'Commercial Scheduler',
      errorType: 'scheduler_global_failure',
      errorTitle: 'Falha Global na Execução',
      errorMessage: 'Database connection timeout',
      now: new Date('2026-09-12T14:00:00.000Z'),
      resendClient: mockResendClient
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.providerMessageId, 'alert_msg_123');
    assert.strictEqual(sentPayload.to[0], 'comercial@lumyo.pt');
    assert.strictEqual(sentPayload.subject, '[LUMYO Alerta Crítico] Commercial Scheduler - Falha Global na Execução');
    assert.ok(sentPayload.text.includes('Database connection timeout'));
    assert.ok(sentOptions.idempotencyKey.includes('crit_alert_scheduler_global_failure_'));
  });

  it('deve ser 100% fail-safe e não lançar exceção se o provider falhar', async () => {
    const mockFailingResendClient = {
      emails: {
        send: async () => {
          throw new Error('Resend API Unavailable');
        }
      }
    };

    const res = await sendInternalCriticalAlertNotification({
      component: 'Zoho Sync',
      errorType: 'zoho_sync_failed',
      errorMessage: 'Zoho API Error',
      resendClient: mockFailingResendClient
    });

    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.errorCode, 'ERROR');
  });
});
