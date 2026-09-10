import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../api/_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
} from '../admin-auth-service.js';
import { isValidUuid } from '../admin-lead-detail-service.js';
import { cancelApprovedCommunication } from '../admin-followup-approval-service.js';

export async function handlePostCancelApprovedCommunicationRequest(request, paramsId = null) {
  loadLocalEnv();

  // 1. Método HTTP deve ser estritamente POST
  if (request.method !== 'POST') {
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

  const adminUserId = session.adminRecord?.user_id || session.user?.id;

  if (!session.authorized || !adminUserId) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, error: session.error || 'Acesso não autorizado' },
      403,
      cookiesToApply
    );
  }

  // 3. Extrair communicationId da URL / parâmetros
  const url = parseAdminRequestUrl(request);
  let communicationId = paramsId;

  if (!communicationId) {
    const queryId = request?.query?.id || request?.query?.communicationId || url.searchParams.get('id') || url.searchParams.get('communicationId');
    if (queryId) {
      communicationId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const cancelIdx = segments.indexOf('cancel');
      if (cancelIdx > 0) {
        communicationId = segments[cancelIdx - 1];
      }
    }
  }

  if (!communicationId || !isValidUuid(communicationId)) {
    return createAdminJsonResponse(
      { ok: false, error: 'ID de comunicação inválido' },
      400,
      session.newCookies
    );
  }

  // 4. Cliente Supabase exclusivo server-side com service_role
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

  try {
    const result = await cancelApprovedCommunication(serviceClient, {
      adminUserId,
      communicationId,
      now: new Date()
    });

    return createAdminJsonResponse(
      {
        ok: true,
        communication: result.communication,
        already_cancelled: !!result.already_cancelled
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao cancelar comunicação aprovada' },
      statusCode,
      session.newCookies
    );
  }
}

export default async function handler(req, res) {
  const response = await handlePostCancelApprovedCommunicationRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
