import assert from 'node:assert';
import { fetchFollowUpRecommendationsFromDatabase } from './admin-followup-service.js';

console.log('=== INICIANDO SUITE DE TESTES DA PAGINAÇÃO E ESTRUTURA DO ACOMPANHAMENTO (PASSO 4) ===\n');

const mockAdminId = '11111111-1111-4111-a111-111111111111';

function createMockSupabaseLeads(countTotal = 45) {
  const mockLeads = [];
  const nowMs = Date.now();

  for (let i = 1; i <= countTotal; i++) {
    // Distribuir estadios e datas para simular varias tabs
    let stage = 'qualified';
    let createdAtDaysAgo = i; // 1 a 45 dias atras
    let lastInteractionDaysAgo = i > 15 ? i : 0; // leads recentes (0 dias) vs antigas (>2 dias)

    if (i <= 10) {
      stage = 'qualified';
    } else if (i <= 20) {
      stage = 'new';
    } else if (i <= 30) {
      stage = 'proposal';
    } else if (i <= 40) {
      stage = 'won'; // blocked
    } else {
      stage = 'lost'; // blocked
    }

    mockLeads.push({
      id: `lead-mock-${i}`,
      name: `Cliente Lead ${i}`,
      email: `lead${i}@empresa.com`,
      company_name: `Empresa ${i}`,
      need_description: `Necessidade ${i}`,
      primary_service: 'websites',
      pipeline_stage: stage,
      lead_classification: 'qualified',
      last_interaction_at: new Date(nowMs - lastInteractionDaysAgo * 86400000).toISOString(),
      created_at: new Date(nowMs - createdAtDaysAgo * 86400000).toISOString(),
      updated_at: new Date(nowMs - createdAtDaysAgo * 86400000).toISOString(),
      conversations: [],
      calendar_bookings: [],
      lead_tasks: []
    });
  }

  const mockSupabase = {
    from(table) {
      if (table === 'leads') {
        return {
          select() { return this; },
          order() {
            return Promise.resolve({ data: mockLeads, error: null });
          }
        };
      }
      const chain = {
        select() { return chain; },
        order() { return chain; },
        in() { return chain; },
        eq() { return chain; },
        then(resolve) { resolve({ data: [], error: null }); }
      };
      return chain;
      return {
        select() {
          return {
            in() { return Promise.resolve({ data: [], error: null }); }
          };
        }
      };
    }
  };

  return mockSupabase;
}

// TESTE 1: Default page = 1, pageSize = 20 e retornos de contagem factual
{
  const supabase = createMockSupabaseLeads(45);
  const res = await fetchFollowUpRecommendationsFromDatabase(supabase, {
    page: 1,
    pageSize: 20,
    tab: 'all',
    showBlocked: true,
    now: new Date()
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.pagination.page, 1);
  assert.strictEqual(res.pagination.pageSize, 20);
  assert.strictEqual(res.pagination.total, 45);
  assert.strictEqual(res.pagination.totalPages, 3); // 45 / 20 = 2.25 -> 3 paginas
  assert.strictEqual(res.recommendations.length, 20);
  assert.strictEqual(typeof res.counts.attention, 'number');
  assert.strictEqual(typeof res.counts.scheduled, 'number');
  assert.strictEqual(typeof res.counts.blocked, 'number');

  console.log('TESTE 1 PASSOU: Default page 1, pageSize 20 e totalPages factual calculados corretamente.');
}

// TESTE 2: Paginação - Página 1 vs Página 2 sem duplicação de itens
{
  const supabase = createMockSupabaseLeads(45);
  const page1 = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'all', showBlocked: true });
  const page2 = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 2, pageSize: 20, tab: 'all', showBlocked: true });

  assert.strictEqual(page1.recommendations.length, 20);
  assert.strictEqual(page2.recommendations.length, 20);

  const idsPage1 = new Set(page1.recommendations.map(r => r.lead_id));
  const idsPage2 = new Set(page2.recommendations.map(r => r.lead_id));

  for (const id of idsPage2) {
    assert.strictEqual(idsPage1.has(id), false, `Item ${id} nao pode aparecer na pagina 1 e pagina 2`);
  }

  console.log('TESTE 2 PASSOU: Nenhuma duplicação de registos entre página 1 e página 2.');
}

