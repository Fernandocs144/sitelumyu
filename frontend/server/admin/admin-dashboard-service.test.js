import assert from 'node:assert';
import { test } from 'node:test';
import {
  parseDashboardQueryParams,
  getPeriodCutoffDate,
  fetchAdminDashboardFromDatabase,
} from './admin-dashboard-service.js';
import { handleGetDashboardRequest } from './handlers/dashboard.js';

test('=== INICIANDO SUITE DE TESTES DO DASHBOARD ADMIN (PASSO 1F) ===', async () => {
  // Teste 1: Validação do parâmetro temporal period
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('period=7d')).period, '7d');
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('period=30d')).period, '30d');
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('period=90d')).period, '90d');
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('period=all')).period, 'all');
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('period=invalid')).period, '30d');
  assert.strictEqual(parseDashboardQueryParams(new URLSearchParams('')).period, '30d');
  console.log('TESTE 1 PASSOU: Validação e fallback do parâmetro period verificados.');

  // Teste 2: Cálculo do cutoff temporal
  assert.strictEqual(getPeriodCutoffDate('all'), null);
  const cutoff30 = getPeriodCutoffDate('30d');
  assert.ok(cutoff30 && typeof cutoff30 === 'string');
  console.log('TESTE 2 PASSOU: Cálculo de data limite (cutoff) verificado.');

  // Teste 3: Agregações e Período Sem Dados
  const createChainableMock = (data = []) => {
    const chain = {
      order: () => chain,
      gte: () => chain,
      in: () => chain,
      then: (resolve) => resolve({ data, error: null }),
    };
    return chain;
  };

  const mockEmptyClient = {
    from() {
      return {
        select() {
          return createChainableMock([]);
        },
      };
    },
  };

  const emptyData = await fetchAdminDashboardFromDatabase(mockEmptyClient, { period: '30d' });
  assert.strictEqual(emptyData.kpis.totalLeads, 0);
  assert.strictEqual(emptyData.kpis.qualifiedLeads, 0);
  assert.strictEqual(emptyData.kpis.totalConversations, 0);
  assert.strictEqual(emptyData.kpis.meetingsBooked, 0);
  assert.strictEqual(emptyData.recentLeads.length, 0);
  assert.strictEqual(emptyData.recentConversations.length, 0);
  console.log('TESTE 3 PASSOU: Estado de zero dados em período sem atividade validado.');

  // Teste 4: Agregações com Dados Reais / Mencionados
  const mockPopulatedClient = {
    from(table) {
      if (table === 'leads') {
        return {
          select() {
            return createChainableMock([
              {
                id: 'l1',
                name: 'Lead 1',
                company_name: 'Empresa 1',
                email: 'lead1@example.com',
                primary_service: 'websites',
                lead_classification: 'qualified',
                financial_alignment_status: 'aligned',
                created_at: '2026-08-31T00:00:00.000Z',
              },
              {
                id: 'l2',
                name: 'Lead 2',
                company_name: null,
                email: 'lead2@example.com',
                primary_service: 'automation',
                lead_classification: 'priority',
                financial_alignment_status: 'low_alignment',
                created_at: '2026-08-30T12:00:00.000Z',
              },
            ]);
          },
        };
      }
      if (table === 'conversations') {
        return {
          select() {
            return createChainableMock([
              {
                id: 'c1',
                status: 'active',
                commercial_stage: 'discovery',
                primary_outcome: 'meeting_booked',
                created_at: '2026-08-31T00:00:00.000Z',
                last_activity_at: '2026-08-31T01:00:00.000Z',
                leads: { id: 'l1', name: 'Lead 1', email: 'lead1@example.com' },
              },
            ]);
          },
        };
      }
      if (table === 'calendar_bookings') {
        return {
          select() {
            return createChainableMock([
              { id: 'b1', created_at: '2026-08-31T00:00:00.000Z', status: 'confirmed' },
            ]);
          },
        };
      }
      return {};
    },
  };

  const dashboardRes = await fetchAdminDashboardFromDatabase(mockPopulatedClient, { period: 'all' });
  assert.strictEqual(dashboardRes.kpis.totalLeads, 2);
  assert.strictEqual(dashboardRes.kpis.qualifiedLeads, 2); // qualified + priority
  assert.strictEqual(dashboardRes.kpis.totalConversations, 1);
  assert.strictEqual(dashboardRes.kpis.meetingsBooked, 1);
  assert.strictEqual(dashboardRes.recentLeads.length, 2);
  assert.strictEqual(dashboardRes.recentConversations.length, 1);
  console.log('TESTE 4 PASSOU: Agregações de KPIs e atividade recente validadas.');

  // Teste 5: Rejeição de requisições não autenticadas (401)
  const reqUnauth = new Request('http://localhost:3000/api/admin/dashboard?period=30d');
  const resUnauth = await handleGetDashboardRequest(reqUnauth);
  assert.strictEqual(resUnauth.status, 401);
  console.log('TESTE 5 PASSOU: Rejeição de requisições não autenticadas (401) verificada.');

  console.log('\n=== TODOS OS TESTES DO DASHBOARD ADMIN (PASSO 1F) PASSARAM COM SUCESSO ===');
});
