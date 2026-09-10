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
  fetchAdminConversationDetailFromDatabase,
} from '../../../server/admin/admin-conversation-detail-service.js';

export async function handleGetConversationDetailRequest(request, paramsId = null) {
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

  // 2. Extrair ID da conversa da URL
  const url = parseAdminRequestUrl(request);
  let conversationId = paramsId;

  if (!conversationId) {
    const queryId = request?.query?.id || request?.query?.conversationId || url.searchParams.get('id') || url.searchParams.get('conversationId');
    if (queryId) {
      conversationId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment !== 'conversations' && lastSegment !== 'conversation-detail') {
        conversationId = lastSegment;
      }
    }
  }

  if (!conversationId || !isValidUuid(conversationId)) {
    return createAdminJsonResponse({ ok: false, error: 'ID de conversa inválido' }, 400);
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

  // 4. Obter detalhe da conversa e mensagens
  try {
    const { conversation, messages } = await fetchAdminConversationDetailFromDatabase(serviceClient, conversationId);

    return createAdminJsonResponse(
      {
        ok: true,
        conversation,
        messages,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao obter detalhe da conversa' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleGetConversationDetailRequest(request);
  },
};