// TESTE 3: Opções de Tamanho de Página (20 / 50 / 100)
{
  const supabase = createMockSupabaseLeads(45);

  const res20 = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'all', showBlocked: true });
  assert.strictEqual(res20.pagination.pageSize, 20);
  assert.strictEqual(res20.pagination.totalPages, 3);
  assert.strictEqual(res20.recommendations.length, 20);

  const res50 = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 50, tab: 'all', showBlocked: true });
  assert.strictEqual(res50.pagination.pageSize, 50);
  assert.strictEqual(res50.pagination.totalPages, 1);
  assert.strictEqual(res50.recommendations.length, 45);

  const res100 = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 100, tab: 'all', showBlocked: true });
  assert.strictEqual(res100.pagination.pageSize, 100);
  assert.strictEqual(res100.pagination.totalPages, 1);
  assert.strictEqual(res100.recommendations.length, 45);

  console.log('TESTE 3 PASSOU: Suporte completo para tamanhos de página 20, 50 e 100.');
}

// TESTE 4: Filtragem por Tabs e Manutenção da Barreira de Regras de Follow-up
{
  const supabase = createMockSupabaseLeads(45);

  const resAttention = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'attention' });
  const resScheduled = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'scheduled' });
  const resBlocked = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'blocked' });

  assert.strictEqual(resAttention.recommendations.every(r => r.needs_follow_up && !r.blocked), true, 'Tab atencao so contem items com needs_follow_up=true');
  assert.strictEqual(resScheduled.recommendations.every(r => !r.needs_follow_up && !r.blocked), true, 'Tab agendados so contem items com needs_follow_up=false');
  assert.strictEqual(resBlocked.recommendations.every(r => r.blocked === true), true, 'Tab bloqueados so contem items com blocked=true');

  console.log('TESTE 4 PASSOU: Integridade das categorias de tabs e regras de follow-up 100% preservadas.');
}

// TESTE 5: Preservação Factual da Lead Qualificada Nova com Interação Recente (Agendados)
{
  const now = new Date();
  const mockLeadCreatedToday = {
    id: 'lead-new-today',
    name: 'Lead Criada Hoje Chat',
    email: 'newchat@empresa.pt',
    pipeline_stage: 'qualified',
    lead_classification: 'qualified',
    created_at: now.toISOString(),
    last_interaction_at: now.toISOString(),
    conversations: [],
    calendar_bookings: [],
    lead_tasks: []
  };

  const supabase = {
    from(table) {
      if (table === 'leads') return { select() { return { order() { return Promise.resolve({ data: [mockLeadCreatedToday], error: null }); } }; } };
      const chain = {
        select() { return chain; },
        order() { return chain; },
        in() { return chain; },
        eq() { return chain; },
        then(resolve) { resolve({ data: [], error: null }); }
      };
      return chain;
    }
  };

  const res = await fetchFollowUpRecommendationsFromDatabase(supabase, { page: 1, pageSize: 20, tab: 'scheduled', now });
  assert.strictEqual(res.counts.attention, 0, 'Lead criada hoje nao deve estar na tab atencao (needs_follow_up=false)');
  assert.strictEqual(res.counts.scheduled, 1, 'Lead criada hoje fica agendada para 2 dias no futuro (tab agendados)');
  assert.strictEqual(res.recommendations[0].needs_follow_up, false);
  assert.strictEqual(res.recommendations[0].reason_code, 'stale_qualified_lead');

  console.log('TESTE 5 PASSOU: Lead Qualified recente é classificada com needs_follow_up=false (Agendados) sem alterar regras.');
}

console.log('\n=== TODOS OS TESTES DE PAGINAÇÃO E ESTRUTURA DO ACOMPANHAMENTO PASSARAM COM SUCESSO ===');
