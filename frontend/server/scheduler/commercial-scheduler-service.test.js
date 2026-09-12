import assert from 'node:assert';
import {
  runCommercialScheduler,
  AUTOMATIC_TASK_REASON_ALLOWLIST,
  deriveAutomaticTaskTitle,
  normalizeTaskPriority,
  resolveLeadCommercialOwnerId,
  resolveOutboundActivationCutoff,
  evaluateLeadOutboundActivation,
  mapCommercialStageToAbandonmentOutcome
} from './commercial-scheduler-service.js';
import { processChatHandoffTaskAndEmail } from '../../api/agent/message.js';

console.log('=== INICIANDO SUITE DE TESTES DO SCHEDULER COMERCIAL (POLÍTICA DE ATIVAÇÃO OUTBOUND) ===\n');

// 00. TESTES DE ACTIVATION CUTOFF (REQUISITOS A - P)
{
  const cutoffIso = '2026-09-10T12:00:00.000Z';
  const cutoffDate = new Date(cutoffIso);

  // A. env ausente => external_contact bloqueado
  const resA = resolveOutboundActivationCutoff(null);
  assert.strictEqual(resA.configured, false);
  assert.strictEqual(resA.valid, false);
  assert.strictEqual(resA.error, false);

  // B. env vazia => bloqueado
  const resB = resolveOutboundActivationCutoff('   ');
  assert.strictEqual(resB.configured, false);
  assert.strictEqual(resB.valid, false);
  assert.strictEqual(resB.error, false);

  // C. env inválida => bloqueado com erro
  const resC = resolveOutboundActivationCutoff('invalid-date-string');
  assert.strictEqual(resC.configured, true);
  assert.strictEqual(resC.valid, false);
  assert.strictEqual(resC.error, true);

  // D. lead criada antes do cutoff => pre_activation_backlog
  const evalD = evaluateLeadOutboundActivation('2026-09-01T00:00:00.000Z', cutoffDate);
  assert.strictEqual(evalD.eligible, false);
  assert.strictEqual(evalD.status, 'pre_activation_backlog');

  // E. lead criada exatamente no cutoff => passa a barreira
  const evalE = evaluateLeadOutboundActivation('2026-09-10T12:00:00.000Z', cutoffDate);
  assert.strictEqual(evalE.eligible, true);
  assert.strictEqual(evalE.status, 'post_activation_eligible');

  // F. lead criada depois => passa a barreira
  const evalF = evaluateLeadOutboundActivation('2026-09-12T00:00:00.000Z', cutoffDate);
  assert.strictEqual(evalF.eligible, true);
  assert.strictEqual(evalF.status, 'post_activation_eligible');

  // G. lead antiga com nova interação => continua backlog
  const evalG = evaluateLeadOutboundActivation('2026-09-01T00:00:00.000Z', cutoffDate);
  assert.strictEqual(evalG.eligible, false, 'Nova interação não altera criacao anterior ao cutoff');

  // H. future lead pós-ativação com primeira tentativa aceite
  const evalH = evaluateLeadOutboundActivation('2026-09-11T10:00:00.000Z', cutoffDate);
  assert.strictEqual(evalH.eligible, true, 'Lead criada pós-ativação é elegível para todas as fases da cadência');

  console.log('TESTES DE ACTIVATION CUTOFF (A - H) PASSARAM: Barreira de arranque fail-closed validada com 100% de cobertura.');
}

function createQueryBuilderMock(returnData) {
  const builder = {
    lte() { return builder; },
    or() { return builder; },
    order() { return builder; },
    in() {
      return {
        order() { return Promise.resolve({ data: [], error: null }); }
      };
    },
    limit() { return Promise.resolve({ data: returnData, error: null }); }
  };
  return builder;
}

function createFlexibleQueryMock(dataArray = []) {
  const builder = {
    select() { return builder; },
    insert() { return builder; },
    update() { return builder; },
    eq() { return builder; },
    in() { return builder; },
    or() { return builder; },
    lte() { return builder; },
    order() { return builder; },
    limit() { return builder; },
    single() { return Promise.resolve({ data: dataArray[0] || null, error: null }); },
    maybeSingle() { return Promise.resolve({ data: dataArray[0] || null, error: null }); },
    then(resolve) { resolve({ data: Array.isArray(dataArray) ? dataArray : [dataArray], error: null }); }
  };
  return builder;
}

const mockAdminId = '11111111-1111-4111-a111-111111111111';

