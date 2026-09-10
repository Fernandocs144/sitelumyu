import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../api/_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../admin-auth-service.js';
import { fetchGlobalAdminTasksFromDatabase } from '../admin-tasks-service.js';

export async function handleGetTasksRequest(request) {
  loadLocalEnv();

  // 1. Método HTTP deve ser estritamente GET
  if (request.method !== 'GET') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  // 2. Validar autenticação e autorização administrativa
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

  // 3. Cliente Supabase exclusivo server-side com service_role
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

  const url = parseAdminRequestUrl(request);
  const includeCompleted = url.searchParams.get('include_completed') === 'true';
  const limitParam = parseInt(url.searchParams.get('limit') || '200', 10);
  const limit = isNaN(limitParam) || limitParam <= 0 ? 200 : limitParam;

  try {
    const result = await fetchGlobalAdminTasksFromDatabase(serviceClient, {
      limit,
      includeCompleted,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        tasks: result.tasks,
        total: result.total,
        truncated: result.truncated,
        limit: result.limit,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao consultar tarefas globais' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleGetTasksRequest(request);
  },
};
