import assert from 'node:assert';
import {
  parseConversationsQueryParams,
  sanitizeSearchTerm,
  isValidUuid,
  fetchAdminConversationsFromDatabase,
} from './admin-conversations-service.js';
import { handleGetConversationsRequest } from '../../api/admin/conversations.js';

console.log('=== INICIANDO SUITE COMPLETA DE TESTES DA LISTAGEM E PESQUISA DE CONVERSAS (PASSO 1E.1) ===\n');

// 1. TESTE DE SANITIZAÇÃO DE TERMOS DE PESQUISA (EMAILS, ESPAÇOS E PONTOS)
{
  assert.strictEqual(sanitizeSearchTerm('  Fernando Teste  '), 'Fernando Teste', 'Espaços duplos/extremos devem ser limpos');
  assert.strictEqual(sanitizeSearchTerm('fernando.teste@example.com'), 'fernando.teste@example.com', 'Pontos e arroba de emails DEVEM ser preservados');
  assert.strictEqual(sanitizeSearchTerm('Fernando (Teste),'), 'Fernando Teste', 'Vírgulas e parênteses PostgREST devem ser removidos');

  console.log('TESTE 1 PASSOU: Preservação de emails e sanitização de sintaxe PostgREST verificada.');
}

// 2. TESTE DE PARSER DE PARÂMETROS E SANITIZAÇÃO DE ENUMS
{
  const p1 = parseConversationsQueryParams(new URLSearchParams(''));
  assert.strictEqual(p1.page, 1, 'Default page deve ser 1');
  assert.strictEqual(p1.pageSize, 20, 'Default pageSize deve ser 20');
  assert.strictEqual(p1.search, '', 'Default search deve ser vazio');

  const p2 = parseConversationsQueryParams(new URLSearchParams('page=2&pageSize=250&stage=discovery&outcome=meeting_booked'));
  assert.strictEqual(p2.page, 2, 'Page deve ser 2');
  assert.strictEqual(p2.pageSize, 100, 'PageSize deve ser truncado para 100');
  assert.strictEqual(p2.stage, 'discovery', 'Stage válido deve ser aceite');
  assert.strictEqual(p2.outcome, 'meeting_booked', 'Outcome válido deve ser aceite');

  // Enums inválidos devem ser descartados
  const p3 = parseConversationsQueryParams(new URLSearchParams('stage=invalid_stage&outcome=invalid_outcome'));
  assert.strictEqual(p3.stage, '', 'Stage inválido deve fallback para vazio');
  assert.strictEqual(p3.outcome, '', 'Outcome inválido deve fallback para vazio');

  console.log('TESTE 2 PASSOU: Sanitização de enums e limite máximo de pageSize (100) verificados.');
}

// 3. TESTE DE CONSULTA MOCKED COM DIFERENTES COMBINAÇÕES DE PESQUISA
{
  let lastQuery = {};

  const mockSupabase = {
    from(table) {
      assert.strictEqual(table, 'conversations');
      return {
        select(fields) {
          lastQuery.fields = fields;
          return this;
        },
        eq(col, val) {
          lastQuery.eq = lastQuery.eq || {};
          lastQuery.eq[col] = val;
          return this;
        },
        or(condition, options) {
          lastQuery.or = condition;
          lastQuery.orOptions = options;
          return this;
        },
        order() { return this; },
        range(from, to) {
          lastQuery.range = [from, to];
          return Promise.resolve({
            data: [
              {
                id: '1193fa1e-b211-481a-90f1-5e21c25826ce',
                status: 'active',
                commercial_stage: 'discovery',
                primary_outcome: null,
                created_at: '2026-08-30T22:49:39.181Z',
                last_activity_at: '2026-08-30T22:50:18.222Z',
                leads: {
                  id: 'lead-123',
                  name: 'Fernando Teste',
                  email: 'fernando.teste@example.com',
                },
                messages: [{ count: 12 }],
              },
            ],
            count: 1,
            error: null,
          });
        },
      };
    },
  };

  // Teste A: Pesquisa por texto com espaços e pontos "fernando.teste@example.com"
  lastQuery = {};
  const resA = await fetchAdminConversationsFromDatabase(mockSupabase, {
    page: 1,
    pageSize: 20,
    search: 'fernando.teste@example.com',
    stage: 'discovery',
    outcome: '',
  });

  assert.strictEqual(resA.conversations.length, 1);
  assert.strictEqual(resA.conversations[0].lead.email, 'fernando.teste@example.com');
  assert.strictEqual(resA.conversations[0].messageCount, 12);
  assert.ok(lastQuery.or.includes('fernando.teste@example.com'), 'Email completo com pontos deve estar presente no or()');

  // Teste B: Pesquisa por UUID exato
  lastQuery = {};
  const validUuid = '1193fa1e-b211-481a-90f1-5e21c25826ce';
  const resB = await fetchAdminConversationsFromDatabase(mockSupabase, {
    page: 1,
    pageSize: 20,
    search: validUuid,
    stage: '',
    outcome: '',
  });

  assert.strictEqual(lastQuery.eq['id'], validUuid, 'UUID exato deve ser buscado via .eq(id, uuid) para evitar erro Postgres 42883');

  console.log('TESTE 3 PASSOU: Pesquisa de email com pontos, UUID exato e contagem de mensagens validadas.');
}

// 4. TESTE DE SEGURANÇA E AUTENTICAÇÃO DO ENDPOINT GET /api/admin/conversations
{
  const reqUnauth = new Request('http://localhost/api/admin/conversations');
  const resUnauth = await handleGetConversationsRequest(reqUnauth);
  assert.strictEqual(resUnauth.status, 401, 'Requisição sem cookie de sessão deve retornar 401');

  console.log('TESTE 4 PASSOU: Rejeição de requisições não autenticadas (401) verificada.');
}

console.log('\n=== TODOS OS TESTES DA LISTAGEM DE CONVERSAS PASSARAM COM SUCESSO ===');