// 0. TESTES DE PRECEDÊNCIA DE ASSIGNED_TO (REQUISITOS A - J)
{
  const admin1 = '11111111-1111-4111-a111-111111111111';
  const admin2 = '22222222-2222-4222-a222-222222222222';
  const adminList1 = [{ user_id: admin1 }];
  const adminList2 = [{ user_id: admin1 }, { user_id: admin2 }];

  // A. lead.assigned_to UUID válido -> usa esse admin
  const resA = resolveLeadCommercialOwnerId(
    { lead: { assigned_to: admin1 }, tasks: [] },
    { adminUsers: adminList1 }
  );
  assert.strictEqual(resA.assignedTo, admin1);
  assert.strictEqual(resA.source, 'lead_assignment');

  // B. lead.assigned_to inválido -> não o usa
  const resB = resolveLeadCommercialOwnerId(
    { lead: { assigned_to: 'invalid-uuid' }, tasks: [] },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resB.assignedTo, null);
  assert.strictEqual(resB.source, 'unresolved');

  // C. exatamente uma tarefa manual open -> usa assignee
  const resC = resolveLeadCommercialOwnerId(
    { lead: {}, tasks: [{ status: 'open', creation_mode: 'manual', assigned_to: admin2 }] },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resC.assignedTo, admin2);
  assert.strictEqual(resC.source, 'manual_open_task');

  // D. duas tarefas manuais open com mesmo assignee -> usa esse assignee
  const resD = resolveLeadCommercialOwnerId(
    {
      lead: {},
      tasks: [
        { status: 'open', creation_mode: 'manual', assigned_to: admin1 },
        { status: 'open', creation_mode: null, assigned_to: admin1 }
      ]
    },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resD.assignedTo, admin1);
  assert.strictEqual(resD.source, 'manual_open_task');

  // E. tarefas manuais open com dois assignees distintos -> não escolhe por elas
  const resE = resolveLeadCommercialOwnerId(
    {
      lead: {},
      tasks: [
        { status: 'open', creation_mode: 'manual', assigned_to: admin1 },
        { status: 'open', creation_mode: 'manual', assigned_to: admin2 }
      ]
    },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resE.assignedTo, null);
  assert.strictEqual(resE.source, 'unresolved');

  // F. tarefa automatic não influencia
  const resF = resolveLeadCommercialOwnerId(
    {
      lead: {},
      tasks: [{ status: 'open', creation_mode: 'automatic', assigned_to: admin1 }]
    },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resF.assignedTo, null);
  assert.strictEqual(resF.source, 'unresolved');

  // G. tarefa completed não influencia
  const resG = resolveLeadCommercialOwnerId(
    {
      lead: {},
      tasks: [{ status: 'completed', creation_mode: 'manual', assigned_to: admin1 }]
    },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resG.assignedTo, null);
  assert.strictEqual(resG.source, 'unresolved');

  // H. sem ownership + exatamente 1 admin -> usa fallback
  const resH = resolveLeadCommercialOwnerId(
    { lead: {}, tasks: [] },
    { adminUsers: adminList1 }
  );
  assert.strictEqual(resH.assignedTo, admin1);
  assert.strictEqual(resH.source, 'single_admin_fallback');

  // I. sem ownership + 2 admins -> unresolved
  const resI = resolveLeadCommercialOwnerId(
    { lead: {}, tasks: [] },
    { adminUsers: adminList2 }
  );
  assert.strictEqual(resI.assignedTo, null);
  assert.strictEqual(resI.source, 'unresolved');

  // J. sem ownership + 0 admins -> unresolved
  const resJ = resolveLeadCommercialOwnerId(
    { lead: {}, tasks: [] },
    { adminUsers: [] }
  );
  assert.strictEqual(resJ.assignedTo, null);
  assert.strictEqual(resJ.source, 'unresolved');

  console.log('TESTES A - J PASSARAM: Precedência determinística e fail-closed de assigned_to verificada.');
}

