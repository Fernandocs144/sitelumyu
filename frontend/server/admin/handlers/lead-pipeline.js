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
  transitionLeadPipelineStage,
  isValidUuid,
} from '../../pipeline/pipeline-service.js';

export async function handlePatchLeadPipelineRequest(request, paramsId = null) {
  loadLocalEnv();

  // 1. Método HTTP deve ser estritamente PATCH
  if (request.method !== 'PATCH') {
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

  // 3. Extrair ID da URL
  const url = parseAdminRequestUrl(request);
  let leadId = paramsId;

  if (!leadId) {
    const queryId = request?.query?.id || request?.query?.leadId || url.searchParams.get('id') || url.searchParams.get('leadId');
    if (queryId) {
      leadId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const pipelineIdx = segments.indexOf('pipeline');
      if (pipelineIdx > 0) {
        leadId = segments[pipelineIdx - 1];
      } else {
        const leadsIdx = segments.indexOf('leads');
        if (leadsIdx >= 0 && leadsIdx < segments.length - 1) {
          leadId = segments[leadsIdx + 1];
        }
      }
    }
  }

  if (!leadId || !isValidUuid(leadId)) {
    return createAdminJsonResponse(
      { ok: false, error: 'ID de lead inválido' },
      400,
      session.newCookies
    );
  }

  // 4. Ler o corpo da requisição em formato JSON
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

  if (!body || typeof body !== 'object' || !body.pipeline_stage) {
    return createAdminJsonResponse(
      { ok: false, error: 'O campo pipeline_stage é obrigatório' },
      400,
      session.newCookies
    );
  }

  // 5. Cliente Supabase exclusivo server-side com service_role
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

  // 6. Forçar de forma incondicional source='admin_user' e changedBy=admin.user_id
  const adminUserId = session.adminRecord?.user_id || session.user?.id;

  try {
    const result = await transitionLeadPipelineStage({
      supabase: serviceClient,
      leadId,
      toStage: body.pipeline_stage,
      source: 'admin_user',
      changedBy: adminUserId,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        changed: result.changed,
        lead: result.lead,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao processar transição de pipeline' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handlePatchLeadPipelineRequest(request);
  },
};
