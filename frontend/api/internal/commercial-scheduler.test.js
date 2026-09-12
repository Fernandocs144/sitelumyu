import assert from 'node:assert';
import { handleCommercialSchedulerCron } from './commercial-scheduler.js';

console.log('=== INICIANDO TESTES DO ENDPOINT VERCEL CRON DO SCHEDULER COMERCIAL ===\n');

async function runTests() {
  const originalEnv = { ...process.env };

  try {
    // 1. Método HTTP não permitido (POST) -> 405
    {
      const req = { method: 'POST', headers: new Map() };
      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();
      assert.strictEqual(res.status, 405);
      assert.strictEqual(body.ok, false);
      assert.strictEqual(body.error, 'Método não permitido.');
      console.log('TESTE 1 PASSOU: Método diferente de GET rejeitado com 405.');
    }

    // 2. CRON_SECRET ausente no servidor -> 500 (Fail-Closed)
    {
      delete process.env.CRON_SECRET;
      const req = { method: 'GET', headers: new Map([['authorization', 'Bearer any-token']]) };
      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.ok, false);
      assert.strictEqual(body.error, 'Configuração do servidor incompleta.');
      console.log('TESTE 2 PASSOU: CRON_SECRET ausente no servidor rejeitado com 500 (Fail-Closed).');
    }

    // 3. Header Authorization ausente -> 401
    {
      process.env.CRON_SECRET = 'secret-test-key-123';
      const req = { method: 'GET', headers: new Map() };
      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.ok, false);
      assert.strictEqual(body.error, 'Acesso não autorizado.');
      console.log('TESTE 3 PASSOU: Header Authorization ausente rejeitado com 401.');
    }

    // 4. Header Authorization com token incorreto -> 401
    {
      process.env.CRON_SECRET = 'secret-test-key-123';
      const req = { method: 'GET', headers: new Map([['authorization', 'Bearer wrong-secret-key']]) };
      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.ok, false);
      assert.strictEqual(body.error, 'Acesso não autorizado.');
      console.log('TESTE 4 PASSOU: Bearer com token incorreto rejeitado com 401.');
    }

    // 5. Autorização correta com env Supabase incompleto -> 500
    {
      process.env.CRON_SECRET = 'secret-test-key-123';
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SERVICE_ROLE_KEY;

      const req = { method: 'GET', headers: new Map([['authorization', 'Bearer secret-test-key-123']]) };
      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.ok, false);
      assert.strictEqual(body.error, 'Erro de configuração da base de dados.');
      console.log('TESTE 5 PASSOU: Credenciais Supabase ausentes tratadas com 500.');
    }

    // 6. Chamada autenticada completa com mock -> 200 + métricas sem PII
    {
      process.env.CRON_SECRET = 'secret-test-key-123';
      process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key-xyz';

      const req = {
        method: 'GET',
        headers: new Map([['authorization', 'Bearer secret-test-key-123']])
      };

      const res = await handleCommercialSchedulerCron(req);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.ok, true);
      assert.ok(body.metrics, 'Métricas retornadas no corpo da resposta');

      // Verificar ausência de PII nas métricas
      const jsonStr = JSON.stringify(body.metrics);
      assert.strictEqual(jsonStr.includes('@'), false, 'Sem emails em metrics');
      assert.strictEqual(jsonStr.includes('name'), false, 'Sem nomes de leads em metrics');

      // Verificar flags de execução
      assert.strictEqual(body.metrics.dry_run, false);
      assert.strictEqual(body.metrics.enable_automatic_tasks, true);
      assert.strictEqual(body.metrics.enable_automatic_outbound, true);

      console.log('TESTE 6 PASSOU: Chamada autorizada executou com dryRun: false, automaticTasks: true, automaticOutbound: true e sem PII.');
    }

    console.log('\n=== TODOS OS TESTES DO ENDPOINT CRON DO SCHEDULER PASSARAM COM SUCESSO ===');
  } finally {
    process.env = originalEnv;
  }
}

runTests().catch((err) => {
  console.error('FALHA NOS TESTES DO ENDPOINT CRON:', err);
  process.exit(1);
});
