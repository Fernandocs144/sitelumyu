import { createClient } from '@supabase/supabase-js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../../server/admin/admin-auth-service.js';
import {
  parseLeadsQueryParams,
  fetchAdminLeadsFromDatabase,
} from '../../server/admin/admin-leads-service.js';

export async function handleGetLeadsRequest(request) {
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
      500
    );
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Processar parâmetros de consulta
  const url = parseAdminRequestUrl(request);
  const params = parseLeadsQueryParams(url.searchParams);

  // 4. Executar consulta à base de dados
  try {
    const result = await fetchAdminLeadsFromDatabase(serviceClient, params);

    return createAdminJsonResponse(
      {
        ok: true,
        leads: result.leads,
        pagination: result.pagination,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: 'Erro ao obter a listagem de leads' },
      500,
      session.newCookies
    );
  }
}

export default {
  async fetch(request) {
    return handleGetLeadsRequest(request);
  },
};
