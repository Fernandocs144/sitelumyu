import assert from 'node:assert';
import {
  fetchGlobalAdminTasksFromDatabase,
  getLocalDayBoundsIso,
} from './admin-tasks-service.js';
import {
  updateLeadTaskDetailsInDatabase,
  createLeadTaskInDatabase,
  sortLeadTasks,
  formatTaskMetadata,
} from './admin-lead-tasks-service.js';
import { handleGetTasksRequest } from './handlers/tasks.js';
import { handlePatchLeadTaskStatusRequest } from './handlers/lead-task-status.js';

console.log('=== INICIANDO SUITE DE TESTES DO MÓDULO DE TAREFAS ADMIN (PASSO 1) ===\n');

// 1. TESTE DE CÁLCULO DE FUSO HORÁRIO (getLocalDayBoundsIso)
{
  const testDate = new Date('2026-09-12T12:00:00.000Z');
  // Offset 0 (UTC)
  const boundsUtc = getLocalDayBoundsIso(0, testDate);
  assert.strictEqual(boundsUtc.startOfTodayIso, '2026-09-12T00:00:00.000Z', 'Start of today UTC');
  assert.strictEqual(boundsUtc.startOfTomorrowIso, '2026-09-13T00:00:00.000Z', 'Start of tomorrow UTC');

  // Offset -60 (UTC+1 / Lisboa no verão)
  const boundsLisbon = getLocalDayBoundsIso(-60, testDate);
  assert.strictEqual(boundsLisbon.startOfTodayIso, '2026-09-11T23:00:00.000Z', 'Start of today UTC+1 em UTC deve ser 23:00 do dia anterior');
  assert.strictEqual(boundsLisbon.startOfTomorrowIso, '2026-09-12T23:00:00.000Z', 'Start of tomorrow UTC+1 em UTC deve ser 23:00 de hoje');

  console.log('TESTE 1 PASSOU: Cálculo dos limites do dia com fuso horário (getLocalDayBoundsIso) verificado.');
}

