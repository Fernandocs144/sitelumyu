import { handleCheckRequest as handleAuthCheckRequest } from '../../server/admin/handlers/auth-check.js';
import { handleLoginRequest as handleAuthLoginRequest } from '../../server/admin/handlers/auth-login.js';
import { handleLogoutRequest as handleAuthLogoutRequest } from '../../server/admin/handlers/auth-logout.js';
import { handleGetBookingsRequest, handleBookingsRequest } from '../../server/admin/handlers/bookings.js';
import { handleGetConversationDetailRequest } from '../../server/admin/handlers/conversation-detail.js';
import { handleGetConversationsRequest } from '../../server/admin/handlers/conversations.js';
import { handleGetDashboardRequest } from '../../server/admin/handlers/dashboard.js';
import { handleGetAdminFollowUpsRequest as handleGetFollowupsRequest } from '../../server/admin/handlers/followups.js';
import { handlePostFollowUpApproveRequest as handlePostApproveFollowupRequest } from '../../server/admin/handlers/followup-approve.js';
import { handlePostFollowUpDraftRequest as handlePostDraftFollowupRequest } from '../../server/admin/handlers/followup-draft.js';
import { handlePostFollowUpSendRequest as handlePostSendFollowupRequest } from '../../server/admin/handlers/followup-send.js';
import { handlePostFollowUpStateRequest as handlePatchFollowupStateRequest } from '../../server/admin/handlers/followup-state.js';
import { handlePostCancelApprovedCommunicationRequest } from '../../server/admin/handlers/approved-communication-cancel.js';
import { handleGetLeadsRequest } from '../../server/admin/handlers/leads.js';
import { handleGetLeadDetailRequest } from '../../server/admin/handlers/lead-detail.js';
import { handlePostLeadNotesRequest } from '../../server/admin/handlers/lead-notes.js';
import { handlePatchLeadPipelineRequest } from '../../server/admin/handlers/lead-pipeline.js';
import { handlePostLeadTasksRequest } from '../../server/admin/handlers/lead-tasks.js';
import { handlePatchLeadTaskStatusRequest } from '../../server/admin/handlers/lead-task-status.js';
import { handleGetPipelineRequest } from '../../server/admin/handlers/pipeline.js';
import { handleGetTasksRequest } from '../../server/admin/handlers/tasks.js';
import { createAdminJsonResponse, parseAdminRequestUrl } from '../../server/admin/admin-auth-service.js';

export async function handleAdminRouteRequest(request) {
  let segments = [];
  if (Array.isArray(request?.query?.route)) {
    segments = request.query.route;
  } else {
    const url = parseAdminRequestUrl(request);
    const pathname = url.pathname;
    const adminPrefix = '/api/admin/';
    const idx = pathname.indexOf(adminPrefix);
    if (idx !== -1) {
      const subpath = pathname.substring(idx + adminPrefix.length);
      segments = subpath.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
    }
  }

  if (segments.length === 0) {
    return createAdminJsonResponse({ ok: false, error: 'Endpoint admin não encontrado' }, 404);
  }

  const [first, second, third, fourth] = segments;

  // 1. Autenticação (/api/admin/auth/*)
  if (first === 'auth') {
    if (second === 'check') return handleAuthCheckRequest(request);
    if (second === 'login') return handleAuthLoginRequest(request);
    if (second === 'logout') return handleAuthLogoutRequest(request);
  }

  // 2. Visão Geral e Métricas
  if (first === 'dashboard' && segments.length === 1) {
    return handleGetDashboardRequest(request);
  }

  if (first === 'bookings' && segments.length === 1) {
    return handleBookingsRequest(request);
  }

  if (first === 'pipeline' && segments.length === 1) {
    return handleGetPipelineRequest(request);
  }

  if (first === 'tasks' && segments.length === 1) {
    return handleGetTasksRequest(request);
  }

  // 3. Conversas
  if (first === 'conversations') {
    if (segments.length === 1) {
      return handleGetConversationsRequest(request);
    }
    if (segments.length === 2) {
      return handleGetConversationDetailRequest(request, second);
    }
  }

  if (first === 'conversation-detail' && segments.length === 1) {
    return handleGetConversationDetailRequest(request);
  }

  // 4. Leads
  if (first === 'leads') {
    if (segments.length === 1) {
      return handleGetLeadsRequest(request);
    }
    if (segments.length === 2) {
      return handleGetLeadDetailRequest(request, second);
    }
    if (segments.length === 3 && third === 'notes') {
      return handlePostLeadNotesRequest(request, second);
    }
    if (segments.length === 3 && third === 'pipeline') {
      return handlePatchLeadPipelineRequest(request, second);
    }
    if (segments.length === 3 && third === 'tasks') {
      return handlePostLeadTasksRequest(request, second);
    }
    if (segments.length === 4 && third === 'tasks') {
      return handlePatchLeadTaskStatusRequest(request, second, fourth);
    }
  }

  if (first === 'leads-detail' && segments.length === 1) {
    return handleGetLeadDetailRequest(request);
  }

  // 5. Follow-ups
  if (first === 'follow-ups' || first === 'followups') {
    if (segments.length === 1) {
      return handleGetFollowupsRequest(request);
    }
    if (third === 'draft' || second === 'draft') {
      return handlePostDraftFollowupRequest(request, third === 'draft' ? second : null);
    }
    if (third === 'approve' || second === 'approve') {
      return handlePostApproveFollowupRequest(request, third === 'approve' ? second : null);
    }
    if (third === 'send' || second === 'send') {
      return handlePostSendFollowupRequest(request, third === 'send' ? second : null);
    }
    if (third === 'state' || second === 'state') {
      return handlePatchFollowupStateRequest(request, third === 'state' ? second : null);
    }
  }

  // 6. Comunicações Aprovadas
  if (first === 'approved-communications') {
    if (segments.length === 3 && third === 'cancel') {
      return handlePostCancelApprovedCommunicationRequest(request, second);
    }
    if (segments.length === 3 && third === 'send') {
      return handlePostSendFollowupRequest(request, second);
    }
  }

  return createAdminJsonResponse({ ok: false, error: 'Endpoint admin não encontrado' }, 404);
}

export async function handleAdminRequest(request) {
  return handleAdminRouteRequest(request);
}

export default async function handler(req, res) {
  if (req && typeof req === 'object' && typeof res?.status === 'function') {
    const webResponse = await handleAdminRouteRequest(req);
    res.status(webResponse.status);
    webResponse.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    const text = await webResponse.text();
    res.send(text);
    return;
  }
  return handleAdminRouteRequest(req);
}

handler.fetch = async function (request) {
  return handleAdminRouteRequest(request);
};
