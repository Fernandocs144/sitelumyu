import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../api/_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
} from '../admin-auth-service.js';
import {
  fetchAdminPipelineFromDatabase,
} from '../admin-pipeline-service.js';

export async function handleGetPipelineRequest(request) {
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
      500
    );
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Executar agregador do pipeline
  try {
    const pipelineData = await fetchAdminPipelineFromDatabase(serviceClient);

    return createAdminJsonResponse(
      {
        ok: true,
        ...pipelineData,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao carregar o pipeline' },
      500,
      session.newCookies
    );
  }
}

export default {
  async fetch(request) {
    return handleGetPipelineRequest(request);
  },
};
