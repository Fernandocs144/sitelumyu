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
import { approveFollowUpCommunication } from '../admin-followup-approval-service.js';

export async function handlePostFollowUpApproveRequest(request, paramsId = null) {
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

  // 3. Extrair leadId da URL / parâmetros
  const url = parseAdminRequestUrl(request);
  let leadId = paramsId;

  if (!leadId) {
    const queryId = request?.query?.id || request?.query?.leadId || url.searchParams.get('id') || url.searchParams.get('leadId');
    if (queryId) {
      leadId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const approveIdx = segments.indexOf('approve');
      if (approveIdx > 0) {
        leadId = segments[approveIdx - 1];
      } else {
        const followUpsIdx = segments.indexOf('follow-ups');
        if (followUpsIdx >= 0 && followUpsIdx < segments.length - 1) {
          leadId = segments[followUpsIdx + 1];
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

  // 4. Parse do corpo da requisição
  let bodyPayload = {};
  try {
    bodyPayload = await parseAdminRequestJson(request);
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: 'JSON de requisição inválido' },
      400,
      session.newCookies
    );
  }

  const { subject, body, generation_source, prompt_version } = bodyPayload || {};

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
    const result = await approveFollowUpCommunication(serviceClient, {
      adminUserId,
      leadId,
      body,
      subject,
      generationSource: generation_source || 'manual',
      promptVersion: prompt_version || null,
      now: new Date()
    });

    return createAdminJsonResponse(
      {
        ok: true,
        communication: result.communication,
        context_fingerprint: result.context_fingerprint
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao processar aprovação de comunicação' },
      statusCode,
      session.newCookies
    );
  }
}

export default async function handler(req, res) {
  const response = await handlePostFollowUpApproveRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
