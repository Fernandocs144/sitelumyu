import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../api/_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../admin-auth-service.js';
import { fetchFollowUpRecommendationsFromDatabase } from '../admin-followup-service.js';

export async function handleGetAdminFollowUpsRequest(request) {
  loadLocalEnv();

  // 1. Método HTTP deve ser estritamente GET (Read-Only)
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
  const showBlocked = url.searchParams.get('show_blocked') === 'true';
  const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam;
  const pageSizeParam = parseInt(url.searchParams.get('pageSize') || url.searchParams.get('limit') || '20', 10);
  const pageSize = isNaN(pageSizeParam) || pageSizeParam <= 0 ? 20 : pageSizeParam;
  const tab = url.searchParams.get('tab') || 'attention';

  try {
    const result = await fetchFollowUpRecommendationsFromDatabase(serviceClient, {
      page,
      pageSize,
      tab,
      showBlocked,
      now: new Date()
    });

    return createAdminJsonResponse(
      {
        ok: true,
        recommendations: result.recommendations,
        pagination: result.pagination,
        counts: result.counts,
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
      { ok: false, error: err.message || 'Erro ao calcular recomendações de follow-up' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleGetAdminFollowUpsRequest(request);
  },
};
