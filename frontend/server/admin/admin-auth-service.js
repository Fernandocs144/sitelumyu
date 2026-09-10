import { createClient } from '@supabase/supabase-js';

export function parseCookieHeader(cookieHeader, cookieName) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === cookieName) {
      return rest.join('=');
    }
  }
  return null;
}

/**
 * Utilitário central para extração segura de cabeçalhos HTTP de requisições,
 * suportando a especificação Web Fetch API (Headers.get), o modelo Node/Vercel (req.headers object)
 * e objetos mock de teste.
 *
 * @param {Object} request Requisição (Web Request ou Node req)
 * @param {string} headerName Nome do cabeçalho
 * @returns {string} Valor do cabeçalho ou string vazia ''
 */
export function getRequestHeader(request, headerName) {
  if (!request || !headerName) return '';
  const lowerName = headerName.toLowerCase();

  // 1. Instância Web Fetch API Standard (possui método .get)
  if (request.headers && typeof request.headers.get === 'function') {
    try {
      const val = request.headers.get(headerName) || request.headers.get(lowerName);
      if (val) return val;
    } catch (err) {
      // Fallback gracioso se .get() falhar
    }
  }

  // 2. Objeto Node.js http.IncomingMessage / NextApiRequest (req.headers)
  if (request.headers && typeof request.headers === 'object') {
    const headersObj = request.headers;
    const directVal = headersObj[headerName] || headersObj[lowerName];
    if (directVal !== undefined && directVal !== null) {
      return Array.isArray(directVal) ? directVal.join('; ') : String(directVal);
    }
    for (const key of Object.keys(headersObj)) {
      if (key.toLowerCase() === lowerName) {
        const val = headersObj[key];
        return Array.isArray(val) ? val.join('; ') : String(val || '');
      }
    }
  }

  return '';
}

/**
 * Utilitário central para normalização e parsing seguro do URL da requisição.
 * Suporta Web Fetch Request (URL absoluto) e Node/Vercel IncomingMessage (URL relativo).
 *
 * @param {Object|string} request Requisição (Web Request, Node req ou string de URL)
 * @returns {URL} Instância de URL pronta para extração de pathname e searchParams
 */
export function parseAdminRequestUrl(request) {
  const rawUrl = typeof request === 'string' ? request : (request?.url || '/');

  try {
    return new URL(rawUrl);
  } catch (err) {
    const host = getRequestHeader(request, 'host') || 'localhost';
    const protocol = getRequestHeader(request, 'x-forwarded-proto') || 'http';
    try {
      return new URL(rawUrl, `${protocol}://${host}`);
    } catch (fallbackErr) {
      return new URL(rawUrl, 'http://localhost');
    }
  }
}

/**
 * Utilitário central para leitura e parsing seguro de corpo JSON em requisições,
 * com suporte nativo a Web Fetch Request, Node/Vercel req object (req.body objeto/string/Buffer)
 * e Readable Streams.
 *
 * @param {Object} request Requisição (Web Request ou Node req)
 * @returns {Promise<Object>} Objeto JSON parseado
 */
export async function parseAdminRequestJson(request) {
  if (!request) return {};

  // 1. Se req.body já foi parseado para um objeto literal JS (ex: Vercel / Next.js / Express body parser)
  if (request.body && typeof request.body === 'object' && Object.prototype.toString.call(request.body) === '[object Object]') {
    return request.body;
  }

  // 2. Se req.body for uma string JSON
  if (typeof request.body === 'string') {
    const trimmed = request.body.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed);
  }

  // 3. Se req.body for um Buffer ou Uint8Array
  if (Buffer.isBuffer(request.body) || request.body instanceof Uint8Array) {
    const str = Buffer.from(request.body).toString('utf-8').trim();
    if (!str) return {};
    return JSON.parse(str);
  }

  // 4. Se for uma instância Web Fetch API Request com método .json()
  if (typeof request.json === 'function') {
    try {
      return await request.json();
    } catch (err) {
      if (typeof request.clone === 'function') {
        try {
          const clonedText = await request.clone().text();
          if (!clonedText || !clonedText.trim()) {
            return {};
          }
        } catch (cloneErr) {
          // Ignorar erro ao clonar
        }
      }
      throw err;
    }
  }

  // 5. Se for uma instância Web Fetch API com apenas .text()
  if (typeof request.text === 'function') {
    const text = await request.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  }

  // 6. Se for um stream legível Node.js (http.IncomingMessage) sem body pré-carregado
  if (typeof request[Symbol.asyncIterator] === 'function' || typeof request.on === 'function') {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawText = Buffer.concat(chunks).toString('utf-8').trim();
    if (!rawText) return {};
    return JSON.parse(rawText);
  }

  return {};
}

