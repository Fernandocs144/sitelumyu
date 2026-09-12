import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sendInternalHandoffNotification } from './internal-handoff-notification-service.js';

describe('Internal Handoff Email Notification Service', () => {
  it('deve lançar erro se lead ou fingerprint não forem fornecidos', async () => {
    await assert.rejects(
      () => sendInternalHandoffNotification({ fingerprint: 'fp123' }),
      /lead com id é obrigatório/
    );

    await assert.rejects(
      () => sendInternalHandoffNotification({ lead: { id: 'lead-1' } }),
      /fingerprint é obrigatório/
    );
  });

  it('deve montar o email corretamente e utilizar o destinatário de CONTACT_FORM_DESTINATION_EMAIL com fallback', async () => {
    const originalEnv = process.env.CONTACT_FORM_DESTINATION_EMAIL;
    delete process.env.CONTACT_FORM_DESTINATION_EMAIL;

    let sentPayload = null;
    let sentOptions = null;

    const mockResendClient = {
      emails: {
        send: async (payload, options) => {
          sentPayload = payload;
          sentOptions = options;
          return { data: { id: 'resend_msg_test_123' }, error: null };
        }
      }
    };

    const mockLead = {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Josefino Teste',
      email: 'josefino@exemplo.com',
      primary_service: 'websites',
      need_description: 'Novo site institucional'
    };

    const res = await sendInternalHandoffNotification({
      lead: mockLead,
      reasonCode: 'human_contact_requested',
      taskTitle: 'Contacto humano solicitado pelo visitante',
      fingerprint: 'abc123fingerprint',
      resendClient: mockResendClient
    });

    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.providerMessageId, 'resend_msg_test_123');
    assert.deepStrictEqual(sentPayload.to, ['comercial@lumyo.pt']);
    assert.strictEqual(sentPayload.subject, '[LUMYO Handoff] Contacto humano solicitado pelo visitante - Josefino Teste');
    assert.ok(sentPayload.text.includes('Josefino Teste'));
    assert.ok(sentPayload.text.includes('websites'));
    assert.ok(sentPayload.text.includes('https://www.lumyo.pt/admin/leads?id=00000000-0000-4000-8000-000000000001'));
    assert.ok(sentOptions.idempotencyKey.includes('abc123fingerprint'));

    // Restaurar env var
    if (originalEnv) process.env.CONTACT_FORM_DESTINATION_EMAIL = originalEnv;
  });

  it('deve respeitar CONTACT_FORM_DESTINATION_EMAIL quando configurado', async () => {
    const originalEnv = process.env.CONTACT_FORM_DESTINATION_EMAIL;
    process.env.CONTACT_FORM_DESTINATION_EMAIL = 'equipa.comercial@lumyo.pt';

    let sentPayload = null;
    const mockResendClient = {
      emails: {
        send: async (payload) => {
          sentPayload = payload;
          return { data: { id: 'resend_msg_test_456' }, error: null };
        }
      }
    };

    const mockLead = { id: 'lead-2', name: 'Maria Silva' };

    await sendInternalHandoffNotification({
      lead: mockLead,
      fingerprint: 'fp456',
      resendClient: mockResendClient
    });

    assert.deepStrictEqual(sentPayload.to, ['equipa.comercial@lumyo.pt']);

    if (originalEnv) {
      process.env.CONTACT_FORM_DESTINATION_EMAIL = originalEnv;
    } else {
      delete process.env.CONTACT_FORM_DESTINATION_EMAIL;
    }
  });

  it('deve lidar graciosamente com erros do provider sem lançar exceção', async () => {
    const mockFailingResendClient = {
      emails: {
        send: async () => {
          return { data: null, error: { name: 'RESEND_ERROR', message: 'API Unavailable' } };
        }
      }
    };

    const res = await sendInternalHandoffNotification({
      lead: { id: 'lead-3' },
      fingerprint: 'fp789',
      resendClient: mockFailingResendClient
    });

    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.errorCode, 'RESEND_ERROR');
  });
});
