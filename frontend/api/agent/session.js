import { createClient } from '@supabase/supabase-js';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSecureToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

async function hmacSha256(secret, data) {
  if (!secret || !data) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bufferToHex(signature);
}

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

function serializeSessionCookie(token, isSecure) {
  const parts = [
    `lumyo_agent_session=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=2592000',
  ];
  if (isSecure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function getVisitorIp(request) {
  const headers = request.headers;
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    const clientIp = ips[0].trim();
    if (clientIp) return clientIp;
  }
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }
  return null;
}

function getVisitorUserAgent(request) {
  const ua = request.headers.get('user-agent');
  if (ua && ua.trim()) {
    return ua.trim();
  }
  return null;
}

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return Response.json(
      {
        success: false,
        error: 'Method not allowed',
      },
      {
        status: 405,
        headers: {
          Allow: 'POST',
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'AGENT_HASH_SECRET'];
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

  if (missingEnvs.length > 0) {
    console.error(`Missing required environment variable(s): ${missingEnvs.join(', ')}`);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const cookieHeader = request.headers.get('cookie') || '';
    const existingToken = parseCookieHeader(cookieHeader, 'lumyo_agent_session');

    if (existingToken && /^[0-9a-f]{64}$/.test(existingToken)) {
      const tokenHash = await sha256Hex(existingToken);
      const resumedAt = new Date().toISOString();

      const {
        data: resumedSession,
        error: resumeError,
      } = await supabase
        .from('visitor_sessions')
        .update({ last_seen_at: resumedAt })
        .eq('session_token_hash', tokenHash)
        .gt('expires_at', resumedAt)
        .select('id, expires_at')
        .maybeSingle();

      if (resumeError) {
        console.error('Failed to resume visitor session', {
          code: resumeError.code || 'unknown',
        });

        return Response.json(
          {
            success: false,
            error: 'Internal server error',
          },
          {
            status: 500,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (resumedSession) {
        const { data: closedConversation, error: closedConversationError } = await supabase
          .from('conversations')
          .select('id')
          .eq('session_id', resumedSession.id)
          .eq('status', 'completed')
          .eq('primary_outcome', 'spam_detected')
          .limit(1)
          .maybeSingle();

        if (closedConversationError) {
          console.error('Failed to query closed commercial conversation', {
            code: closedConversationError.code || 'unknown',
          });

          return Response.json(
            {
              success: false,
              error: 'Internal server error',
            },
            {
              status: 500,
              headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/json',
              },
            }
          );
        }

        return Response.json(
          {
            success: true,
            data: {
              resumed: true,
              expiresAt: resumedSession.expires_at,
              chatClosed: Boolean(closedConversation),
              closureCode: closedConversation
                ? 'repeated_message_limit_reached'
                : null,
            },
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Criar nova sessão caso o cookie seja inexistente, inválido ou expirado
    const newToken = generateSecureToken();
    const newHash = await sha256Hex(newToken);

    const ip = getVisitorIp(request);
    const userAgent = getVisitorUserAgent(request);

    const ipHash = ip ? await hmacSha256(process.env.AGENT_HASH_SECRET, ip) : null;
    const userAgentHash = userAgent ? await hmacSha256(process.env.AGENT_HASH_SECRET, userAgent) : null;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('visitor_sessions').insert({
      session_token_hash: newHash,
      lead_id: null,
      expires_at: expiresAt,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
    });

    if (insertError) {
      const safeString = (val) => (typeof val === 'string' ? val.slice(0, 500) : null);
      console.error('Failed to insert visitor session', {
        name: safeString(insertError.name),
        code: safeString(insertError.code) || 'unknown',
        message: safeString(insertError.message),
        details: safeString(insertError.details),
        hint: safeString(insertError.hint),
        status: typeof insertError.status === 'number' ? insertError.status : null,
      });
      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const isProduction =
      process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    const setCookieHeader = serializeSessionCookie(newToken, isProduction);

    return Response.json(
      {
        success: true,
        data: {
          resumed: false,
          expiresAt: expiresAt,
          chatClosed: false,
          closureCode: null,
        },
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
          'Set-Cookie': setCookieHeader,
        },
      }
    );
  } catch (error) {
    console.error('Unexpected session endpoint failure', {
      name: error?.name || 'Error',
    });
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
