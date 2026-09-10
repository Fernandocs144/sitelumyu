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
import { createLeadTaskInDatabase } from '../admin-lead-tasks-service.js';

export async function handlePostLeadTasksRequest(request, paramsId = null) {
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

  // 3. Extrair leadId da URL
  const url = parseAdminRequestUrl(request);
  let leadId = paramsId;

  if (!leadId) {
    const queryId = request?.query?.id || request?.query?.leadId || url.searchParams.get('id') || url.searchParams.get('leadId');
    if (queryId) {
      leadId = queryId;
    } else {
      const segments = url.pathname.split('/').filter(Boolean);
      const tasksIdx = segments.indexOf('tasks');
      if (tasksIdx > 0) {
        leadId = segments[tasksIdx - 1];
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

  if (!body || typeof body !== 'object') {
    return createAdminJsonResponse(
      { ok: false, error: 'O corpo da requisição é obrigatório' },
      400,
      session.newCookies
    );
  }

  const { title, priority, due_at, assigned_to } = body;

  if (typeof title !== 'string' || title.trim().length === 0) {
    return createAdminJsonResponse(
      { ok: false, error: 'O título da tarefa deve ser um texto não vazio' },
      400,
      session.newCookies
    );
  }

  if (title.length > 255) {
    return createAdminJsonResponse(
      { ok: false, error: 'O título da tarefa não pode ter mais de 255 caracteres' },
      400,
      session.newCookies
    );
  }

  if (priority && !['low', 'normal', 'high'].includes(priority)) {
    return createAdminJsonResponse(
      { ok: false, error: 'Prioridade inválida. Valores permitidos: low, normal, high' },
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

  // Se assigned_to for fornecido pelo browser, validar se é um admin válido
  let targetAssignedTo = adminUserId;
  if (assigned_to) {
    if (!isValidUuid(assigned_to)) {
      return createAdminJsonResponse(
        { ok: false, error: 'ID de utilizador responsável (assigned_to) inválido' },
        400,
        session.newCookies
      );
    }
    const { data: targetAdmin, error: adminErr } = await serviceClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', assigned_to)
      .maybeSingle();

    if (adminErr || !targetAdmin) {
      return createAdminJsonResponse(
        { ok: false, error: 'O utilizador responsável especificado não é um administrador autorizado' },
        400,
        session.newCookies
      );
    }
    targetAssignedTo = targetAdmin.user_id;
  }

  try {
    const task = await createLeadTaskInDatabase(serviceClient, {
      leadId,
      title,
      priority: priority || 'normal',
      dueAt: due_at || null,
      assignedTo: targetAssignedTo,
      createdBy: adminUserId,
    });

    return createAdminJsonResponse(
      {
        ok: true,
        task,
      },
      201,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao criar tarefa comercial' },
      statusCode,
      session.newCookies
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handlePostLeadTasksRequest(request);
  },
};
