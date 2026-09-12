import crypto from 'crypto';
import { loadLocalEnv } from '../../_lib/env.js';

export function parseCookieHeader(cookieHeader, cookieName) {
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

export function buildZohoAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'ZohoMail.accounts.READ,ZohoMail.folders.READ,ZohoMail.messages.READ',
    redirect_uri: redirectUri,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  return `https://accounts.zoho.eu/oauth/v2/auth?${params.toString()}`;
}

export async function handleZohoAuthorizeRequest(request) {
  loadLocalEnv();

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { Allow: 'GET', 'Content-Type': 'application/json' },
    });
  }

  const clientId = String(process.env.ZOHO_CLIENT_ID ?? '').trim();
  if (!clientId) {
    return new Response(JSON.stringify({ success: false, error: 'Zoho OAuth service misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reqUrl = new URL(request.url);
  const redirectUri = process.env.ZOHO_REDIRECT_URI || 'https://www.lumyo.pt/api/integrations/zoho/callback';

  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = buildZohoAuthUrl({ clientId, redirectUri, state });

  const cookieHeader = `lumyo_zoho_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': cookieHeader,
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request) {
    return handleZohoAuthorizeRequest(request);
  },
};