export function isRequestSecure(request) {
  if (!request) return process.env.NODE_ENV === 'production';
  const host = getRequestHeader(request, 'host');
  const proto = getRequestHeader(request, 'x-forwarded-proto');
  return proto === 'https' || (process.env.NODE_ENV === 'production' && !host.includes('localhost'));
}

export function serializeAdminCookies(accessToken, refreshToken, isSecure) {
  const accessParts = [
    `lumyo_admin_access=${accessToken}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=3600', // 1 hora
  ];
  const refreshParts = [
    `lumyo_admin_refresh=${refreshToken}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/api/admin',
    'Max-Age=604800', // 7 dias (validade padrao de refresh no Supabase Auth)
  ];

  if (isSecure) {
    accessParts.push('Secure');
    refreshParts.push('Secure');
  }

  return [accessParts.join('; '), refreshParts.join('; ')];
}

export function serializeClearAdminCookies(isSecure) {
  const accessParts = [
    'lumyo_admin_access=',
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  const refreshParts = [
    'lumyo_admin_refresh=',
    'HttpOnly',
    'SameSite=Lax',
    'Path=/api/admin',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];

  if (isSecure) {
    accessParts.push('Secure');
    refreshParts.push('Secure');
  }

  return [accessParts.join('; '), refreshParts.join('; ')];
}

export function createAdminJsonResponse(body, status = 200, cookieArray = null) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Type', 'application/json');

  if (Array.isArray(cookieArray)) {
    cookieArray.forEach((cookieStr) => {
      headers.append('Set-Cookie', cookieStr);
    });
  }

  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Middleware/helper server-side para verificar autenticação e autorização de administrador
 * com suporte a silent server-side refresh de token de acesso.
 *
 * @param {Request} request
 * @returns {Promise<{ authenticated: boolean, authorized: boolean, status: number, error?: string, user?: object, adminRecord?: object, newCookies?: string[]|null, clearCookies?: boolean }>}
 */
export async function verifyAdminSession(request) {
  const cookieHeader = getRequestHeader(request, 'cookie');
  const accessToken = parseCookieHeader(cookieHeader, 'lumyo_admin_access');
  const refreshToken = parseCookieHeader(cookieHeader, 'lumyo_admin_refresh');

  if (!accessToken && !refreshToken) {
    return {
      authenticated: false,
      authorized: false,
      status: 401,
      error: 'Não autenticado',
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      authenticated: false,
      authorized: false,
      status: 500,
      error: 'Configuração de servidor incompleta',
    };
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let user = null;
    let newSession = null;

    // 1. Tentar validar o Access Token atual
    if (accessToken) {
      const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
      if (!userError && userData?.user) {
        user = userData.user;
      }
    }

    // 2. Se o Access Token expirou ou é inválido, tentar renovar com o Refresh Token
    if (!user && refreshToken) {
      const { data: refreshData, error: refreshError } = await authClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData?.session && refreshData?.user) {
        user = refreshData.user;
        newSession = refreshData.session;
      }
    }

    // 3. Se nem o Access Token nem o Refresh Token foram válidos -> 401
    if (!user) {
      return {
        authenticated: false,
        authorized: false,
        status: 401,
        error: 'Sessão inválida ou expirada',
        clearCookies: true,
      };
    }

    // 4. Validar autorização explícita na tabela public.admin_users
    const { data: adminRecord, error: adminError } = await serviceClient
      .from('admin_users')
      .select('user_id, role, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return {
        authenticated: true,
        authorized: false,
        status: 403,
        error: 'Acesso não autorizado',
        user,
        clearCookies: true,
      };
    }

    // 5. Gerar novos cookies se a sessão tiver sido renovada
    let newCookies = null;
    if (newSession?.access_token && newSession?.refresh_token) {
      const isSecure = isRequestSecure(request);
      newCookies = serializeAdminCookies(newSession.access_token, newSession.refresh_token, isSecure);
    }

    return {
      authenticated: true,
      authorized: true,
      status: 200,
      user,
      adminRecord,
      newCookies,
    };
  } catch (err) {
    return {
      authenticated: false,
      authorized: false,
      status: 500,
      error: 'Erro interno ao validar sessão',
    };
  }
}
