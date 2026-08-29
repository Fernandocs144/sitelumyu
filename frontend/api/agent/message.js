import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getCommercialAgentPrompt } from './commercial-agent-prompt.js';
import { commercialAgentResponseSchema } from './commercial-agent-response-schema.js';
import { normalizeBudget } from './budget-normalizer.js';

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

const ALLOWED_SERVICES = ['websites', 'automation', 'ai', 'digital_growth'];
const ALLOWED_WEBSITE_VARIANTS = [
  'landing_page',
  'institutional_website',
  'custom_website',
  'ecommerce',
];

function sanitizeQualification(qual) {
  if (!qual || typeof qual !== 'object') return null;

  const sanitizeString = (val, maxLen) => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (trimmed.length < 1 || trimmed.length > maxLen) return null;
    return trimmed;
  };

  const primaryService = ALLOWED_SERVICES.includes(qual.primary_service)
    ? qual.primary_service
    : null;

  const serviceVariant = ALLOWED_WEBSITE_VARIANTS.includes(qual.service_variant)
    ? qual.service_variant
    : null;

  let secondaryServices = [];
  if (Array.isArray(qual.secondary_services)) {
    const validSet = new Set();
    for (const item of qual.secondary_services) {
      if (ALLOWED_SERVICES.includes(item) && item !== primaryService) {
        validSet.add(item);
      }
    }
    secondaryServices = Array.from(validSet);
  }

  const name = sanitizeString(qual.name, 120);

  let email = sanitizeString(qual.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = null;
  }

  const companyName = sanitizeString(qual.company_name, 120);

  let websiteUrl = null;
  if (typeof qual.website_url === 'string') {
    const rawUrl = qual.website_url.trim();
    if (rawUrl.length >= 1 && rawUrl.length <= 250) {
      try {
        const parsedUrl = new URL(rawUrl);
        if (
          (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
          parsedUrl.hostname
        ) {
          websiteUrl = rawUrl;
        }
      } catch {
        websiteUrl = null;
      }
    }
  }

  const needDescription = sanitizeString(qual.need_description, 2000);
  const operationalImpact = sanitizeString(qual.operational_impact, 1000);
  const timeline = sanitizeString(qual.timeline, 50);
  const decisionInvolvement = sanitizeString(qual.decision_involvement, 50);
  const statedBudgetRaw = sanitizeString(qual.stated_budget_raw, 200);

  return {
    primary_service: primaryService,
    service_variant: serviceVariant,
    secondary_services: secondaryServices,
    name,
    email,
    company_name: companyName,
    website_url: websiteUrl,
    need_description: needDescription,
    operational_impact: operationalImpact,
    timeline,
    decision_involvement: decisionInvolvement,
    stated_budget_raw: statedBudgetRaw,
  };
}

async function deleteCandidateLead(supabase, candidateId) {
  if (!candidateId) return false;
  const { error: deleteError } = await supabase
    .from('leads')
    .delete()
    .eq('id', candidateId);

  if (deleteError) {
    console.error('Failed to delete candidate lead', {
      code: deleteError.code || 'unknown',
    });
    return false;
  }
  return true;
}

