import assert from 'node:assert';
import { test } from 'node:test';
import {
  isValidUuid,
  fetchAdminConversationDetailFromDatabase,
} from './admin-conversation-detail-service.js';
import { handleGetConversationDetailRequest } from '../../api/admin/conversations/[id].js';

test('=== INICIANDO SUITE DE TESTES DO DETALHE DE CONVERSA ADMIN (PASSO 1E.2) ===', async () => {
  // Teste 1: Validação de UUID
  assert.strictEqual(isValidUuid('1193fa1e-b211-481a-90f1-5e21c25826ce'), true);
  assert.strictEqual(isValidUuid('invalid-uuid'), false);
  assert.strictEqual(isValidUuid(''), false);
  assert.strictEqual(isValidUuid(null), false);
  console.log('TESTE 1 PASSOU: Validação rigorosa de formato UUID verificada.');

  // Teste 2: Rejeição de ID de conversa inválido com 400
  try {
    await fetchAdminConversationDetailFromDatabase({}, 'id-invalido');
    assert.fail('Deveria ter lançado erro para UUID inválido');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'ID de conversa inválido');
  }
  console.log('TESTE 2 PASSOU: Rejeição de UUID inválido (400) verificada.');

  // Teste 3: Conversa inexistente (404) e conversa existente com mensagens ordenadas
  const mockServiceClient = {
    from(table) {
      if (table === 'conversations') {
        return {
          select() {
            return {
              eq(col, val) {
                return {
                  async maybeSingle() {
                    if (val === '00000000-0000-0000-0000-000000000000') {
                      return { data: null, error: null };
                    }
                    return {
                      data: {
                        id: '1193fa1e-b211-481a-90f1-5e21c25826ce',
                        status: 'active',
                        commercial_stage: 'discovery',
                        primary_outcome: null,
                        language: 'pt',
                        created_at: '2026-08-31T00:09:22.000Z',
                        last_activity_at: '2026-08-31T00:09:55.000Z',
                        closed_at: null,
                        leads: {
                          id: 'b502dae5-2e30-4f9c-9574-947c42f889d8',
                          name: 'Fernando Teste',
                          company_name: 'Empresa Teste',
                          email: 'fernando.teste@example.com',
                          phone: null,
                          primary_service: 'websites',
                          lead_classification: 'qualified',
                          financial_alignment_status: 'aligned',
                        },
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (table === 'messages') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'msg-1',
                          sender_role: 'visitor',
                          message_type: 'visitor_text',
                          content: 'Olá!',
                          created_at: '2026-08-31T00:09:22.000Z',
                        },
                        {
                          id: 'msg-2',
                          sender_role: 'agent',
                          message_type: 'agent_text',
                          content: 'Olá, como posso ajudar?',
                          created_at: '2026-08-31T00:09:25.000Z',
                        },
                      ],
                      error: null,
                    });
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

  // Conversa inexistente (404)
  try {
    await fetchAdminConversationDetailFromDatabase(mockServiceClient, '00000000-0000-0000-0000-000000000000');
    assert.fail('Deveria ter lançado erro 404');
  } catch (err) {
    assert.strictEqual(err.statusCode, 404);
    assert.strictEqual(err.message, 'Conversa não encontrada');
  }

  // Conversa existente (200) com mensagens ordenadas
  const result = await fetchAdminConversationDetailFromDatabase(mockServiceClient, '1193fa1e-b211-481a-90f1-5e21c25826ce');
  assert.strictEqual(result.conversation.id, '1193fa1e-b211-481a-90f1-5e21c25826ce');
  assert.strictEqual(result.conversation.lead.name, 'Fernando Teste');
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender_role, 'visitor');
  assert.strictEqual(result.messages[1].sender_role, 'agent');
  assert.strictEqual(result.messages[0].content, 'Olá!');
  console.log('TESTE 3 PASSOU: Respostas 404 e 200 com mensagens ordenadas cronologicamente validadas.');

  // Teste 4: Rejeição de requisições não autenticadas (401)
  const reqUnauth = new Request('http://localhost:3000/api/admin/conversations/1193fa1e-b211-481a-90f1-5e21c25826ce');
  const resUnauth = await handleGetConversationDetailRequest(reqUnauth);
  assert.strictEqual(resUnauth.status, 401);
  const jsonUnauth = await resUnauth.json();
  assert.strictEqual(jsonUnauth.ok, false);
  console.log('TESTE 4 PASSOU: Rejeição de requisições não autenticadas (401) verificada.');

  console.log('\n=== TODOS OS TESTES DO DETALHE DE CONVERSA (PASSO 1E.2) PASSARAM COM SUCESSO ===');
});