// 2. TESTE DE EDIÇÃO DE DETALHES DA TAREFA (updateLeadTaskDetailsInDatabase)
{
  const validLeadId = '11111111-1111-4111-a111-111111111111';
  const validTaskId = '22222222-2222-4222-a222-222222222222';

  // Mock do Supabase para edição
  let updatePayloadReceived = null;
  const mockSupabase = {
    from(table) {
      assert.strictEqual(table, 'lead_tasks');
      return {
        select() {
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  return {
                    maybeSingle() {
                      return Promise.resolve({
                        data: {
                          id: validTaskId,
                          lead_id: validLeadId,
                          title: 'Título Antigo',
                          priority: 'normal',
                          due_at: null,
                        },
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        },
        update(payload) {
          updatePayloadReceived = payload;
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  return {
                    select() {
                      return {
                        single() {
                          return Promise.resolve({
                            data: {
                              id: validTaskId,
                              lead_id: validLeadId,
                              title: payload.title || 'Título Antigo',
                              status: 'open',
                              priority: payload.priority || 'normal',
                              due_at: payload.due_at !== undefined ? payload.due_at : null,
                              assigned_to: validLeadId,
                              created_by: validLeadId,
                              created_at: new Date().toISOString(),
                              completed_at: null,
                              completed_by: null,
                            },
                            error: null,
                          });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  // Testar atualização com dados válidos
  const updatedTask = await updateLeadTaskDetailsInDatabase(mockSupabase, {
    leadId: validLeadId,
    taskId: validTaskId,
    title: '  Novo Título Comercial  ',
    priority: 'high',
    dueAt: '2026-09-20T15:00:00.000Z',
  });

  assert.strictEqual(updatePayloadReceived.title, 'Novo Título Comercial', 'Título deve ser sanitizado com trim');
  assert.strictEqual(updatePayloadReceived.priority, 'high', 'Prioridade deve ser high');
  assert.strictEqual(updatePayloadReceived.due_at, '2026-09-20T15:00:00.000Z', 'Prazo deve ser ISO string');
  assert.strictEqual(updatedTask.title, 'Novo Título Comercial', 'Task formatada devolvida com novo título');

  // Testar validação de erro para título vazio
  await assert.rejects(
    async () => {
      await updateLeadTaskDetailsInDatabase(mockSupabase, {
        leadId: validLeadId,
        taskId: validTaskId,
        title: '   ',
      });
    },
    { message: 'O título da tarefa não pode estar vazio' }
  );

  // Testar validação de erro para prioridade inválida
  await assert.rejects(
    async () => {
      await updateLeadTaskDetailsInDatabase(mockSupabase, {
        leadId: validLeadId,
        taskId: validTaskId,
        priority: 'urgent',
      });
    },
    { message: 'Prioridade de tarefa inválida. Valores permitidos: low, normal, high' }
  );

  console.log('TESTE 2 PASSOU: Edição de detalhes da tarefa e validações de input verificadas.');
}

// 3. TESTE DE CONSULTA GLOBAL COM PAGINAÇÃO SERVER-SIDE E CONTAGENS (fetchGlobalAdminTasksFromDatabase)
{
  let countQueriesExecuted = 0;
  let rangeFromReceived = null;
  let rangeToReceived = null;

  const mockSupabaseGlobal = {
    from(table) {
      assert.strictEqual(table, 'lead_tasks');
      return {
        select(fields, options) {
          if (options?.head) {
            countQueriesExecuted++;
            return {
              eq(col, val) {
                return {
                  lt() { return Promise.resolve({ count: 5, error: null }); },
                  gte() {
                    return {
                      lt() { return Promise.resolve({ count: 3, error: null }); },
                    };
                  },
                  is() { return Promise.resolve({ count: 10, error: null }); },
                };
              },
            };
          }

          // Query principal de dados paginados
          return {
            eq(col, val) {
              return this;
            },
            order(col, options) {
              return this;
            },
            range(from, to) {
              rangeFromReceived = from;
              rangeToReceived = to;
              return Promise.resolve({
                data: [
                  {
                    id: 'task-1',
                    lead_id: 'lead-1',
                    title: 'Contacto telefónico',
                    status: 'open',
                    priority: 'high',
                    due_at: '2026-09-15T10:00:00.000Z',
                    assigned_to: 'admin-1',
                    created_by: 'admin-1',
                    created_at: '2026-09-10T10:00:00.000Z',
                    completed_at: null,
                    completed_by: null,
                    lead: {
                      id: 'lead-1',
                      name: 'Empresa ACME',
                      email: 'contacto@acme.pt',
                    },
                  },
                ],
                count: 42,
                error: null,
              });
            },
          };
        },
      };
    },
  };

  const result = await fetchGlobalAdminTasksFromDatabase(mockSupabaseGlobal, {
    page: 2,
    pageSize: 10,
    category: 'pending',
    priority: 'all',
  });

  assert.strictEqual(result.page, 2, 'Página deve ser 2');
  assert.strictEqual(result.pageSize, 10, 'PageSize deve ser 10');
  assert.strictEqual(result.total, 42, 'Total filtrado deve ser 42');
  assert.strictEqual(result.totalPages, 5, 'Total de páginas deve ser 5 (ceil(42/10))');
  assert.strictEqual(rangeFromReceived, 10, 'Offset inicial da página 2 deve ser 10');
  assert.strictEqual(rangeToReceived, 19, 'Offset final da página 2 deve ser 19');
  assert.ok(result.counts, 'Objeto de contagens globais deve estar presente');
  assert.strictEqual(typeof result.counts.openTotal, 'number', 'openTotal deve ser número');

  console.log('TESTE 3 PASSOU: Paginação server-side real, limites de range e estrutura de contagens globais verificados.');
}

// 4. TESTE DE SEGURANÇA E AUTENTICAÇÃO NOS ENDPOINTS
{
  // GET /api/admin/tasks sem sessão admin -> 401
  const reqGet = new Request('http://localhost/api/admin/tasks');
  const resGet = await handleGetTasksRequest(reqGet);
  assert.strictEqual(resGet.status, 401, 'GET /api/admin/tasks sem autenticação deve retornar 401');

  // PATCH /api/admin/leads/[id]/tasks/[taskId] sem sessão admin -> 401
  const reqPatch = new Request('http://localhost/api/admin/leads/lead-1/tasks/task-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Novo Título' }),
  });
  const resPatch = await handlePatchLeadTaskStatusRequest(reqPatch, 'lead-1', 'task-1');
  assert.strictEqual(resPatch.status, 401, 'PATCH /api/admin/leads/[id]/tasks/[taskId] sem autenticação deve retornar 401');

  console.log('TESTE 4 PASSOU: Proteção por sessão de administração (401) em ambos os endpoints verificada.');
}

// 5. TESTE DE TIPO DE TAREFA / REASON_CODE (createLeadTaskInDatabase e updateLeadTaskDetailsInDatabase)
{
  const validLeadId = '11111111-1111-4111-a111-111111111111';
  const validUserId = '33333333-3333-4333-a333-333333333333';
  let insertPayloadReceived = null;

  const mockSupabaseCreate = {
    from(table) {
      if (table === 'leads') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle() { return Promise.resolve({ data: { id: validLeadId }, error: null }); },
                };
              },
            };
          },
        };
      }
      return {
        insert(payload) {
          insertPayloadReceived = payload;
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: {
                      id: 'task-new-1',
                      lead_id: validLeadId,
                      title: payload.title,
                      status: 'open',
                      priority: payload.priority,
                      due_at: payload.due_at,
                      assigned_to: payload.assigned_to,
                      created_by: payload.created_by,
                      created_at: new Date().toISOString(),
                      completed_at: null,
                      completed_by: null,
                      reason_code: payload.reason_code,
                    },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };

  // Testar criação com reason_code = 'phone_call'
  const taskPhone = await createLeadTaskInDatabase(mockSupabaseCreate, {
    leadId: validLeadId,
    title: 'Telefonar ao cliente para discutir proposta',
    priority: 'normal',
    createdBy: validUserId,
    reasonCode: 'phone_call',
  });
  assert.strictEqual(insertPayloadReceived.reason_code, 'phone_call', 'payload reason_code deve ser phone_call');
  assert.strictEqual(taskPhone.reason_code, 'phone_call', 'task criada deve ter reason_code = phone_call');

  // Testar criação com reason_code = null (tarefa normal)
  const taskNormal = await createLeadTaskInDatabase(mockSupabaseCreate, {
    leadId: validLeadId,
    title: 'Preparar documento PDF',
    priority: 'normal',
    createdBy: validUserId,
    reasonCode: null,
  });
  assert.strictEqual(insertPayloadReceived.reason_code, null, 'payload reason_code deve ser null');
  assert.strictEqual(taskNormal.reason_code, null, 'task criada deve ter reason_code = null');

  // Testar rejeição de motivo inválido para criação manual
  await assert.rejects(
    async () => {
      await createLeadTaskInDatabase(mockSupabaseCreate, {
        leadId: validLeadId,
        title: 'Teste Inválido',
        createdBy: validUserId,
        reasonCode: 'invalid_code_123',
      });
    },
    { message: 'Tipo de tarefa inválido. Valores permitidos: Tarefa (null) ou Contacto telefónico (phone_call)' }
  );

  console.log('TESTE 5 PASSOU: Suporte a tarefas do tipo "Contacto telefónico" (reason_code = phone_call | null) verificado.');
}

console.log('\n=== TODOS OS TESTES DO MÓDULO DE TAREFAS PASSARAM COM SUCESSO ===');
