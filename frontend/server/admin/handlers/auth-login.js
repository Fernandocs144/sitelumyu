import { createClient } from '@supabase/supabase-js';
import {
  isRequestSecure,
  serializeAdminCookies,
  serializeClearAdminCookies,
  createAdminJsonResponse,
  parseAdminRequestJson,
} from '../admin-auth-service.js';

export async function handleLoginRequest(request) {
  if (request.method !== 'POST') {
    return createAdminJsonResponse({ ok: false, error: 'Método não permitido' }, 405);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createAdminJsonResponse({ ok: false, error: 'Configuração de servidor incompleta' }, 500);
  }

  let body = {};
  try {
    body = await parseAdminRequestJson(request);
  } catch (err) {
    return createAdminJsonResponse({ ok: false, error: 'Corpo da requisição inválido' }, 400);
  }

  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return createAdminJsonResponse({ ok: false, error: 'Email e palavra-passe são obrigatórios' }, 400);
  }

  try {
    const isSecure = isRequestSecure(request);

    // 1. Autenticação via Supabase Auth
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData?.session || !authData?.user) {
      return createAdminJsonResponse({ ok: false, error: 'Credenciais inválidas' }, 401);
    }

    const user = authData.user;
    const { access_token: accessToken, refresh_token: refreshToken } = authData.session;

    // 2. Autorização explícita na tabela public.admin_users via service_role
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRecord, error: adminError } = await serviceClient
      .from('admin_users')
      .select('user_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      // Tentar revogar a sessão criada no Supabase Auth por utilizador não-admin
      try {
        await serviceClient.auth.admin.signOut(accessToken, 'global');
      } catch (revokeErr) {
        // Ignorar falhas de revogação secundária
      }

      const clearCookies = serializeClearAdminCookies(isSecure);
      return createAdminJsonResponse({ ok: false, error: 'Acesso não autorizado' }, 403, clearCookies);
    }

    // 3. Emitir ambos os Cookies HttpOnly de Sessão
    const cookies = serializeAdminCookies(accessToken, refreshToken, isSecure);

    return createAdminJsonResponse(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          role: adminRecord.role,
        },
      },
      200,
      cookies
    );
  } catch (err) {
    return createAdminJsonResponse({ ok: false, error: 'Erro ao processar autenticação' }, 500);
  }
}

export default {
  async fetch(request) {
    return handleLoginRequest(request);
  },
};
