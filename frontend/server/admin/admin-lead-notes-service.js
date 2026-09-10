import { isValidUuid } from './admin-lead-detail-service.js';

/**
 * Procura as notas comerciais de um lead ordenadas cronologicamente (mais recentes primeiro).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} leadId
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
export async function fetchLeadNotesFromDatabase(supabaseClient, leadId, limit = 50) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('lead_notes')
    .select('id, lead_id, content, created_by, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao consultar notas da lead: ${error.message}`);
  }

  // Mapear cada nota para incluir autor amigável ("Admin")
  return (data || []).map((note) => ({
    ...note,
    author_name: 'Admin',
  }));
}

/**
 * Cria uma nova nota comercial associada a uma lead.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ leadId: string, content: string, createdBy: string }} params
 * @returns {Promise<object>}
 */
export async function createLeadNoteInDatabase(supabaseClient, { leadId, content, createdBy }) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidUuid(createdBy)) {
    const err = new Error('ID de utilizador criador inválido');
    err.statusCode = 400;
    throw err;
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    const err = new Error('O conteúdo da nota não pode estar vazio');
    err.statusCode = 400;
    throw err;
  }

  if (content.length > 5000) {
    const err = new Error('O conteúdo da nota não pode ter mais de 5000 caracteres');
    err.statusCode = 400;
    throw err;
  }

  // Verificar existência da lead
  const { data: lead, error: leadErr } = await supabaseClient
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr) {
    throw new Error(`Erro ao verificar lead: ${leadErr.message}`);
  }

  if (!lead) {
    const err = new Error('Lead não encontrada');
    err.statusCode = 404;
    throw err;
  }

  const trimmedContent = content.trim();

  const { data, error } = await supabaseClient
    .from('lead_notes')
    .insert({
      lead_id: leadId,
      content: trimmedContent,
      created_by: createdBy,
    })
    .select('id, lead_id, content, created_by, created_at')
    .single();

  if (error) {
    throw new Error(`Erro ao criar nota da lead: ${error.message}`);
  }

  return {
    ...data,
    author_name: 'Admin',
  };
}
