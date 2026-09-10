import { createClient } from '@supabase/supabase-js';

/**
 * Valida se uma string é um UUID v4/genérico válido.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Obtém o detalhe de uma conversa por ID com os dados da lead associada e a transcrição cronológica das mensagens.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} conversationId
 * @returns {Promise<{ conversation: object, messages: Array }>}
 */
export async function fetchAdminConversationDetailFromDatabase(supabaseClient, conversationId) {
  if (!isValidUuid(conversationId)) {
    const err = new Error('ID de conversa inválido');
    err.statusCode = 400;
    throw err;
  }

  // 1. Obter os dados da conversa e da lead associada
  const { data: conv, error: convErr } = await supabaseClient
    .from('conversations')
    .select(`
      id,
      status,
      commercial_stage,
      primary_outcome,
      language,
      created_at,
      last_activity_at,
      closed_at,
      leads (
        id,
        name,
        company_name,
        email,
        phone,
        primary_service,
        lead_classification,
        financial_alignment_status
      )
    `)
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr) {
    const err = new Error(`Erro ao consultar a conversa na base de dados: ${convErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!conv) {
    const err = new Error('Conversa não encontrada');
    err.statusCode = 404;
    throw err;
  }

  // 2. Obter as mensagens da conversa ordenadas cronologicamente
  const { data: rawMessages, error: msgsErr } = await supabaseClient
    .from('messages')
    .select('id, sender_role, message_type, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgsErr) {
    const err = new Error(`Erro ao obter mensagens da conversa: ${msgsErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  // 3. Minimizar e formatar mensagens
  const formattedMessages = (rawMessages || []).map((msg) => {
    return {
      id: msg.id,
      sender_role: msg.sender_role === 'visitor' ? 'visitor' : 'agent',
      content: msg.content || '',
      created_at: msg.created_at,
    };
  });

  const formattedConversation = {
    id: conv.id,
    status: conv.status,
    commercial_stage: conv.commercial_stage,
    primary_outcome: conv.primary_outcome,
    language: conv.language,
    created_at: conv.created_at,
    last_activity_at: conv.last_activity_at,
    closed_at: conv.closed_at || null,
    lead: conv.leads || null,
  };

  return {
    conversation: formattedConversation,
    messages: formattedMessages,
  };
}
