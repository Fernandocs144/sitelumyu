import {
  verifyAdminSession,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
} from '../admin-auth-service.js';

export async function handleCheckRequest(request) {
  if (request.method !== 'GET') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  const session = await verifyAdminSession(request);
  const isSecure = isRequestSecure(request);

  if (!session.authenticated) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, authenticated: false, authorized: false, error: session.error || 'Não autenticado' },
      401,
      cookiesToApply
    );
  }

  if (!session.authorized) {
    const cookiesToApply = session.clearCookies ? serializeClearAdminCookies(isSecure) : null;
    return createAdminJsonResponse(
      { ok: false, authenticated: true, authorized: false, error: session.error || 'Acesso não autorizado' },
      403,
      cookiesToApply
    );
  }

  return createAdminJsonResponse(
    {
      ok: true,
      authenticated: true,
      authorized: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.adminRecord.role,
      },
    },
    200,
    session.newCookies
  );
}

export default {
  async fetch(request) {
    return handleCheckRequest(request);
  },
};
