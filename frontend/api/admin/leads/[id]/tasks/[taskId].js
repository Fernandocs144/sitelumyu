import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../../_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
  parseAdminRequestJson,
} from '../../../../../server/admin/admin-auth-service.js';
import { isValidUuid } from '../../../../../server/admin/admin-lead-detail-service.js';
import { updateLeadTaskStatusInDatabase } from '../../../../../server/admin/admin-lead-tasks-service.js';

export async function handlePatchLeadTaskStatusRequest(request, paramsLeadId = null, paramsTaskId = null) {
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

  // 3. Extrair leadId e taskId da URL
  const url = parseAdminRequestUrl(request);
  let leadId = paramsLeadId || request?.query?.id || request?.query?.leadId;
  let taskId = paramsTaskId || request?.query?.taskId;

  if (!leadId || !taskId) {
    const segments = url.pathname.split('/').filter(Boolean);
    const tasksIdx = segments.indexOf('tasks');
    if (tasksIdx > 0 && tasksIdx < segments.length - 1) {
      leadId = leadId || segments[tasksIdx - 1];
      taskId = taskId || segments[tasksIdx + 1];
    }
  }

  if (!leadId || !isValidUuid(leadId)) {
    return createAdminJsonResponse(
      { ok: false, error: 'ID de lead inválido' },
      400,
      session.newCookies
    );
  }

  if (!taskId || !isValidUuid(taskId)) {
    return createAdminJsonResponse(
      { ok: false, error: 'ID de tarefa inválido' },
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

  if (!body || typeof body !== 'object' || !body.status) {
    return createAdminJsonResponse(
      { ok: false, error: 'O campo status é obrigatório' },
      400,
      session.newCookies
    );
  }

  if (!['open', 'completed'].includes(body.status)) {
    return createAdminJsonResponse(
      { ok: false, error: 'Estado de tarefa inválido. Valores permitidos: open, completed' },
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

  const adminUserId = session.adminRecord?.user_id || session.user?.id;

  try {
    const task = await updateLeadTaskStatusInDatabase(serviceClient, {
      leadId,
      taskId,
      status: body.status,
      adminUserId,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        task,
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao alterar estado da tarefa' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handlePatchLeadTaskStatusRequest(request);
  },
};
