import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getCommercialAgentPrompt } from './commercial-agent-prompt.js';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
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

async function insertMessageWithSequence(supabase, conversationId, messageType, senderRole, contentText) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data: maxSeqData, error: maxSeqError } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxSeqError) {
      console.error('Failed to query max sequence number', {
        code: maxSeqError.code || 'unknown',
      });
      return { success: false, error: maxSeqError };
    }

    const nextSeq = maxSeqData && maxSeqData.sequence_number ? Number(maxSeqData.sequence_number) + 1 : 1;

    const { data: insertedMsg, error: insertMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sequence_number: nextSeq,
        message_type: messageType,
        sender_role: senderRole,
        content: contentText,
        status: 'delivered',
      })
      .select('id, sequence_number')
      .single();

    if (!insertMsgError && insertedMsg) {
      return { success: true, data: insertedMsg };
    }

    if (insertMsgError && insertMsgError.code === '23505') {
      continue;
    }

    console.error('Failed to insert message', {
      code: insertMsgError?.code || 'unknown',
    });
    return { success: false, error: insertMsgError };
  }

  console.error('Failed to insert message after sequence retries', { code: 'max_retries_exceeded' });
  return { success: false, error: new Error('Max retries exceeded') };
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

  const requiredEnvs = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
  ];
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

  const cookieHeader = request.headers.get('cookie') || '';
  const token = parseCookieHeader(cookieHeader, 'lumyo_agent_session');

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return Response.json(
      {
        success: false,
        error: 'Session required',
        code: 'SESSION_REQUIRED',
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const { message, language } = body;

  if (typeof message !== 'string') {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length < 1 || cleanMessage.length > 2000) {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (language !== undefined && language !== 'pt' && language !== 'en') {
    return Response.json(
      {
        success: false,
        error: 'Invalid message',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const requestedLanguage = language === 'en' ? 'en' : 'pt';

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

    const tokenHash = await sha256Hex(token);
    const nowIso = new Date().toISOString();

    const { data: sessionData, error: sessionError } = await supabase
      .from('visitor_sessions')
      .update({ last_seen_at: nowIso })
      .eq('session_token_hash', tokenHash)
      .gt('expires_at', nowIso)
      .select('id, lead_id')
      .maybeSingle();

    if (sessionError) {
      console.error('Failed to validate visitor session', {
        code: sessionError.code || 'unknown',
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

    if (!sessionData) {
      return Response.json(
        {
          success: false,
          error: 'Session required',
          code: 'SESSION_REQUIRED',
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Resolver conversa activa
    let conversationId;
    let activeLanguage = requestedLanguage;

    const { data: existingConv, error: getConvError } = await supabase
      .from('conversations')
      .select('id, language')
      .eq('session_id', sessionData.id)
      .eq('status', 'active')
      .maybeSingle();

    if (getConvError) {
      console.error('Failed to query active conversation', {
        code: getConvError.code || 'unknown',
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

    if (existingConv) {
      conversationId = existingConv.id;
      activeLanguage = existingConv.language;
    } else {
      const { data: newConv, error: insertConvError } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionData.id,
          lead_id: sessionData.lead_id || null,
          status: 'active',
          commercial_stage: 'discovery',
          language: requestedLanguage,
        })
        .select('id, language')
        .single();

      if (insertConvError) {
        if (insertConvError.code === '23505') {
          const { data: retryConv, error: retryConvError } = await supabase
            .from('conversations')
            .select('id, language')
            .eq('session_id', sessionData.id)
            .eq('status', 'active')
            .single();

          if (!retryConvError && retryConv) {
            conversationId = retryConv.id;
            activeLanguage = retryConv.language;
          } else {
            console.error('Failed to resolve active conversation after unique conflict', {
              code: retryConvError?.code || 'unknown',
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
        } else {
          console.error('Failed to insert conversation', {
            code: insertConvError.code || 'unknown',
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
      } else if (newConv) {
        conversationId = newConv.id;
        activeLanguage = newConv.language;
      }
    }

    // Persistir mensagem do visitante
    const visitorRes = await insertMessageWithSequence(
      supabase,
      conversationId,
      'visitor_text',
      'visitor',
      cleanMessage
    );

    if (!visitorRes.success) {
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

    // Obter últimas 12 mensagens para histórico da OpenAI (ordem cronológica ASC)
    const { data: rawHistory, error: historyError } = await supabase
      .from('messages')
      .select('message_type, content, sequence_number')
      .eq('conversation_id', conversationId)
      .in('message_type', ['visitor_text', 'agent_text'])
      .order('sequence_number', { ascending: false })
      .limit(12);

    if (historyError) {
      console.error('Failed to query message history', {
        code: historyError.code || 'unknown',
      });
    }

    let history = [];
    if (!historyError && rawHistory) {
      const sortedHistory = [...rawHistory].reverse();
      history = sortedHistory.map((msg) => ({
        role: msg.message_type === 'visitor_text' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Remover mensagens assistant iniciais caso existam
      while (history.length > 0 && history[0].role === 'assistant') {
        history.shift();
      }
    }

    let replyText = null;

    const isHistoryValid =
      !historyError &&
      history.length >= 1 &&
      history[history.length - 1].role === 'user' &&
      !history.some((msg) => msg.role !== 'user' && msg.role !== 'assistant');

    if (isHistoryValid) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 15000,
          maxRetries: 1,
        });

        const instructions = getCommercialAgentPrompt(activeLanguage);

        const response = await openai.responses.create({
          model: process.env.OPENAI_MODEL,
          instructions: instructions,
          input: history,
          reasoning: { effort: 'none' },
          text: { verbosity: 'low' },
          max_output_tokens: 500,
          store: false,
        });

        if (response?.status === 'completed' && typeof response?.output_text === 'string') {
          const rawOutput = response.output_text;
          const trimmedOutput = rawOutput.trim();
          if (trimmedOutput.length >= 1 && trimmedOutput.length <= 4000) {
            replyText = trimmedOutput;
          }
        }
      } catch (error) {
        console.error('OpenAI response failure', {
          name: error?.name || 'Error',
          status: error?.status || error?.statusCode || undefined,
          code: error?.code || undefined,
        });
      }
    }

    // Fallback de contingência caso a OpenAI não devolva resposta válida ou o histórico seja inválido
    if (!replyText) {
      replyText =
        activeLanguage === 'en'
          ? 'I cannot generate a complete response right now. Tell me whether you are looking for Premium Websites, Automation, AI Solutions, or Digital Growth, and I will help you explore that area.'
          : 'Neste momento não consigo gerar uma resposta completa. Diz-me se procuras Websites Premium, Automação, Soluções de IA ou Crescimento Digital e ajudo-te a explorar essa área.';
    }

    // Persistir resposta do agente
    const agentRes = await insertMessageWithSequence(
      supabase,
      conversationId,
      'agent_text',
      'agent',
      replyText
    );

    if (!agentRes.success) {
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

    // Atualizar last_activity_at da conversa
    const { error: updateConvError } = await supabase
      .from('conversations')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateConvError) {
      console.error('Failed to update conversation activity', {
        code: updateConvError.code || 'unknown',
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
          reply: replyText,
          language: activeLanguage,
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
  } catch (error) {
    console.error('Unexpected message endpoint failure', {
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