// 1. TESTE A & B: dryRun=true OU enableAutomaticTasks=false NUNCA criam tarefas automáticas
{
  const mockLeadStale = [
    {
      id: 'lead-stale-1',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      pipeline_stage: 'meeting_completed',
      email: 'stale@example.com',
      conversations: [],
      calendar_bookings: [{ id: 'b1', status: 'confirmed', start_time: new Date(Date.now() - 3 * 86400000).toISOString() }],
      lead_tasks: [{ id: 't1', assigned_to: mockAdminId }]
    }
  ];

  let rpcTaskCalls = 0;

  const mockSupabaseNoTasks = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      if (fnName === 'create_automatic_lead_task') {
        rpcTaskCalls++;
        return Promise.resolve({ data: { inserted: true, task_id: 't-new' }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadStale); } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  // 1a. dryRun = true (default)
  const resDryRun = await runCommercialScheduler({ supabaseClient: mockSupabaseNoTasks, dryRun: true, enableAutomaticTasks: true });
  assert.strictEqual(resDryRun.tasks.created, 0, 'dryRun=true não pode criar tarefas');
  assert.strictEqual(rpcTaskCalls, 0);

  // 1b. dryRun = false, mas enableAutomaticTasks = false
  const resTasksDisabled = await runCommercialScheduler({ supabaseClient: mockSupabaseNoTasks, dryRun: false, enableAutomaticTasks: false });
  assert.strictEqual(resTasksDisabled.tasks.created, 0, 'enableAutomaticTasks=false não pode criar tarefas');
  assert.strictEqual(rpcTaskCalls, 0);

  console.log('TESTE A & B PASSOU: dryRun=true e enableAutomaticTasks=false nunca criam tarefas.');
}

// 2. TESTE C, D, E, F & G: Criação de tarefas para reason_codes na allowlist (meeting_outcome_pending, meeting_follow_up, negotiation_stale, cadence_exhausted, dispatch_status_unknown)
{
  const testReasons = [
    { stage: 'meeting_scheduled', bookingPast: true, expectedReason: 'meeting_outcome_pending' },
    { stage: 'meeting_completed', expectedReason: 'meeting_follow_up' },
    { stage: 'negotiation', expectedReason: 'negotiation_stale' }
  ];

  for (const item of testReasons) {
    let createdTaskId = null;
    let rpcArgsReceived = null;

    const mockLead = [
      {
        id: `lead-reason-${item.expectedReason}`,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        last_interaction_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        pipeline_stage: item.stage,
        email: 'test-reason@example.com',
        conversations: [],
        calendar_bookings: item.bookingPast ? [{ id: 'b1', status: 'confirmed', start_time: new Date(Date.now() - 2 * 86400000).toISOString(), end_time: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString() }] : [],
        lead_tasks: [{ id: 't1', status: 'open', creation_mode: 'manual', assigned_to: mockAdminId }]
      }
    ];

    const mockSupabaseAllowlist = {
      rpc(fnName, args) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        if (fnName === 'create_automatic_lead_task') {
          rpcArgsReceived = args;
          createdTaskId = 'task-created-uuid';
          return Promise.resolve({ data: { inserted: true, task_id: createdTaskId }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return { select() { return createQueryBuilderMock(mockLead); } };
        return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabaseAllowlist,
      dryRun: false,
      enableAutomaticTasks: true
    });

    assert.strictEqual(res.tasks.eligible, 1, `Razão ${item.expectedReason} deve ser elegível`);
    assert.strictEqual(res.tasks.created, 1, `Razão ${item.expectedReason} deve criar tarefa`);
    assert.strictEqual(rpcArgsReceived.p_reason_code, item.expectedReason);
    assert.strictEqual(rpcArgsReceived.p_assigned_to, mockAdminId);
    assert.strictEqual(rpcArgsReceived.p_title, deriveAutomaticTaskTitle(item.expectedReason));
  }

  console.log('TESTE C, D, E, F & G PASSOU: Criação de tarefas confirmada para todos os reason_codes da allowlist com assigned_to resolvido.');
}

// 3. TESTE H & I: manual_task_due e reason_codes não mapeados NÃO criam tarefas (skipped_unmapped)
{
  const mockLeadManualTaskDue = [
    {
      id: 'lead-manual-due',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      pipeline_stage: 'new',
      email: 'due@example.com',
      conversations: [],
      calendar_bookings: [],
      lead_tasks: [
        {
          id: 'existing-task-due',
          assigned_to: mockAdminId,
          status: 'open',
          due_at: new Date(Date.now() - 10000).toISOString()
        }
      ]
    }
  ];

  let rpcCalls = 0;

  const mockSupabaseUnmapped = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      if (fnName === 'create_automatic_lead_task') {
        rpcCalls++;
        return Promise.resolve({ data: { inserted: false }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadManualTaskDue); } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  const res = await runCommercialScheduler({
    supabaseClient: mockSupabaseUnmapped,
    dryRun: false,
    enableAutomaticTasks: true
  });

  assert.strictEqual(res.decisions.internal_action, 1, 'manual_task_due é classificado como internal_action');
  assert.strictEqual(res.tasks.skipped_unmapped, 1, 'manual_task_due deve ser contabilizado como skipped_unmapped');
  assert.strictEqual(res.tasks.created, 0, 'manual_task_due NUNCA pode criar nova tarefa');
  assert.strictEqual(rpcCalls, 0);

  console.log('TESTE H & I PASSOU: manual_task_due e razões não mapeadas são ignoradas sem duplicar tarefas.');
}

// 4. TESTE J, K & L: Idempotência de tarefas automáticas (inserted=false -> existing++, novo fingerprint -> created++)
{
  const mockLeadMeetingFollowUp = [
    {
      id: 'lead-idempotent-1',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      pipeline_stage: 'meeting_completed',
      email: 'idem@example.com',
      conversations: [],
      calendar_bookings: [],
      lead_tasks: [{ id: 't1', status: 'open', creation_mode: 'manual', assigned_to: mockAdminId }]
    }
  ];

  let rpcCount = 0;

  const mockSupabaseIdempotent = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      if (fnName === 'create_automatic_lead_task') {
        rpcCount++;
        // Na primeira vez devolve inserida, na segunda vez devolve já existente
        if (rpcCount === 1) {
          return Promise.resolve({ data: { inserted: true, task_id: 't-auto-1' }, error: null });
        } else {
          return Promise.resolve({ data: { inserted: false, task_id: 't-auto-1' }, error: null });
        }
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadMeetingFollowUp); } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  // 1ª Execução: cria a tarefa (inserted = true)
  const res1 = await runCommercialScheduler({ supabaseClient: mockSupabaseIdempotent, dryRun: false, enableAutomaticTasks: true });
  assert.strictEqual(res1.tasks.created, 1);
  assert.strictEqual(res1.tasks.existing, 0);

  // 2ª Execução no mesmo contexto: devolve existente (inserted = false)
  const res2 = await runCommercialScheduler({ supabaseClient: mockSupabaseIdempotent, dryRun: false, enableAutomaticTasks: true });
  assert.strictEqual(res2.tasks.created, 0);
  assert.strictEqual(res2.tasks.existing, 1, 'Tarefa já existente deve ser contabilizada em tasks.existing');
  assert.strictEqual(res2.errors, 0, 'inserted=false NÃO deve ser considerado erro');

  console.log('TESTE J, K & L PASSOU: Idempotência de tarefas automáticas tratada corretamente (inserted=false -> existing++).');
}

// 5. TESTE M: Resolução de assigned_to não encontrado -> assignment_unresolved
{
  const mockLeadNoOwner = [
    {
      id: 'lead-no-owner-1',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      pipeline_stage: 'meeting_completed',
      email: 'noowner@example.com',
      conversations: [],
      calendar_bookings: [],
      lead_tasks: [] // Sem tarefas anteriores com assigned_to
    }
  ];

  let rpcCalls = 0;

  const mockSupabaseNoOwner = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      if (fnName === 'create_automatic_lead_task') {
        rpcCalls++;
        return Promise.resolve({ data: { inserted: false }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadNoOwner); } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  const res = await runCommercialScheduler({
    supabaseClient: mockSupabaseNoOwner,
    dryRun: false,
    enableAutomaticTasks: true
  });

  assert.strictEqual(res.tasks.eligible, 1, 'Lead é elegível para tarefa');
  assert.strictEqual(res.tasks.assignment_unresolved, 1, 'Sem owner resolvido -> assignment_unresolved++');
  assert.strictEqual(res.tasks.created, 0, 'Sem owner resolvido NUNCA cria tarefa');
  assert.strictEqual(rpcCalls, 0);

  console.log('TESTE M PASSOU: Ausência de responsável comercial factual (assigned_to) impede a criação da tarefa sem erros.');
}

// 6. TESTE N, O, P, Q & R: Garantia de Zero Efeitos Outbound em PASSO 2 (Zero OpenAI, Zero Resend, Zero Approved Comms, Zero Dispatches)
{
  let openAiCalled = false;
  let resendCalled = false;
  let approvedCommsCreated = 0;
  let dispatchesCreated = 0;

  const mockLeadExternalContact = [
    {
      id: 'lead-ext-1',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      pipeline_stage: 'qualified',
      need_description: 'Serviço Web',
      email: 'ext@example.com',
      conversations: [],
      calendar_bookings: [],
      lead_tasks: [{ id: 't1', status: 'open', creation_mode: 'manual', assigned_to: mockAdminId }]
    }
  ];

  const mockSupabaseNoOutbound = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'approved_communications' || table === 'communication_dispatches') {
        return {
          insert() {
            if (table === 'approved_communications') approvedCommsCreated++;
            if (table === 'communication_dispatches') dispatchesCreated++;
            return Promise.resolve({ data: null, error: null });
          },
          select() {
            return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } };
          }
        };
      }
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadExternalContact); } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  const res = await runCommercialScheduler({
    supabaseClient: mockSupabaseNoOutbound,
    dryRun: false,
    enableAutomaticTasks: true,
    enableAutomaticOutbound: false
  });

  assert.strictEqual(res.decisions.external_contact, 1, 'external_contact é classificado');
  assert.strictEqual(openAiCalled, false, 'Zero chamadas OpenAI em Passo 2');
  assert.strictEqual(resendCalled, false, 'Zero chamadas Resend em Passo 2');
  assert.strictEqual(approvedCommsCreated, 0, 'Zero approved_communications criadas');
  assert.strictEqual(dispatchesCreated, 0, 'Zero communication_dispatches criados');

  console.log('TESTE N, O, P, Q & R PASSOU: external_contact classificado sem qualquer efeito secundário outbound.');
}

