import { createClient } from '@supabase/supabase-js';
import { transitionLeadPipelineStage } from '../pipeline/pipeline-service.js';

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
 * Ordena por start_time ASC por defeito.
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
    provider_metadata,
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
    provider_metadata: row.provider_metadata,
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

/**
 * Cria uma reunião manual na tabela public.calendar_bookings e avança a lead para meeting_scheduled se apropriado.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ leadId: string, startTime: string, durationMinutes?: number, notes?: string|null, timezone?: string, adminUserId?: string|null }} params
 * @returns {Promise<{ booking: object, pipelineTransitioned: boolean }>}
 */
export async function createAdminBookingInDatabase(
  supabaseClient,
  { leadId, startTime, durationMinutes = 30, notes = null, timezone = 'Europe/Lisbon', adminUserId = null }
) {
  if (!leadId || typeof leadId !== 'string') {
    const err = new Error('ID de lead obrigatório');
    err.statusCode = 400;
    throw err;
  }

  if (!startTime) {
    const err = new Error('Data e hora de início obrigatórias');
    err.statusCode = 400;
    throw err;
  }

  const parsedStart = new Date(startTime);
  if (isNaN(parsedStart.getTime())) {
    const err = new Error('Data e hora de início inválidas');
    err.statusCode = 400;
    throw err;
  }
  const startTimeIso = parsedStart.toISOString();

  const duration = Number(durationMinutes);
  if (isNaN(duration) || duration <= 0) {
    const err = new Error('Duração da reunião deve ser superior a 0 minutos');
    err.statusCode = 400;
    throw err;
  }
  const endTimeIso = new Date(parsedStart.getTime() + duration * 60 * 1000).toISOString();

  // Verificar existência da Lead
  const { data: lead, error: leadErr } = await supabaseClient
    .from('leads')
    .select('id, name, email, pipeline_stage')
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr) {
    throw new Error(`Erro ao verificar lead: ${leadErr.message}`);
  }

  if (!lead) {
    const err = new Error('Lead não encontrada');
    err.statusCode = 404;
    throw err;
  }

  const externalBookingId = `manual_${crypto.randomUUID()}`;
  const attendeeName = lead.name && lead.name.trim().length > 0 ? lead.name.trim() : (lead.email || 'Lead sem nome');
  const attendeeEmail = lead.email && lead.email.trim().length > 0 ? lead.email.trim() : null;

  const bookingPayload = {
    provider: 'manual',
    external_booking_id: externalBookingId,
    lead_id: leadId,
    status: 'confirmed',
    start_time: startTimeIso,
    end_time: endTimeIso,
    timezone: timezone || 'Europe/Lisbon',
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
    provider_metadata: {
      notes: notes && typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null,
      created_by_admin: adminUserId || null,
      duration_minutes: duration,
      is_manual: true,
    },
  };

  const { data: insertedBooking, error: insertErr } = await supabaseClient
    .from('calendar_bookings')
    .insert(bookingPayload)
    .select(`
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
      provider_metadata,
      created_at,
      updated_at,
      leads:lead_id(
        id,
        name,
        email,
        company_name,
        primary_service,
        lead_classification
      )
    `)
    .single();

  if (insertErr) {
    throw new Error(`Erro ao criar reunião manual: ${insertErr.message}`);
  }

  let pipelineTransitioned = false;
  if (lead.pipeline_stage && ['new', 'qualified', 'meeting_scheduled'].includes(lead.pipeline_stage)) {
    try {
      await transitionLeadPipelineStage({
        supabase: supabaseClient,
        leadId,
        toStage: 'meeting_scheduled',
        source: 'admin_user',
        changedBy: adminUserId || null,
        allowedFromStages: ['new', 'qualified', 'meeting_scheduled'],
      });
      pipelineTransitioned = true;
    } catch (pipeErr) {
      console.error('Aviso: Erro ao atualizar etapa de pipeline ao criar reunião manual:', pipeErr.message);
    }
  }

  return {
    booking: {
      id: insertedBooking.id,
      provider: insertedBooking.provider,
      external_booking_id: insertedBooking.external_booking_id,
      conversation_id: insertedBooking.conversation_id,
      lead_id: insertedBooking.lead_id,
      status: insertedBooking.status,
      start_time: insertedBooking.start_time,
      end_time: insertedBooking.end_time,
      timezone: insertedBooking.timezone,
      attendee_name: insertedBooking.attendee_name,
      attendee_email: insertedBooking.attendee_email,
      provider_metadata: insertedBooking.provider_metadata,
      created_at: insertedBooking.created_at,
      updated_at: insertedBooking.updated_at,
      lead: insertedBooking.leads || null,
    },
    pipelineTransitioned,
  };
}
