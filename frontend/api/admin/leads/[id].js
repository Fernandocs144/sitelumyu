import { createClient } from '@supabase/supabase-js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../../../server/admin/admin-auth-service.js';
import {
  isValidUuid,
  fetchLeadByIdFromDatabase,
} from '../../../server/admin/admin-lead-detail-service.js';

export async function handleGetLeadDetailRequest(request, paramsId = null) {
  if (request.method !== 'GET') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  // 1. Autenticação e Autorização Admin
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

  // 2. Extrair ID da URL
  const url = parseAdminRequestUrl(request);
  let leadId = paramsId;

  if (!leadId) {
    const queryId = request?.query?.id || request?.query?.leadId || url.searchParams.get('id') || url.searchParams.get('leadId');
    if (queryId) {
      leadId = queryId;
    } else {
      // Extrair último segmento do caminho /api/admin/leads/<id>
      const segments = url.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment !== 'leads' && lastSegment !== 'leads-detail') {
        leadId = lastSegment;
      }
    }
  }

  if (!leadId || !isValidUuid(leadId)) {
    return createAdminJsonResponse({ ok: false, error: 'ID de lead inválido' }, 400);
  }

  // 3. Cliente Supabase exclusivo server-side com service_role
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createAdminJsonResponse({ ok: false, error: 'Configuração de servidor incompleta' }, 500);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 4. Obter detalhe comercial unificado do lead (Lead 360)
  try {
    const { lead, conversation, conversations, pipelineHistory, bookings } =
      await fetchLeadByIdFromDatabase(serviceClient, leadId);

    return createAdminJsonResponse(
      {
        ok: true,
        lead,
        conversation,
        conversations,
        pipelineHistory,
        bookings,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao obter detalhe da lead' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleGetLeadDetailRequest(request);
  },
};