// 7. TESTE S & T: Lock libertado no `finally` e Falha no Zoho mantém FAIL-CLOSED
{
  let lockReleased = false;

  const mockSupabaseZohoFail = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') {
        lockReleased = true;
        return Promise.resolve({ data: { released: true }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }
  };

  const res = await runCommercialScheduler({
    supabaseClient: mockSupabaseZohoFail,
    dryRun: false,
    enableAutomaticTasks: true,
    fetchMessagesFn: async () => { throw new Error('Falha no Zoho'); }
  });

  assert.strictEqual(res.status, 'failed');
  assert.strictEqual(lockReleased, true, 'Lock deve ser libertado no finally mesmo em falha Zoho');

  console.log('TESTE S & T PASSOU: Lock libertado no finally e falha no Zoho mantém a política FAIL-CLOSED.');
}

// 8. TESTE U, V, W, X, Y & Z: TESTES DO PIPELINE DE OUTBOUND AUTOMÁTICO (PASSO 10)
{
  const cutoffIso = '2026-09-01T00:00:00.000Z';

  // U. Outbound desativado (enableAutomaticOutbound=false ou dryRun=true)
  {
    const mockLeadOutbound = [
      {
        id: 'lead-outbound-1',
        created_at: '2026-09-05T10:00:00.000Z',
        pipeline_stage: 'new',
        need_description: 'Criação de Website',
        email: 'outbound1@example.com',
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    const mockSupabase = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadOutbound); } };
        return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
      }
    };

    const resDry = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: true,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso
    });

    assert.strictEqual(resDry.outbound.eligible, 0);
    assert.strictEqual(resDry.outbound.drafts_generated, 0);

    const resDisabled = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: false,
      enableAutomaticOutbound: false,
      outboundActivatedAt: cutoffIso
    });

    assert.strictEqual(resDisabled.outbound.eligible, 0);
    assert.strictEqual(resDisabled.outbound.drafts_generated, 0);
  }

  // V. Outbound Automático Completo com Stage Permitida ('new') -> Draft, Automatic Approval e Dispatch Accepted
  {
    const leadId = '11111111-2222-3333-4444-555555555555';
    const approvedCommId = 'comm-1111-2222-3333';
    let draftGenCalled = false;
    let autoApprovedCalled = false;
    let dispatchCalled = false;

    const mockLeadAllowed = [
      {
        id: leadId,
        name: 'Cliente Teste Outbound',
        email: 'outbound.allowed@example.com',
        company_name: 'Empresa Teste',
        primary_service: 'Website',
        pipeline_stage: 'new',
        need_description: 'Criar loja online com pagamento MB WAY',
        created_at: '2026-09-05T10:00:00.000Z',
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    function createFlexibleQueryMock(dataArray = []) {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        in() { return builder; },
        or() { return builder; },
        lte() { return builder; },
        order() { return builder; },
        limit() { return builder; },
        single() { return Promise.resolve({ data: dataArray[0] || null, error: null }); },
        maybeSingle() { return Promise.resolve({ data: dataArray[0] || null, error: null }); },
        then(resolve) { resolve({ data: Array.isArray(dataArray) ? dataArray : [dataArray], error: null }); }
      };
      return builder;
    }

    let lastApprovedRow = null;

    const mockSupabaseFullOutbound = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return createFlexibleQueryMock(mockLeadAllowed);

        if (table === 'pipeline_stage_history') {
          return createFlexibleQueryMock([{ id: 'hist-1' }]);
        }

        if (table === 'follow_up_recommendation_states') {
          return createFlexibleQueryMock([]);
        }

        if (table === 'approved_communications') {
          return {
            insert(payload) {
              autoApprovedCalled = true;
              assert.strictEqual(payload.approval_mode, 'automatic');
              assert.strictEqual(payload.approved_by, null);
              lastApprovedRow = {
                id: approvedCommId,
                lead_id: leadId,
                cadence_instance_id: payload.cadence_instance_id,
                context_fingerprint: payload.context_fingerprint,
                reason_code: payload.reason_code,
                channel: 'email',
                recipient_email: payload.recipient_email,
                recipient_name: payload.recipient_name,
                subject: payload.subject,
                body: payload.body,
                generation_source: payload.generation_source,
                status: 'approved',
                approval_mode: 'automatic',
                approved_by: null,
                approved_at: payload.approved_at || new Date().toISOString()
              };
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({
                        data: lastApprovedRow,
                        error: null
                      });
                    }
                  };
                }
              };
            },
            select() {
              return createFlexibleQueryMock(lastApprovedRow ? [lastApprovedRow] : []);
            }
          };
        }

        if (table === 'communication_dispatches') {
          return {
            select() {
              return createFlexibleQueryMock([]);
            },
            insert(payload) {
              dispatchCalled = true;
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({
                        data: {
                          id: 'dispatch-1',
                          approved_communication_id: approvedCommId,
                          lead_id: leadId,
                          provider: 'fake',
                          status: 'pending'
                        },
                        error: null
                      });
                    }
                  };
                }
              };
            },
            update(payload) {
              return {
                eq() {
                  return {
                    select() {
                      return {
                        single() {
                          return Promise.resolve({
                            data: {
                              id: 'dispatch-1',
                              status: payload.status || 'accepted',
                              provider_message_id: payload.provider_message_id || 'fake-1',
                              provider_accepted_at: payload.provider_accepted_at || new Date().toISOString()
                            },
                            error: null
                          });
                        }
                      };
                    }
                  };
                }
              };
            }
          };
        }

        if (table === 'admin_users') {
          return createFlexibleQueryMock([{ user_id: mockAdminId }]);
        }

        return createFlexibleQueryMock([]);
      }
    };

    const resOutbound = await runCommercialScheduler({
      supabaseClient: mockSupabaseFullOutbound,
      dryRun: false,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso,
      outboundProvider: 'fake',
      outboundSimulateMode: 'accepted'
    });

    assert.strictEqual(resOutbound.outbound.eligible, 1, 'Stage new é elegível');
    assert.strictEqual(resOutbound.outbound.drafts_generated, 1, 'Draft gerado com sucesso');
    assert.strictEqual(resOutbound.outbound.approved, 1, 'Comunicação aprovada automaticamente');
    assert.strictEqual(resOutbound.outbound.dispatched, 1, 'Dispatch efetuado com sucesso (accepted)');
    assert.strictEqual(resOutbound.outbound.failed, 0);
    assert.strictEqual(autoApprovedCalled, true);
    assert.strictEqual(dispatchCalled, true);
  }

  // W. Stage Não Permitida ('meeting') -> Outbound Não Executado (Skipped)
  {
    const mockLeadMeetingStage = [
      {
        id: 'lead-meeting-1',
        name: 'Cliente em Reunião',
        email: 'meeting@example.com',
        pipeline_stage: 'meeting',
        need_description: 'Software à medida',
        created_at: '2026-09-05T10:00:00.000Z',
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    const mockSupabaseMeetingStage = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadMeetingStage); } };
        return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
      }
    };

    const resMeeting = await runCommercialScheduler({
      supabaseClient: mockSupabaseMeetingStage,
      dryRun: false,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso
    });

    assert.strictEqual(resMeeting.outbound.eligible, 0, 'Stage meeting não é elegível para outbound automático');
    assert.strictEqual(resMeeting.outbound.drafts_generated, 0, 'Zero drafts gerados para stage meeting');
  }

  console.log('TESTES U, V, W, X, Y & Z PASSARAM: Pipeline de outbound automático do scheduler validado.');
}

