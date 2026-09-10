import { createClient } from '@supabase/supabase-js';
import {
  getRequestHeader,
  parseCookieHeader,
  isRequestSecure,
  serializeClearAdminCookies,
  createAdminJsonResponse,
} from '../../../server/admin/admin-auth-service.js';

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  const cookieHeader = getRequestHeader(request, 'cookie');
  const accessToken = parseCookieHeader(cookieHeader, 'lumyo_admin_access');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Tentar revogar explicitamente a sessão no Supabase Auth no servidor
  if (accessToken && supabaseUrl && supabaseServiceRoleKey) {
    try {
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await serviceClient.auth.admin.signOut(accessToken, 'global');
    } catch (err) {
      // Ignorar exceções de revogação para garantir que os cookies do browser são SEMPRE eliminados
    }
  }

  // 2. Garantir a eliminação dos dois cookies HttpOnly no browser
  const isSecure = isRequestSecure(request);
  const clearCookies = serializeClearAdminCookies(isSecure);

  return createAdminJsonResponse({ ok: true }, 200, clearCookies);
}

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
