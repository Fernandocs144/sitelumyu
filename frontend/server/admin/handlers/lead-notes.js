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
import { createLeadNoteInDatabase } from '../admin-lead-notes-service.js';

export async function handlePostLeadNotesRequest(request, paramsId = null) {
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
      const notesIdx = segments.indexOf('notes');
      if (notesIdx > 0) {
        leadId = segments[notesIdx - 1];
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

  if (!body || typeof body !== 'object' || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return createAdminJsonResponse(
      { ok: false, error: 'O conteúdo da nota deve ser um texto não vazio' },
      400,
      session.newCookies
    );
  }

  if (body.content.length > 5000) {
    return createAdminJsonResponse(
      { ok: false, error: 'O conteúdo da nota não pode ter mais de 5000 caracteres' },
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

  const createdBy = session.adminRecord?.user_id || session.user?.id;

  try {
    const note = await createLeadNoteInDatabase(serviceClient, {
      leadId,
      content: body.content,
      createdBy,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        note,
      },
      201,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao criar nota da lead' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handlePostLeadNotesRequest(request);
  },
};
