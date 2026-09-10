import assert from 'node:assert';
import {
  isValidUuid,
  LEAD_DETAIL_FIELDS,
  fetchLeadByIdFromDatabase,
} from './admin-lead-detail-service.js';
import { handleGetLeadDetailRequest } from '../../api/admin/leads/[id].js';

console.log('=== INICIANDO SUITE DE TESTES DO DETALHE DE LEAD ADMIN (PASSO 1D) ===\n');

// 1. TESTE DE VALIDAÇÃO DE UUID
{
  assert.strictEqual(isValidUuid('123e4567-e89b-12d3-a456-426614174000'), true, 'UUID v4 válido deve retornar true');
  assert.strictEqual(isValidUuid('abc-123'), false, 'ID curto inválido deve retornar false');
  assert.strictEqual(isValidUuid(''), false, 'String vazia deve retornar false');
  assert.strictEqual(isValidUuid(null), false, 'Null deve retornar false');
  assert.strictEqual(isValidUuid(undefined), false, 'Undefined deve retornar false');

  console.log('TESTE 1 PASSOU: Validação rigorosa de formato UUID verificada.');
}

// 2. TESTE DE MINIMIZAÇÃO DE CAMPOS DO DETALHE
{
  assert.ok(LEAD_DETAIL_FIELDS.includes('need_description'), 'Deve conter descrição da necessidade');
  assert.ok(LEAD_DETAIL_FIELDS.includes('financial_alignment_reason'), 'Deve conter motivo do alinhamento');
  assert.ok(!LEAD_DETAIL_FIELDS.includes('email_normalized'), 'NÃO deve conter colunas geradas email_normalized');
  assert.ok(!LEAD_DETAIL_FIELDS.includes('budget_normalization_status'), 'NÃO deve conter estado interno do pipeline');

  console.log('TESTE 2 PASSOU: Minimização e seleção explícita de campos do detalhe verificadas.');
}

// 3. TESTE DE CONSULTA A LEAD INEXISTENTE E VÁLIDA (MOCKED SUPABASE CLIENT)
{
  // Teste ID Inválido
  const mockSupabase = {};
  await assert.rejects(
    async () => fetchLeadByIdFromDatabase(mockSupabase, 'id-invalido'),
    (err) => {
      assert.strictEqual(err.statusCode, 400, 'ID inválido deve gerar erro 400');
      return true;
    }
  );

  // Teste Lead Não Encontrada (404)
  // Teste Lead Não Encontrada (404)
  const mockSupabase404 = {
    from(table) {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        order() { return builder; },
        limit() { return builder; },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
        then(resolve) { return resolve({ data: [], error: null }); },
      };
      return builder;
    },
  };

  await assert.rejects(
    async () => fetchLeadByIdFromDatabase(mockSupabase404, '123e4567-e89b-12d3-a456-426614174000'),
    (err) => {
      assert.strictEqual(err.statusCode, 404, 'Lead inexistente deve gerar erro 404');
      return true;
    }
  );

  // Teste Lead Válida Encontrada
  const mockSupabase200 = {
    from(table) {
      if (table === 'leads') {
        const builder = {
          select() { return builder; },
          eq() { return builder; },
          maybeSingle() {
            return Promise.resolve({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Cliente Teste Detalhe',
                email: 'cliente@teste.pt',
                primary_service: 'websites',
                lead_classification: 'priority',
                financial_alignment_reason: 'budget_aligned_project_range',
              },
              error: null,
            });
          },
        };
        return builder;
      }

      if (table === 'conversations') {
        const builder = {
          select() { return builder; },
          eq() { return builder; },
          order() { return builder; },
          limit() { return builder; },
          maybeSingle() {
            return Promise.resolve({
              data: {
                id: 'conv-123',
                status: 'completed',
                commercial_stage: 'closed',
              },
              error: null,
            });
          },
          then(resolve) {
            return resolve({
              data: [
                {
                  id: 'conv-123',
                  status: 'completed',
                  commercial_stage: 'closed',
                },
              ],
              error: null,
            });
          },
        };
        return builder;
      }

      const defaultBuilder = {
        select() { return defaultBuilder; },
        eq() { return defaultBuilder; },
        order() { return defaultBuilder; },
        limit() { return defaultBuilder; },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
        then(resolve) { return resolve({ data: [], error: null }); },
      };
      return defaultBuilder;
    },
  };

  const result = await fetchLeadByIdFromDatabase(mockSupabase200, '123e4567-e89b-12d3-a456-426614174000');
  assert.strictEqual(result.lead.id, '123e4567-e89b-12d3-a456-426614174000');
  assert.strictEqual(result.lead.name, 'Cliente Teste Detalhe');
  assert.strictEqual(result.conversation.id, 'conv-123');

  console.log('TESTE 3 PASSOU: Respostas 400, 404 e 200 com conversa associada verificadas.');
}

// 4. TESTE DE SEGURANÇA E AUTENTICAÇÃO DO ENDPOINT HTTP GET /api/admin/leads/:id
{
  // Sem cookie de sessão -> 401
  const reqUnauth = new Request('http://localhost/api/admin/leads/123e4567-e89b-12d3-a456-426614174000');
  const resUnauth = await handleGetLeadDetailRequest(reqUnauth);
  assert.strictEqual(resUnauth.status, 401, 'Requisição sem cookie deve retornar 401');

  console.log('TESTE 4 PASSOU: Rejeição de requisições não autenticadas (401) no endpoint de detalhe verificada.');
}

console.log('\n=== TODOS OS TESTES DO DETALHE DE LEAD (PASSO 1D) PASSARAM COM SUCESSO ===');
