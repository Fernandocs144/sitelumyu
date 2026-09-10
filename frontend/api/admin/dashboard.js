import { createClient } from '@supabase/supabase-js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../../server/admin/admin-auth-service.js';
import {
  parseDashboardQueryParams,
  fetchAdminDashboardFromDatabase,
} from '../../server/admin/admin-dashboard-service.js';

export async function handleGetDashboardRequest(request) {
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

  // 3. Processar parâmetros de consulta
  const url = parseAdminRequestUrl(request);
  const params = parseDashboardQueryParams(url.searchParams);

  // 4. Executar agregador do dashboard
  try {
    const dashboardData = await fetchAdminDashboardFromDatabase(serviceClient, params);

    return createAdminJsonResponse(
      {
        ok: true,
        ...dashboardData,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao carregar o dashboard' },
      500,
      session.newCookies
    );
  }
}

export default {
  async fetch(request) {
    return handleGetDashboardRequest(request);
  },
};
