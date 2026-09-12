import { loadLocalEnv } from '../../_lib/env.js';

function parseCookieHeader(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === cookieName) {
      return rest.join('=');
    }
  }
  return null;
}

export async function exchangeZohoCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const tokenUrl = 'https://accounts.zoho.eu/oauth/v2/token';
  const bodyParams = new URLSearchParams({
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    let sanitizedErr = 'Falha na comunicação com o servidor OAuth Zoho';
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) sanitizedErr = `Zoho OAuth Error: ${parsed.error}`;
    } catch (_) {}
    throw new Error(sanitizedErr);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Zoho OAuth Error: ${data.error}`);
  }

  return data;
}

export async function handleZohoCallbackRequest(request) {
  loadLocalEnv();

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { Allow: 'GET', 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    if (error) {
      return new Response(JSON.stringify({ success: false, error: 'Zoho authorization rejected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validação de CSRF State
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieState = parseCookieHeader(cookieHeader, 'lumyo_zoho_oauth_state');

    if (!state || !cookieState || state !== cookieState) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid state parameter (CSRF protection)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientId = String(process.env.ZOHO_CLIENT_ID ?? '').trim();
    const clientSecret = String(process.env.ZOHO_CLIENT_SECRET ?? '').trim();

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ success: false, error: 'Zoho OAuth service misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const redirectUri = process.env.ZOHO_REDIRECT_URI || 'https://www.lumyo.pt/api/integrations/zoho/callback';

    const tokenData = await exchangeZohoCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    if (!tokenData || !tokenData.refresh_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Refresh token não retornado pelo Zoho. Certifique-se que solicitou access_type=offline e prompt=consent.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const isSecure = url.protocol === 'https:' || process.env.VERCEL_ENV === 'production';
    const secureFlag = isSecure ? '; Secure' : '';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Autorização Zoho OAuth concluída com sucesso.',
        obtained_refresh_token: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `lumyo_zoho_oauth_state=; Path=/; HttpOnly; Max-Age=0${secureFlag}`,
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unexpected server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export default {
  async fetch(request) {
    return handleZohoCallbackRequest(request);
  },
};