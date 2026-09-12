import assert from 'node:assert';
import {
  isValidUuid,
  LEAD_DETAIL_FIELDS,
  fetchLeadByIdFromDatabase,
  updateLeadContactInDatabase,
} from './admin-lead-detail-service.js';
import { handleGetLeadDetailRequest } from './handlers/lead-detail.js';
import { handlePatchLeadContactRequest } from './handlers/lead-contact.js';

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

// 5. TESTE DE ATUALIZAÇÃO EXCLUSIVA DE CONTACTO (name, company_name, phone)
{
  let updatedPayloadCaptured = null;
  const mockSupabaseUpdate = {
    from(table) {
      assert.strictEqual(table, 'leads', 'Deve atualizar apenas a tabela leads');
      const builder = {
        update(payload) {
          updatedPayloadCaptured = payload;
          return builder;
        },
        eq(col, val) {
          assert.strictEqual(col, 'id');
          assert.strictEqual(val, '123e4567-e89b-12d3-a456-426614174000');
          return builder;
        },
        select() { return builder; },
        maybeSingle() {
          return Promise.resolve({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'original@teste.pt',
              email_normalized: 'original@teste.pt',
              pipeline_stage: 'contacted',
              name: updatedPayloadCaptured.name,
              company_name: updatedPayloadCaptured.company_name,
              phone: updatedPayloadCaptured.phone,
            },
            error: null,
          });
        },
      };
      return builder;
    },
  };

  // Teste: Adicionar e alterar telefone, nome e empresa
  const res1 = await updateLeadContactInDatabase(mockSupabaseUpdate, '123e4567-e89b-12d3-a456-426614174000', {
    name: '  Novo Nome  ',
    company_name: 'Nova Empresa Lda',
    phone: '+351 912 345 678',
    email: 'hacker@teste.pt', // Deve ser ignorado
    pipeline_stage: 'won', // Deve ser ignorado
  });

  assert.strictEqual(res1.lead.name, 'Novo Nome');
  assert.strictEqual(res1.lead.company_name, 'Nova Empresa Lda');
  assert.strictEqual(res1.lead.phone, '+351 912 345 678');
  assert.strictEqual(res1.lead.email, 'original@teste.pt', 'Email deve permanecer inalterado');
  assert.strictEqual(res1.lead.pipeline_stage, 'contacted', 'Pipeline deve permanecer inalterado');
  assert.strictEqual(updatedPayloadCaptured.email, undefined, 'Payload de update não deve conter email');
  assert.strictEqual(updatedPayloadCaptured.pipeline_stage, undefined, 'Payload de update não deve conter pipeline');

  // Teste: Remover telefone (passando string vazia -> NULL)
  const res2 = await updateLeadContactInDatabase(mockSupabaseUpdate, '123e4567-e89b-12d3-a456-426614174000', {
    phone: '   ',
  });
  assert.strictEqual(res2.lead.phone, null, 'String vazia deve ser convertida para NULL');

  // Teste HTTP Unauthenticated -> 401
  const reqUnauth = new Request('http://localhost/api/admin/leads/123e4567-e89b-12d3-a456-426614174000/contact', {
    method: 'PATCH',
    body: JSON.stringify({ phone: '+351 900 000 000' }),
  });
  const httpRes = await handlePatchLeadContactRequest(reqUnauth);
  assert.strictEqual(httpRes.status, 401, 'Requisição não autenticada deve retornar 401');

  console.log('TESTE 5 PASSOU: Atualização exclusiva de contacto (phone, name, company_name) e isolamento verificados.');
}

console.log('\n=== TODOS OS TESTES DO DETALHE DE LEAD PASSARAM COM SUCESSO ===');

