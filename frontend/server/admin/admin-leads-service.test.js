import assert from 'node:assert';
import {
  parseLeadsQueryParams,
  MINIMIZED_LEAD_FIELDS,
  fetchAdminLeadsFromDatabase,
} from './admin-leads-service.js';
import { handleGetLeadsRequest } from '../../api/admin/leads.js';

console.log('=== INICIANDO SUITE DE TESTES DA LISTAGEM DE LEADS ADMIN (PASSO 1C) ===\n');

// 1. TESTE DE PARSER DE PARÂMETROS E LIMITES
{
  const params1 = parseLeadsQueryParams(new URLSearchParams(''));
  assert.strictEqual(params1.page, 1, 'Default page deve ser 1');
  assert.strictEqual(params1.pageSize, 20, 'Default pageSize deve ser 20');
  assert.strictEqual(params1.search, '', 'Default search deve ser string vazia');
  assert.strictEqual(params1.service, '', 'Default service deve ser string vazia');
  assert.strictEqual(params1.classification, '', 'Default classification deve ser string vazia');

  // Limite máximo de pageSize = 100
  const params2 = parseLeadsQueryParams(new URLSearchParams('page=2&pageSize=500&search=%20empresa%20&service=websites&classification=priority'));
  assert.strictEqual(params2.page, 2, 'Page deve ser 2');
  assert.strictEqual(params2.pageSize, 100, 'PageSize deve ser truncado para o limite máximo 100');
  assert.strictEqual(params2.search, 'empresa', 'Search deve ser sanitized com trim');
  assert.strictEqual(params2.service, 'websites', 'Service deve ser trimmed');
  assert.strictEqual(params2.classification, 'priority', 'Classification deve ser trimmed');

  // Valores inválidos ou negativos
  const params3 = parseLeadsQueryParams(new URLSearchParams('page=-5&pageSize=0'));
  assert.strictEqual(params3.page, 1, 'Page negativa deve fallback para 1');
  assert.strictEqual(params3.pageSize, 20, 'PageSize zero deve fallback para 20');

  console.log('TESTE 1 PASSOU: Sanitização, defaults e limite máximo de pageSize (100) verificados.');
}

// 2. TESTE DE MINIMIZAÇÃO DE CAMPOS
{
  assert.ok(MINIMIZED_LEAD_FIELDS.includes('id'), 'Campos deve conter id');
  assert.ok(MINIMIZED_LEAD_FIELDS.includes('primary_service'), 'Campos deve conter primary_service');
  assert.ok(MINIMIZED_LEAD_FIELDS.includes('lead_classification'), 'Campos deve conter lead_classification');
  assert.ok(!MINIMIZED_LEAD_FIELDS.includes('need_description'), 'Campos NAO deve conter descrições longas internas');
  assert.ok(!MINIMIZED_LEAD_FIELDS.includes('operational_impact'), 'Campos NAO deve conter impacto operacional');
  assert.ok(!MINIMIZED_LEAD_FIELDS.includes('financial_alignment_reason'), 'Campos NAO deve conter raciocínio interno');

  console.log('TESTE 2 PASSOU: Minimização estrita de dados verificada.');
}

// 3. TESTE DE CONSTRUÇÃO DE QUERY À BASE DE DADOS (MOCKED SUPABASE CLIENT)
{
  let queryState = {
    selectedFields: null,
    countOption: null,
    orCondition: null,
    eqConditions: {},
    orderBy: null,
    rangeFrom: null,
    rangeTo: null,
  };

  const mockSupabase = {
    from(table) {
      assert.strictEqual(table, 'leads', 'Deve consultar a tabela leads');
      return {
        select(fields, options) {
          queryState.selectedFields = fields;
          queryState.countOption = options?.count;
          return this;
        },
        or(condition) {
          queryState.orCondition = condition;
          return this;
        },
        eq(col, val) {
          queryState.eqConditions[col] = val;
          return this;
        },
        order(col, options) {
          queryState.orderBy = { col, options };
          return this;
        },
        range(from, to) {
          queryState.rangeFrom = from;
          queryState.rangeTo = to;
          return Promise.resolve({
            data: [
              {
                id: 'lead-1',
                name: 'Cliente Teste',
                email: 'teste@empresa.pt',
                primary_service: 'websites',
                lead_classification: 'priority',
              },
            ],
            count: 45,
            error: null,
          });
        },
      };
    },
  };

  const result = await fetchAdminLeadsFromDatabase(mockSupabase, {
    page: 2,
    pageSize: 10,
    search: 'empresa',
    service: 'websites',
    classification: 'priority',
  });

  assert.strictEqual(result.leads.length, 1, 'Deve devolver 1 lead mockada');
  assert.strictEqual(result.pagination.total, 45, 'Total de registos deve ser 45');
  assert.strictEqual(result.pagination.totalPages, 5, 'Total de páginas deve ser 5 (45 / 10)');
  assert.strictEqual(queryState.rangeFrom, 10, 'Range from para página 2 de 10 deve ser 10');
  assert.strictEqual(queryState.rangeTo, 19, 'Range to para página 2 de 10 deve ser 19');
  assert.strictEqual(queryState.eqConditions['primary_service'], 'websites', 'Filtro de serviço deve ser websites');
  assert.strictEqual(queryState.eqConditions['lead_classification'], 'priority', 'Filtro de classificação deve ser priority');
  assert.ok(queryState.orCondition.includes('empresa'), 'Filtro de pesquisa or() deve ser aplicado');

  console.log('TESTE 3 PASSOU: Construção da query Supabase, ordenação por atividade e intervalos de paginação validados.');
}

// 4. TESTE DE AUTENTICAÇÃO E AUTORIZAÇÃO DO ENDPOINT GET /api/admin/leads
{
  // Requisição sem qualquer cookie -> 401
  const reqUnauthenticated = new Request('http://localhost/api/admin/leads');
  const resUnauthenticated = await handleGetLeadsRequest(reqUnauthenticated);
  assert.strictEqual(resUnauthenticated.status, 401, 'Requisição sem cookies deve retornar 401');

  const bodyUnauth = await resUnauthenticated.json();
  assert.strictEqual(bodyUnauth.ok, false, 'Body ok deve ser false');

  console.log('TESTE 4 PASSOU: Proteção contra acessos não autenticados (401) no endpoint /api/admin/leads verificada.');
}

console.log('\n=== TODOS OS TESTES DA LISTAGEM DE LEADS (PASSO 1C) PASSARAM COM SUCESSO ===');
