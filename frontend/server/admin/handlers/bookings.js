import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../api/_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
  parseAdminRequestJson,
} from '../admin-auth-service.js';
import {
  parseBookingsQueryParams,
  fetchAdminBookingsFromDatabase,
  createAdminBookingInDatabase,
} from '../admin-bookings-service.js';

export async function handleGetBookingsRequest(request) {
  loadLocalEnv();

  if (request.method !== 'GET') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  // 1. Validar autenticação e autorização administrativa
  const session = await verifyAdminSession(request);
  const isSecure = isRequestSecure(request);

  if (!session.authenticated) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, error: session.error || 'Não autenticado' },
      401,
      cookiesToApply
    );
  }

  if (!session.authorized) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, error: session.error || 'Acesso não autorizado' },
      403,
      cookiesToApply
    );
  }

  // 2. Configurar cliente Supabase exclusivo server-side com service_role
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createAdminJsonResponse(
      { ok: false, error: 'Configuração de servidor incompleta' },
      500,
      session.newCookies
    );
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Processar e validar parâmetros de consulta
  const url = parseAdminRequestUrl(request);
  let params;
  try {
    params = parseBookingsQueryParams(url.searchParams);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Parâmetros de consulta inválidos' },
      statusCode,
      session.newCookies
    );
  }

  // 4. Executar consulta à base de dados
  try {
    const result = await fetchAdminBookingsFromDatabase(serviceClient, params);

    return createAdminJsonResponse(
      {
        ok: true,
        bookings: result.bookings,
        count: result.count,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: 'Erro ao obter a listagem de agendamentos' },
      500,
      session.newCookies
    );
  }
}

export async function handlePostBookingsRequest(request) {
  loadLocalEnv();

  if (request.method !== 'POST') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  const session = await verifyAdminSession(request);
  const isSecure = isRequestSecure(request);

  if (!session.authenticated) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, error: session.error || 'Não autenticado' },
      401,
      cookiesToApply
    );
  }

  if (!session.authorized) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, error: session.error || 'Acesso não autorizado' },
      403,
      cookiesToApply
    );
  }

  let body;
  try {
    body = await parseAdminRequestJson(request);
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: 'Corpo da requisição em formato JSON inválido' },
      400,
      session.newCookies
    );
  }

  if (!body || typeof body !== 'object') {
    return createAdminJsonResponse(
      { ok: false, error: 'O corpo da requisição é obrigatório' },
      400,
      session.newCookies
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createAdminJsonResponse(
      { ok: false, error: 'Configuração de servidor incompleta' },
      500,
      session.newCookies
    );
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminUserId = session.adminRecord?.user_id || session.user?.id;
  const leadId = body.lead_id || body.leadId;
  const startTime = body.start_time || body.startTime || (body.date && body.time ? `${body.date}T${body.time}:00` : null);
  const durationMinutes = body.duration_minutes || body.durationMinutes || body.duration || 30;
  const notes = body.notes || null;
  const timezone = body.timezone || 'Europe/Lisbon';

  try {
    const result = await createAdminBookingInDatabase(serviceClient, {
      leadId,
      startTime,
      durationMinutes,
      notes,
      timezone,
      adminUserId,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        booking: result.booking,
        pipeline_transitioned: result.pipelineTransitioned,
      },
      201,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao criar reunião manual' },
      statusCode,
      session.newCookies
    );
  }
}

export async function handleBookingsRequest(request) {
  if (request.method === 'POST') {
    return handlePostBookingsRequest(request);
  }
  return handleGetBookingsRequest(request);
}

export default {
  async fetch(request) {
    return handleBookingsRequest(request);
  },
};
