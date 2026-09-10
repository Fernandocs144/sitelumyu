import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../_lib/env.js';
import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestUrl,
  parseAdminRequestJson,
} from '../../../../server/admin/admin-auth-service.js';
import { isValidUuid } from '../../../../server/admin/admin-lead-detail-service.js';
import { evaluateFollowUp } from '../../../../server/admin/admin-followup-engine.js';
import { recordFollowUpStateAction } from '../../../../server/admin/admin-followup-state-service.js';

export async function handlePostFollowUpStateRequest(request, paramsId = null) {
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
      const stateIdx = segments.indexOf('state');
      if (stateIdx > 0) {
        leadId = segments[stateIdx - 1];
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
  let body = {};
  try {
    body = await parseAdminRequestJson(request);
  } catch (err) {
    return createAdminJsonResponse(
      { ok: false, error: 'JSON de requisição inválido' },
      400,
      session.newCookies
    );
  }

  const { action, snoozed_until, note } = body || {};

  if (!action || !['ignored', 'snoozed', 'restored'].includes(action)) {
    return createAdminJsonResponse(
      { ok: false, error: 'Ação inválida. Deve ser "ignored", "snoozed" ou "restored".' },
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

  try {
    // Carregar contexto da lead
    const selectQuery = `
      id,
      name,
      email,
      company_name,
      pipeline_stage,
      lead_classification,
      last_interaction_at,
      next_step,
      created_at,
      updated_at,
      conversations (
        id,
        status,
        last_activity_at,
        updated_at
      ),
      calendar_bookings (
        id,
        status,
        start_time,
        end_time
      ),
      lead_tasks (
        id,
        title,
        status,
        priority,
        due_at,
        created_at
      )
    `;

    const { data: rawLead, error: leadErr } = await serviceClient
      .from('leads')
      .select(selectQuery)
      .eq('id', leadId)
      .single();

    if (leadErr || !rawLead) {
      return createAdminJsonResponse(
        { ok: false, error: 'Lead não encontrada' },
        404,
        session.newCookies
      );
    }

    const latestConv = (rawLead.conversations || []).sort((a, b) => {
      const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : (a.updated_at ? new Date(a.updated_at).getTime() : 0);
      const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : (b.updated_at ? new Date(b.updated_at).getTime() : 0);
      return bTime - aTime;
    })[0] || null;

    const context = {
      lead: {
        id: rawLead.id,
        name: rawLead.name,
        email: rawLead.email,
        company_name: rawLead.company_name,
        pipeline_stage: rawLead.pipeline_stage,
        lead_classification: rawLead.lead_classification,
        last_interaction_at: rawLead.last_interaction_at,
        next_step: rawLead.next_step,
        created_at: rawLead.created_at,
        updated_at: rawLead.updated_at
      },
      latestConversation: latestConv,
      bookings: rawLead.calendar_bookings || [],
      tasks: rawLead.lead_tasks || []
    };

    const now = new Date();
    const recommendation = evaluateFollowUp(context, now);

    if (recommendation.blocked) {
      return createAdminJsonResponse(
        { ok: false, error: `Não é possível alterar estado: Lead bloqueada (${recommendation.blocked_reason})` },
        422,
        session.newCookies
      );
    }

    if (!recommendation.needs_follow_up || !recommendation.reason_code) {
      return createAdminJsonResponse(
        { ok: false, error: 'Esta lead não possui uma recomendação de follow-up ativa no momento.' },
        422,
        session.newCookies
      );
    }

    const recordResult = await recordFollowUpStateAction(serviceClient, {
      adminUserId,
      leadId,
      action,
      snoozedUntil: snoozed_until,
      note,
      context,
      recommendation,
      now
    });

    return createAdminJsonResponse(
      {
        ok: true,
        effective_state: recordResult.effective_state,
        context_fingerprint: recordResult.context_fingerprint,
        event: recordResult.event
      },
      200,
      session.newCookies
    );
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return createAdminJsonResponse(
      { ok: false, error: err.message || 'Erro ao processar estado de follow-up' },
      statusCode,
      session.newCookies
    );
  }
}

export default async function handler(req, res) {
  const response = await handlePostFollowUpStateRequest(req);
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  return res.json(data);
}
