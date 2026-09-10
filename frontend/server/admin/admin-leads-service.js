import { createClient } from '@supabase/supabase-js';

/**
 * Normaliza e valida os parâmetros de consulta da listagem de leads.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ page: number, pageSize: number, search: string, service: string, classification: string }}
 */
export function parseLeadsQueryParams(searchParams) {
  let page = parseInt(searchParams.get('page'), 10);
  if (isNaN(page) || page < 1) page = 1;

  let pageSize = parseInt(searchParams.get('pageSize'), 10);
  if (isNaN(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;

  const search = (searchParams.get('search') || '').trim();
  const service = (searchParams.get('service') || '').trim();
  const classification = (searchParams.get('classification') || '').trim();

  return { page, pageSize, search, service, classification };
}

/**
 * Lista de campos minimizados estritamente necessários à UI de listagem administrativa.
 * Exclui descrições longas, razões de alinhamento e metadata interna de raciocínio.
 */
export const MINIMIZED_LEAD_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'company_name',
  'primary_service',
  'service_variant',
  'stated_budget_min',
  'stated_budget_max',
  'stated_budget_currency',
  'stated_budget_period',
  'stated_budget_raw',
  'financial_alignment_status',
  'lead_classification',
  'created_at',
  'last_interaction_at',
].join(', ');

/**
 * Consulta paginada a public.leads utilizando o cliente Supabase server-side.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ page: number, pageSize: number, search: string, service: string, classification: string }} params
 * @returns {Promise<{ leads: Array, pagination: { page: number, pageSize: number, total: number, totalPages: number } }>}
 */
export async function fetchAdminLeadsFromDatabase(supabaseClient, params) {
  const { page, pageSize, search, service, classification } = params;

  let query = supabaseClient
    .from('leads')
    .select(MINIMIZED_LEAD_FIELDS, { count: 'exact' });

  // Pesquisa apenas sobre campos reais existentes (name, email, company_name)
  if (search) {
    const sanitizedSearch = search.replace(/[,.()]/g, '');
    if (sanitizedSearch) {
      query = query.or(
        `name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,company_name.ilike.%${sanitizedSearch}%`
      );
    }
  }

  // Filtro por Serviço Principal
  if (service) {
    query = query.eq('primary_service', service);
  }

  // Filtro por Classificação Comercial
  if (classification) {
    query = query.eq('lead_classification', classification);
  }

  // Ordenação por atividade mais recente (última interação ou fallback para criação)
  query = query.order('last_interaction_at', { ascending: false, nullsFirst: false });

  // Paginação
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Erro ao consultar tabela public.leads: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    leads: data || [],
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