async function updateExistingLead(supabase, leadId, activeLanguage, cleanQualification) {
  const { data: currentLead, error: currentLeadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (currentLeadError || !currentLead) {
    console.error('Failed to read existing lead qualification', {
      code: currentLeadError?.code || 'not_found',
    });
    return false;
  }

  const updatePayload = {
    language: activeLanguage,
    last_interaction_at: new Date().toISOString(),
  };

  if (cleanQualification.primary_service) {
    updatePayload.primary_service = cleanQualification.primary_service;
  }

  const targetPrimaryService = updatePayload.primary_service || currentLead?.primary_service;

  if (targetPrimaryService === 'websites') {
    if (cleanQualification.service_variant) {
      updatePayload.service_variant = cleanQualification.service_variant;
    }
  } else if (updatePayload.primary_service && updatePayload.primary_service !== 'websites') {
    updatePayload.service_variant = null;
  }

  if (cleanQualification.secondary_services && cleanQualification.secondary_services.length > 0) {
    const existingSecondary = Array.isArray(currentLead?.secondary_services) ? currentLead.secondary_services : [];
    const mergedSet = new Set([...existingSecondary, ...cleanQualification.secondary_services]);
    if (targetPrimaryService) {
      mergedSet.delete(targetPrimaryService);
    }
    updatePayload.secondary_services = Array.from(mergedSet);
  }

  if (cleanQualification.name) updatePayload.name = cleanQualification.name;
  if (cleanQualification.email) updatePayload.email = cleanQualification.email;
  if (cleanQualification.company_name) updatePayload.company_name = cleanQualification.company_name;
  if (cleanQualification.website_url) updatePayload.website_url = cleanQualification.website_url;
  if (cleanQualification.need_description) updatePayload.need_description = cleanQualification.need_description;
  if (cleanQualification.operational_impact) updatePayload.operational_impact = cleanQualification.operational_impact;
  if (cleanQualification.timeline) updatePayload.timeline = cleanQualification.timeline;
  if (cleanQualification.decision_involvement) updatePayload.decision_involvement = cleanQualification.decision_involvement;

  // NORMALIZAÇÃO DO ORÇAMENTO QUANDO STATED_BUDGET_RAW FOI FORNECIDO NO TURNO
  if (typeof cleanQualification.stated_budget_raw === 'string' && cleanQualification.stated_budget_raw.trim().length > 0) {
    const rawText = cleanQualification.stated_budget_raw.trim();
    const effectivePrimaryService = targetPrimaryService || null;
    const norm = normalizeBudget(rawText, effectivePrimaryService);

    updatePayload.stated_budget_raw = rawText;
    updatePayload.stated_budget_min = norm.min;
    updatePayload.stated_budget_max = norm.max;
    updatePayload.stated_budget_currency = norm.currency;
    updatePayload.stated_budget_period = norm.period;
    updatePayload.budget_normalization_status = norm.status;
    updatePayload.budget_normalization_source = norm.source;
  }

  const { error: updateErr } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (updateErr) {
    console.error('Failed to update lead qualification', { code: updateErr.code || 'unknown' });
    return false;
  }

  return true;
}

async function linkConversationToLead(supabase, conversationId, leadId) {
  if (!conversationId || !leadId) return;
  const { error: convUpdateErr } = await supabase
    .from('conversations')
    .update({ lead_id: leadId })
    .eq('id', conversationId);

  if (convUpdateErr) {
    console.error('Failed to link lead to conversation', { code: convUpdateErr.code || 'unknown' });
  }
}

async function processLeadQualification(supabase, sessionData, conversationId, activeLanguage, cleanQualification) {
  if (!cleanQualification) return;

  try {
    // 1. REVERIFICAÇÃO NA BASE DE DADOS PARA GARANTIR SE A SESSÃO JÁ TEM LEAD_ID
    let existingLeadId = sessionData.lead_id;

    if (!existingLeadId) {
      const { data: freshSession, error: freshSessionError } = await supabase
        .from('visitor_sessions')
        .select('lead_id')
        .eq('id', sessionData.id)
        .maybeSingle();

      if (freshSessionError) {
        console.error('Failed to refresh session lead link', {
          code: freshSessionError.code || 'unknown',
        });
        return;
      }

      if (freshSession?.lead_id) {
        existingLeadId = freshSession.lead_id;
        sessionData.lead_id = existingLeadId;
      }
    }

    if (existingLeadId) {
      // LEAD JÁ EXISTE: Atualizar via função reutilizável e reparar link da conversa
      await updateExistingLead(supabase, existingLeadId, activeLanguage, cleanQualification);
      await linkConversationToLead(supabase, conversationId, existingLeadId);
      return;
    }

    // 2. AVALIAR SE DEVE CRIAR NOVA LEAD CANDIDATA
    const hasSignal =
      Boolean(cleanQualification.need_description) ||
      Boolean(cleanQualification.timeline) ||
      Boolean(cleanQualification.stated_budget_raw) ||
      Boolean(cleanQualification.company_name) ||
      Boolean(cleanQualification.email) ||
      Boolean(cleanQualification.website_url);

    const shouldCreateLead = Boolean(cleanQualification.primary_service) && hasSignal;

    if (!shouldCreateLead) {
      return;
    }

    // CRIAR LEAD CANDIDATA
    const insertPayload = {
      language: activeLanguage,
      source: 'website_agent',
      last_interaction_at: new Date().toISOString(),
      ...(cleanQualification.primary_service ? { primary_service: cleanQualification.primary_service } : {}),
      ...(cleanQualification.primary_service === 'websites' && cleanQualification.service_variant ? { service_variant: cleanQualification.service_variant } : {}),
      ...(cleanQualification.secondary_services?.length ? { secondary_services: cleanQualification.secondary_services } : {}),
      ...(cleanQualification.name ? { name: cleanQualification.name } : {}),
      ...(cleanQualification.email ? { email: cleanQualification.email } : {}),
      ...(cleanQualification.company_name ? { company_name: cleanQualification.company_name } : {}),
      ...(cleanQualification.website_url ? { website_url: cleanQualification.website_url } : {}),
      ...(cleanQualification.need_description ? { need_description: cleanQualification.need_description } : {}),
      ...(cleanQualification.operational_impact ? { operational_impact: cleanQualification.operational_impact } : {}),
      ...(cleanQualification.timeline ? { timeline: cleanQualification.timeline } : {}),
      ...(cleanQualification.decision_involvement ? { decision_involvement: cleanQualification.decision_involvement } : {}),
    };

    if (typeof cleanQualification.stated_budget_raw === 'string' && cleanQualification.stated_budget_raw.trim().length > 0) {
      const rawText = cleanQualification.stated_budget_raw.trim();
      const norm = normalizeBudget(rawText, cleanQualification.primary_service || null);

      insertPayload.stated_budget_raw = rawText;
      insertPayload.stated_budget_min = norm.min;
      insertPayload.stated_budget_max = norm.max;
      insertPayload.stated_budget_currency = norm.currency;
      insertPayload.stated_budget_period = norm.period;
      insertPayload.budget_normalization_status = norm.status;
      insertPayload.budget_normalization_source = norm.source;
    }

    const { data: candidateLead, error: insertLeadErr } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertLeadErr || !candidateLead) {
      console.error('Failed to insert candidate lead', { code: insertLeadErr?.code || 'unknown' });
      return;
    }

    const candidateId = candidateLead.id;

    // 3. COMPARE-AND-SET NA SESSÃO (Associa apenas se lead_id for NULL)
    const { data: updatedSession, error: sessUpdateErr } = await supabase
      .from('visitor_sessions')
      .update({ lead_id: candidateId })
      .eq('id', sessionData.id)
      .is('lead_id', null)
      .select('id, lead_id')
      .maybeSingle();

    if (sessUpdateErr) {
      // Erro DB ao associar sessão: eliminar candidata órfã e sair limpo
      console.error('Failed to associate lead to session', { code: sessUpdateErr.code || 'unknown' });
      await deleteCandidateLead(supabase, candidateId);
      return;
    }

    if (updatedSession && updatedSession.lead_id === candidateId) {
      // A LEAD CANDIDATA VENCEU A CORRIDA
      sessionData.lead_id = candidateId;
      await linkConversationToLead(supabase, conversationId, candidateId);
      return;
    }

    // 4. A LEAD CANDIDATA PERDEU A CORRIDA (Outra chamada concorrente associou primeiro)
    const { data: latestSession, error: latestSessionError } = await supabase
      .from('visitor_sessions')
      .select('lead_id')
      .eq('id', sessionData.id)
      .maybeSingle();

    // Eliminar sempre a candidata através de deleteCandidateLead pelo UUID exato
    const deletedOk = await deleteCandidateLead(supabase, candidateId);

    if (latestSessionError) {
      console.error('Failed to query latest session lead link', {
        code: latestSessionError.code || 'unknown',
      });
      return;
    }

    if (!deletedOk) {
      return;
    }

    const winningLeadId = latestSession?.lead_id;
    if (winningLeadId) {
      sessionData.lead_id = winningLeadId;
      await updateExistingLead(supabase, winningLeadId, activeLanguage, cleanQualification);
      await linkConversationToLead(supabase, conversationId, winningLeadId);
    }
  } catch (err) {
    console.error('Unexpected lead qualification failure', { code: err?.code || 'unknown' });
  }
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
    let rawQualification = null;

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
          text: {
            verbosity: 'low',
            format: {
              type: 'json_schema',
              name: 'commercial_agent_response',
              strict: true,
              schema: commercialAgentResponseSchema,
            },
          },
          max_output_tokens: 1000,
          store: false,
        });

        if (response?.status === 'completed' && typeof response?.output_text === 'string') {
          try {
            const parsed = JSON.parse(response.output_text);
            if (parsed && typeof parsed === 'object') {
              if (typeof parsed.reply === 'string') {
                const trimmedReply = parsed.reply.trim();
                if (trimmedReply.length >= 1 && trimmedReply.length <= 4000) {
                  replyText = trimmedReply;
                }
              }
              if (parsed.qualification && typeof parsed.qualification === 'object') {
                rawQualification = parsed.qualification;
              }
            }
          } catch (parseErr) {
            console.error('Failed to parse OpenAI Structured Output', {
              name: parseErr?.name || 'Error',
            });
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
      rawQualification = null; // Garantir que nao se cria lead com fallback
      replyText =
        activeLanguage === 'en'
          ? 'I cannot generate a complete response right now. Tell me whether you are looking for Premium Websites, Automation, AI Solutions, or Digital Growth, and I will help you explore that area.'
          : 'Neste momento não consigo gerar uma resposta completa. Diz-me se procuras Websites Premium, Automação, Soluções de IA ou Crescimento Digital e ajudo-te a explorar essa área.';
    }

    // Processar e persistir qualificação estruturada de lead se existir resposta valida
    if (rawQualification) {
      const cleanQualification = sanitizeQualification(rawQualification);
      await processLeadQualification(
        supabase,
        sessionData,
        conversationId,
        activeLanguage,
        cleanQualification
      );
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
