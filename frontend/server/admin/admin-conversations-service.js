import { createClient } from '@supabase/supabase-js';

const ALLOWED_STAGES = [
  'discovery',
  'exploring_need',
  'qualifying',
  'suggesting_booking',
  'booking_in_progress',
  'closed',
];

const ALLOWED_OUTCOMES = [
  'information_only',
  'lead_captured',
  'lead_qualified',
  'meeting_booked',
  'human_handoff',
  'not_interested',
  'possible_abandonment',
  'abandoned_before_contact',
  'abandoned_during_qualification',
  'abandoned_during_booking',
  'technical_failure',
  'spam_detected',
];

/**
 * Valida se uma string é um UUID v4/genérico válido.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Sanitiza o termo de pesquisa convertendo + em espaço (proveniente de codificação de URL)
 * e removendo vírgulas e parênteses que alteram a sintaxe or() do PostgREST.
 * Preserva pontos (essenciais para emails) e arrobas.
 *
 * @param {string} term
 * @returns {string}
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/\+/g, ' ').replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza e valida os parâmetros de consulta da listagem de conversas.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ page: number, pageSize: number, search: string, stage: string, outcome: string }}
 */
export function parseConversationsQueryParams(searchParams) {
  let page = parseInt(searchParams.get('page'), 10);
  if (isNaN(page) || page < 1) page = 1;

  let pageSize = parseInt(searchParams.get('pageSize'), 10);
  if (isNaN(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;

  const search = (searchParams.get('search') || '').trim();
  let stage = (searchParams.get('stage') || '').trim();
  if (stage && !ALLOWED_STAGES.includes(stage)) stage = '';

  let outcome = (searchParams.get('outcome') || '').trim();
  if (outcome && !ALLOWED_OUTCOMES.includes(outcome)) outcome = '';

  return { page, pageSize, search, stage, outcome };
}

/**
 * Executa a consulta paginada a public.conversations com junção de lead mínima e contagem de mensagens.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ page: number, pageSize: number, search: string, stage: string, outcome: string }} params
 * @returns {Promise<{ conversations: Array, pagination: { page: number, pageSize: number, total: number, totalPages: number } }>}
 */
export async function fetchAdminConversationsFromDatabase(supabaseClient, params) {
  const { page, pageSize, search, stage, outcome } = params;

  const sanitizedSearch = sanitizeSearchTerm(search);
  const isSearchText = Boolean(sanitizedSearch);
  const isFullUuid = isValidUuid(sanitizedSearch);

  // Se a pesquisa for texto sobre o lead associado, usamos INNER JOIN para filtrar; caso contrário, LEFT JOIN
  const leadJoinSyntax = (isSearchText && !isFullUuid)
    ? 'leads!inner(id, name, company_name, email, phone)'
    : 'leads:lead_id(id, name, company_name, email, phone)';

  const selectFields = `id, status, commercial_stage, primary_outcome, language, created_at, last_activity_at, ${leadJoinSyntax}, messages(count)`;

  let query = supabaseClient
    .from('conversations')
    .select(selectFields, { count: 'exact' });

  // Aplicação estritamente segura da pesquisa
  if (isSearchText) {
    if (isFullUuid) {
      // Postgres UUID requer operador de igualdade .eq(), pois ilike gera erro 42883 em colunas UUID
      query = query.eq('id', sanitizedSearch);
    } else {
      query = query.or(
        `name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,company_name.ilike.%${sanitizedSearch}%`,
        { foreignTable: 'leads' }
      );
    }
  }

  // Filtro por Etapa Comercial
  if (stage) {
    query = query.eq('commercial_stage', stage);
  }

  // Filtro por Resultado Primário
  if (outcome) {
    query = query.eq('primary_outcome', outcome);
  }

  // Ordenar por atividade mais recente
  query = query.order('last_activity_at', { ascending: false });

  // Paginação
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao consultar conversas na base de dados: ${error.message}`);
  }

  const formattedConversations = (data || []).map((conv) => {
    const messageCount = Array.isArray(conv.messages) && conv.messages[0] ? conv.messages[0].count : 0;
    return {
      id: conv.id,
      status: conv.status,
      commercial_stage: conv.commercial_stage,
      primary_outcome: conv.primary_outcome,
      language: conv.language,
      created_at: conv.created_at,
      last_activity_at: conv.last_activity_at,
      lead: conv.leads || null,
      messageCount,
    };
  });

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    conversations: formattedConversations,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
