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
import { isValidUuid } from '../admin-lead-detail-service.js';
import { dispatchApprovedFollowUpCommunication } from '../admin-followup-dispatch-service.js';

export async function handlePostFollowUpSendRequest(request, paramsId = null) {
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

  // 3. Extrair approvedCommunicationId da URL / parâmetros
  const url = parseAdminRequestUrl(request);
  let communicationId = paramsId;

  if (!communicationId) {
    const queryId = request?.query?.id || request?.query?.communicationId || url.searchParams.get('id') || url.searchParams.get('communicationId');
    if (queryId) {
      communicationId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const sendIdx = segments.indexOf('send');
      if (sendIdx > 0) {
        communicationId = segments[sendIdx - 1];
      }
    }
  }

  if (!communicationId || !isValidUuid(communicationId)) {
    return createAdminJsonResponse(
      { ok: false, error: 'ID de comunicação aprovada inválido' },
      400,
      session.newCookies
    );
  }

  // 4. Parse opcional do corpo da requisição (provider, simulateMode)
  let bodyPayload = {};
  try {
    bodyPayload = await parseAdminRequestJson(request);
  } catch (err) {
    // Se o corpo for vazio ou inválido, utiliza defaults
  }

  const provider = bodyPayload.provider === 'fake' ? 'fake' : 'resend';
  const simulateMode = bodyPayload.simulateMode || 'accepted';

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

  try {
    const result = await dispatchApprovedFollowUpCommunication(serviceClient, {
      adminUserId,
      approvedCommunicationId: communicationId,
      provider,
      simulateMode,
      now: new Date()
    });

    return createAdminJsonResponse(
      {
        ok: true,
        message: 'Email disparado com sucesso e aceite pelo provider.',
        dispatch: result.dispatch
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      {
        ok: false,
        error: err.message || 'Erro ao processar disparo de email',
        errorCode: err.errorCode || 'DISPATCH_ERROR',
        dispatch: err.dispatch || null
      },
      statusCode,
      session.newCookies
    );
  }
}

export default async function handler(req, res) {
  const response = await handlePostFollowUpSendRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