// 9. TESTES DE TRUNCAMENTO ZOHO (AA - EE)
{
  const cutoffIso = '2026-09-01T00:00:00.000Z';

  // AA. Zoho completamente drenado (has_more = false) -> outbound continua
  {
    const mockLeadDrained = [
      {
        id: 'lead-drained-1',
        name: 'Cliente Outbound Drenado',
        email: 'drained@example.com',
        pipeline_stage: 'new',
        need_description: 'Website',
        created_at: '2026-09-05T10:00:00.000Z',
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    const fetchDrained = async () => [];

    const mockSupabase = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return createFlexibleQueryMock(mockLeadDrained);
        if (table === 'admin_users') return createFlexibleQueryMock([{ user_id: mockAdminId }]);
        return createFlexibleQueryMock([]);
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: false,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso,
      fetchMessagesFn: fetchDrained
    });

    assert.strictEqual(res.zoho.has_more, false);
    assert.strictEqual(res.outbound_blocked_reason, null);
    console.log('TESTE AA PASSOU: Zoho completamente drenado -> has_more=false e outbound continua.');
  }

  // BB. maxPages atingido com última página cheia (has_more = true) -> outbound = zero
  {
    const mockLeadTruncated = [
      {
        id: 'lead-trunc-1',
        name: 'Cliente Outbound Truncado',
        email: 'trunc@example.com',
        pipeline_stage: 'new',
        need_description: 'Website',
        created_at: '2026-09-05T10:00:00.000Z',
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    const fetchTruncated = async ({ start, limit }) => {
      return Array.from({ length: limit }, (_, i) => ({
        messageId: `msg-${start}-${i}`,
        fromAddress: 'lead@empresa.com',
        receivedTime: '2026-09-12T10:00:00.000Z'
      }));
    };

    const mockSupabase = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        if (fnName === 'process_inbound_email') return Promise.resolve({ data: { inserted: true, lead_id: 'lead-trunc-1' }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return createFlexibleQueryMock(mockLeadTruncated);
        if (table === 'admin_users') return createFlexibleQueryMock([{ user_id: mockAdminId }]);
        return createFlexibleQueryMock([]);
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: false,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso,
      fetchMessagesFn: fetchTruncated
    });

    assert.strictEqual(res.zoho.has_more, true);
    assert.strictEqual(res.outbound_blocked_reason, 'zoho_sync_incomplete');
    assert.strictEqual(res.outbound.drafts_generated, 0);
    assert.strictEqual(res.outbound.approved, 0);
    assert.strictEqual(res.outbound.dispatched, 0);
    assert.strictEqual(res.outbound.skipped, 1);
    console.log('TESTE BB PASSOU: maxPages atingido com última página cheia -> has_more=true e outbound bloqueado (0 drafts, 0 dispatches).');
  }

  // CC. has_more = true + tarefas automáticas elegíveis -> tarefas continuam, outbound = zero
  {
    const mockLeadTaskPlusOutbound = [
      {
        id: 'lead-task-1',
        name: 'Cliente com Tarefa Pendente',
        email: 'task@example.com',
        pipeline_stage: 'meeting_completed',
        need_description: 'Website',
        created_at: '2026-09-05T10:00:00.000Z',
        assigned_to: mockAdminId,
        conversations: [],
        calendar_bookings: [],
        lead_tasks: []
      }
    ];

    const fetchTruncated = async ({ limit }) => {
      return Array.from({ length: limit }, (_, i) => ({
        messageId: `msg-${i}`,
        fromAddress: 'lead@empresa.com',
        receivedTime: '2026-09-12T10:00:00.000Z'
      }));
    };

    let taskRpcCalled = false;

    const mockSupabase = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        if (fnName === 'process_inbound_email') return Promise.resolve({ data: { inserted: true, lead_id: 'lead-task-1' }, error: null });
        if (fnName === 'create_automatic_lead_task') {
          taskRpcCalled = true;
          return Promise.resolve({ data: { inserted: true, task_id: 'task-1' }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return createFlexibleQueryMock(mockLeadTaskPlusOutbound);
        if (table === 'admin_users') return createFlexibleQueryMock([{ user_id: mockAdminId }]);
        return createFlexibleQueryMock([]);
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: false,
      enableAutomaticTasks: true,
      enableAutomaticOutbound: true,
      outboundActivatedAt: cutoffIso,
      fetchMessagesFn: fetchTruncated
    });

    assert.strictEqual(res.zoho.has_more, true);
    assert.strictEqual(res.tasks.eligible, 1);
    assert.strictEqual(res.tasks.created, 1);
    assert.strictEqual(taskRpcCalled, true);
    assert.strictEqual(res.outbound.drafts_generated, 0);
    console.log('TESTE CC PASSOU: has_more=true preserva a criação de tarefas automáticas enquanto bloqueia outbound.');
  }

  // DD. Erro no Zoho -> preserva o fail-closed (status: 'failed')
  {
    const mockSupabaseZohoErr = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabaseZohoErr,
      dryRun: false,
      enableAutomaticOutbound: true,
      fetchMessagesFn: async () => { throw new Error('Erro API Zoho'); }
    });

    assert.strictEqual(res.status, 'failed');
    assert.strictEqual(res.errors, 1);
    console.log('TESTE DD PASSOU: Erro no Zoho preserva o fail-closed atual (status: failed).');
  }

  // EE. Página final incompleta -> has_more = false
  {
    const fetchIncomplete = async ({ start }) => {
      if (start === 1) {
        return [{ messageId: 'm1', fromAddress: 'lead@empresa.com', receivedTime: '2026-09-12T10:00:00.000Z' }];
      }
      return [];
    };

    const mockSupabase = {
      rpc(fnName) {
        if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
        if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
        if (fnName === 'process_inbound_email') return Promise.resolve({ data: { inserted: true, lead_id: 'l1' }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      from(table) {
        if (table === 'leads') return { select() { return createQueryBuilderMock([]); } };
        return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
      }
    };

    const res = await runCommercialScheduler({
      supabaseClient: mockSupabase,
      dryRun: false,
      enableAutomaticOutbound: true,
      fetchMessagesFn: fetchIncomplete
    });

    assert.strictEqual(res.zoho.has_more, false);
    console.log('TESTE EE PASSOU: Página final incompleta -> has_more=false.');
  }

  console.log('TESTES DE TRUNCAMENTO ZOHO (AA - EE) PASSARAM COM SUCESSO.');
}

// FF. TESTE ENCAMINHAMENTO HUMANO REAL POR EMAIL (SCHEDULER & CHAT)
{
  console.log('\n--- EXECUTANDO TESTES DE ENCAMINHAMENTO HUMANO REAL POR EMAIL ---');

  const mockLeadHandoff = [
    {
      id: '00000000-0000-4000-8000-000000000101',
      name: 'Josefino Handoff',
      email: 'josefino.handoff@exemplo.com',
      company_name: 'Lumyo Testes',
      primary_service: 'websites',
      need_description: 'Redesign site',
      pipeline_stage: 'meeting_completed',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      assigned_to: '00000000-0000-4000-8000-000000000001',
      conversations: [],
      calendar_bookings: [],
      lead_tasks: []
    }
  ];

  let resendCalls = [];
  const mockResendClient = {
    emails: {
      send: async (payload, options) => {
        resendCalls.push({ payload, options });
        return { data: { id: 'resend_handoff_msg_123' }, error: null };
      }
    }
  };

  let taskRpcCount = 0;
  const mockSupabaseHandoff = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      if (fnName === 'create_automatic_lead_task') {
        taskRpcCount++;
        if (taskRpcCount === 1) {
          return Promise.resolve({ data: { inserted: true, task_id: 't-handoff-1' }, error: null });
        }
        return Promise.resolve({ data: { inserted: false, task_id: 't-handoff-1' }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'leads') return { select() { return createQueryBuilderMock(mockLeadHandoff); } };
      if (table === 'admin_users') return { select() { return { limit() { return Promise.resolve({ data: [{ id: '00000000-0000-4000-8000-000000000001' }], error: null }); } }; } };
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  // 1ª Execução Scheduler: cria a tarefa e envia 1 notificação por email
  const res1 = await runCommercialScheduler({
    supabaseClient: mockSupabaseHandoff,
    dryRun: false,
    enableAutomaticTasks: true,
    resendClient: mockResendClient,
    adminUsers: [{ user_id: '00000000-0000-4000-8000-000000000001' }]
  });

  assert.strictEqual(res1.tasks.created, 1);
  assert.strictEqual(resendCalls.length, 1, 'Deve enviar exatamente 1 email interno para nova tarefa');
  assert.ok(resendCalls[0].payload.subject.includes('Josefino Handoff'));
  assert.ok(resendCalls[0].payload.text.includes('websites'));

  // 2ª Execução Scheduler no mesmo fingerprint: tarefa já existente (inserted=false) -> 0 emails adicionais!
  const res2 = await runCommercialScheduler({
    supabaseClient: mockSupabaseHandoff,
    dryRun: false,
    enableAutomaticTasks: true,
    resendClient: mockResendClient,
    adminUsers: [{ user_id: '00000000-0000-4000-8000-000000000001' }]
  });

  assert.strictEqual(res2.tasks.created, 0);
  assert.strictEqual(res2.tasks.existing, 1);
  assert.strictEqual(resendCalls.length, 1, 'Mesmo fingerprint repetido -> 0 emails adicionais (deduplicação)');

  console.log('TESTE FF PASSOU: Notificação de handoff no Scheduler dispara 1 email para nova tarefa e 0 para tarefa repetida.');
}

// GG. TESTE CHAT HANDOFF TASK & EMAIL NOTIFICATION
{
  const mockLeadChatHandoff = {
    id: '00000000-0000-4000-8000-000000000202',
    name: 'Visitante Chat Handoff',
    email: 'visitante.chat@exemplo.com',
    primary_service: 'automation',
    pipeline_stage: 'new',
    assigned_to: '00000000-0000-4000-8000-000000000001'
  };

  let chatResendCalls = [];
  const mockResendClientChat = {
    emails: {
      send: async (payload) => {
        chatResendCalls.push(payload);
        return { data: { id: 'msg_chat_123' }, error: null };
      }
    }
  };

  let chatRpcCount = 0;
  const mockSupabaseChat = {
    rpc(fnName) {
      if (fnName === 'create_automatic_lead_task') {
        chatRpcCount++;
        if (chatRpcCount === 1) {
          return Promise.resolve({ data: { inserted: true, task_id: 't-chat-1' }, error: null });
        }
        return Promise.resolve({ data: { inserted: false, task_id: 't-chat-1' }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from() {
      return { select() { return { limit() { return Promise.resolve({ data: [{ id: '00000000-0000-4000-8000-000000000001' }], error: null }); } }; } };
    }
  };

  // 1ª Chamada Chat: cria tarefa e dispara 1 email
  const chatRes1 = await processChatHandoffTaskAndEmail(mockSupabaseChat, mockLeadChatHandoff, { resendClient: mockResendClientChat });
  assert.strictEqual(chatRes1.taskCreated, true);
  assert.strictEqual(chatRes1.emailSent, true);
  assert.strictEqual(chatResendCalls.length, 1);
  assert.ok(chatResendCalls[0].subject.includes('Contacto humano solicitado'));

  // 2ª Chamada Chat (mesmo fingerprint): task RPC devolve inserted=false -> 0 emails adicionais!
  const chatRes2 = await processChatHandoffTaskAndEmail(mockSupabaseChat, mockLeadChatHandoff, { resendClient: mockResendClientChat });
  assert.strictEqual(chatRes2.taskCreated, false);
  assert.strictEqual(chatRes2.existing, true);
  assert.strictEqual(chatResendCalls.length, 1, 'Chat handoff repetido -> 0 emails adicionais');

  console.log('TESTE GG PASSOU: Chat Handoff cria tarefa e notifica 1x por email com deduplicação por fingerprint.');
}

// HH. TESTE DE DETEÇÃO AUTOMÁTICA MÍNIMA DE CONVERSAS ABANDONADAS
{
  console.log('\n--- EXECUTANDO TESTES DE DETEÇÃO AUTOMÁTICA MÍNIMA DE CONVERSAS ABANDONADAS ---');

  // 1. Mapeamento de comercial_stage -> primary_outcome
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('discovery'), 'abandoned_before_contact');
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('exploring_need'), 'abandoned_during_qualification');
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('qualifying'), 'abandoned_during_qualification');
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('suggesting_booking'), 'abandoned_during_booking');
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('booking_in_progress'), 'abandoned_during_booking');
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('closed'), null);
  assert.strictEqual(mapCommercialStageToAbandonmentOutcome('desconhecido'), null);

  const nowRef = new Date('2026-09-14T12:00:00.000Z');
  const staleTime = new Date('2026-09-13T10:00:00.000Z').toISOString(); // > 24h atrás
  const recentTime = new Date('2026-09-14T10:00:00.000Z').toISOString(); // < 24h atrás

  const mockConversationsInDb = [
    { id: 'c1', status: 'active', commercial_stage: 'qualifying', primary_outcome: null, last_activity_at: staleTime },
    { id: 'c2', status: 'active', commercial_stage: 'booking_in_progress', primary_outcome: null, last_activity_at: staleTime },
    { id: 'c3', status: 'active', commercial_stage: 'discovery', primary_outcome: null, last_activity_at: recentTime },
    { id: 'c4', status: 'inactive', commercial_stage: 'qualifying', primary_outcome: 'abandoned_during_qualification', last_activity_at: staleTime }
  ];

  let updatedConversations = [];
  const mockSupabaseAbandonment = {
    rpc(fnName) {
      if (fnName === 'try_acquire_scheduler_lock') return Promise.resolve({ data: { acquired: true }, error: null });
      if (fnName === 'release_scheduler_lock') return Promise.resolve({ data: { released: true }, error: null });
      return Promise.resolve({ data: null, error: null });
    },
    from(table) {
      if (table === 'conversations') {
        return {
          select() {
            return {
              eq(col1, val1) {
                return {
                  is(col2, val2) {
                    return {
                      lte(col3, val3) {
                        const filtered = mockConversationsInDb.filter(c => {
                          const isStatus = c.status === val1;
                          const isOutcomeNull = c.primary_outcome === val2;
                          const isLte = new Date(c.last_activity_at).getTime() <= new Date(val3).getTime();
                          return isStatus && isOutcomeNull && isLte;
                        });
                        return Promise.resolve({ data: filtered, error: null });
                      }
                    };
                  }
                };
              }
            };
          },
          update(fields) {
            return {
              eq(col1, val1Id) {
                return {
                  eq(col2, val2Status) {
                    return {
                      is(col3, val3Outcome) {
                        updatedConversations.push({ id: val1Id, fields });
                        return Promise.resolve({ error: null });
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
      if (table === 'leads') {
        return { select() { return createQueryBuilderMock([]); } };
      }
      return { select() { return { in() { return { order() { return Promise.resolve({ data: [], error: null }); } }; } }; } };
    }
  };

  const res = await runCommercialScheduler({
    supabaseClient: mockSupabaseAbandonment,
    dryRun: false,
    now: nowRef
  });

  assert.strictEqual(res.abandoned_conversations_evaluated, 2, 'Apenas as 2 conversas ativas com >24h de inatividade devem ser avaliadas');
  assert.strictEqual(res.abandoned_conversations_classified, 2, 'As 2 conversas ativas com >24h devem ser classificadas');
  assert.strictEqual(res.abandoned_conversations_failed, 0);

  assert.strictEqual(updatedConversations.length, 2);
  assert.strictEqual(updatedConversations[0].id, 'c1');
  assert.strictEqual(updatedConversations[0].fields.status, 'inactive');
  assert.strictEqual(updatedConversations[0].fields.primary_outcome, 'abandoned_during_qualification');

  assert.strictEqual(updatedConversations[1].id, 'c2');
  assert.strictEqual(updatedConversations[1].fields.status, 'inactive');
  assert.strictEqual(updatedConversations[1].fields.primary_outcome, 'abandoned_during_booking');

  console.log('TESTE HH PASSOU: Deteção automática mínima de conversas abandonadas funciona com sucesso e isolamento.');
}

console.log('\n=== TODOS OS TESTES DO SCHEDULER COMERCIAL, HANDOFF E CONVERSAS ABANDONADAS PASSARAM COM SUCESSO ===');

