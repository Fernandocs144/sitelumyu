import assert from 'node:assert';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { handleResendWebhookRequest, verifySvixSignature, SUPPORTED_DISPATCH_EVENTS } from '../../api/webhooks/resend.js';

test('=== INICIANDO SUITE DE TESTES DO WEBHOOK RESEND E LIFECYCLE (FASE 7I.1) ===', async () => {
  // Teste 1: Validação de Eventos Suportados no Set
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.delivered'), true);
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.delivery_delayed'), true);
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.bounced'), true);
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.complained'), true);
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.failed'), true);
  assert.strictEqual(SUPPORTED_DISPATCH_EVENTS.has('email.sent'), true);
  console.log('TESTE 1 PASSOU: Todos os eventos de lifecycle do Resend estão presentes na allowlist.');

  // Teste 2: Validação de Assinatura Svix HMAC SHA-256
  const secretKey = 'whsec_dGVzdF9zZWNyZXRfa2V5XzEyMzQ1Njc4OTA=';
  const svixId = 'msg_test_123';
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();
  const rawPayload = JSON.stringify({ type: 'email.delivered', data: { email_id: 'resend_msg_999' } });

  const rawSecret = secretKey.slice(6);
  const secretBytes = Buffer.from(rawSecret, 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${rawPayload}`;
  const hmac = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');
  const svixSignature = `v1,${hmac}`;

  const headers = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature
  };

  assert.strictEqual(verifySvixSignature({ payload: rawPayload, headers, secret: secretKey }), true);
  assert.strictEqual(verifySvixSignature({ payload: rawPayload, headers, secret: 'invalid_secret' }), false);
  console.log('TESTE 2 PASSOU: Validação de assinatura Svix HMAC SHA-256 verificada com sucesso.');

  // Teste 3: Verificação de Fallbacks de Variáveis de Ambiente do Supabase
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  process.env.SERVICE_ROLE_KEY = 'mock_service_role_key';
  process.env.RESEND_WEBHOOK_SECRET = secretKey;

  const mockRequest = new Request('http://localhost:3000/api/webhooks/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    },
    body: rawPayload
  });

  // A requisição deve passar pelas validações de env vars sem retornar 500 por falta de SUPABASE_URL
  const response = await handleResendWebhookRequest(mockRequest);
  // Como não há servidor Supabase ativo para a chamada mock, a resposta esperada não é erro 500 de missing env vars
  assert.notStrictEqual(response.status, 500);
  console.log('TESTE 3 PASSOU: Fallbacks de variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SERVICE_ROLE_KEY validados.');

  // Limpeza de env vars de teste
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SERVICE_ROLE_KEY;
  delete process.env.RESEND_WEBHOOK_SECRET;

  console.log('\n=== TODOS OS TESTES DO WEBHOOK RESEND E LIFECYCLE PASSARAM COM SUCESSO ===');
});
