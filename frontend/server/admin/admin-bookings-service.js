import { createClient } from '@supabase/supabase-js';

const ALLOWED_STATUSES = ['all', 'confirmed', 'rescheduled', 'cancelled', 'pending'];

/**
 * Sanitiza o termo de pesquisa convertendo + em espaço e removendo vírgulas/parênteses
 * que possam interferir com a sintaxe do PostgREST.
 *
 * @param {string} term
 * @returns {string}
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/\+/g, ' ').replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza e valida os parâmetros de consulta da listagem de reuniões/agendamentos.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ status: string, startDate: string|null, endDate: string|null, search: string }}
 */
export function parseBookingsQueryParams(searchParams) {
  const rawStatus = (searchParams.get('status') || 'all').trim().toLowerCase();
  if (rawStatus && !ALLOWED_STATUSES.includes(rawStatus)) {
    const err = new Error('Status de agendamento inválido');
    err.statusCode = 400;
    throw err;
  }
  const status = rawStatus || 'all';

  const startDateRaw = searchParams.get('startDate');
  let startDate = null;
  if (startDateRaw && startDateRaw.trim()) {
    const parsedStart = Date.parse(startDateRaw.trim());
    if (isNaN(parsedStart)) {
      const err = new Error('Data inicial inválida');
      err.statusCode = 400;
      throw err;
    }
    startDate = new Date(parsedStart).toISOString();
  }

  const endDateRaw = searchParams.get('endDate');
  let endDate = null;
  if (endDateRaw && endDateRaw.trim()) {
    const parsedEnd = Date.parse(endDateRaw.trim());
    if (isNaN(parsedEnd)) {
      const err = new Error('Data final inválida');
      err.statusCode = 400;
      throw err;
    }
    endDate = new Date(parsedEnd).toISOString();
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    const err = new Error('Data inicial não pode ser superior à data final');
    err.statusCode = 400;
    throw err;
  }

  const search = sanitizeSearchTerm(searchParams.get('search') || '');

  return { status, startDate, endDate, search };
}

/**
 * Consulta a tabela public.calendar_bookings utilizando o cliente Supabase server-side.
 * Ordena por start_time ASC por defeito e exclui provider_metadata por motivos de segurança.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ status: string, startDate: string|null, endDate: string|null, search: string }} params
 * @returns {Promise<{ bookings: Array, count: number }>}
 */
export async function fetchAdminBookingsFromDatabase(supabaseClient, params) {
  const { status, startDate, endDate, search } = params;

  const selectFields = `
    id,
    provider,
    external_booking_id,
    conversation_id,
    lead_id,
    status,
    start_time,
    end_time,
    timezone,
    attendee_name,
    attendee_email,
    created_at,
    updated_at,
    leads:lead_id(
      id,
      name,
      email,
      company_name,
      primary_service,
      lead_classification
    ),
    conversations:conversation_id(
      id,
      commercial_stage,
      primary_outcome
    )
  `;

  let query = supabaseClient
    .from('calendar_bookings')
    .select(selectFields)
    .order('start_time', { ascending: true, nullsFirst: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('start_time', startDate);
  }

  if (endDate) {
    query = query.lte('start_time', endDate);
  }

  if (search) {
    query = query.or(`attendee_name.ilike.%${search}%,attendee_email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro na consulta à base de dados de agendamentos: ${error.message}`);
  }

  const bookings = (data || []).map((row) => ({
    id: row.id,
    provider: row.provider,
    external_booking_id: row.external_booking_id,
    conversation_id: row.conversation_id,
    lead_id: row.lead_id,
    status: row.status,
    start_time: row.start_time,
    end_time: row.end_time,
    timezone: row.timezone,
    attendee_name: row.attendee_name,
    attendee_email: row.attendee_email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: row.leads || null,
    conversation: row.conversations || null,
  }));

  return {
    bookings,
    count: bookings.length,
  };
}
