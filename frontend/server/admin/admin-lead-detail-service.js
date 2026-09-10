import { createClient } from '@supabase/supabase-js';
import { fetchLeadNotesFromDatabase } from './admin-lead-notes-service.js';
import { fetchLeadTasksFromDatabase } from './admin-lead-tasks-service.js';

/**
 * Valida se uma string é um UUID válido (v4 ou genérico).
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Lista de campos minimizados explicitamente selecionados para o detalhe individual do lead.
 * Exclui a coluna gerada email_normalized e colunas puramente técnicas de pipeline de normalização.
 */
export const LEAD_DETAIL_FIELDS = [
  'id',
  'name',
  'company_name',
  'email',
  'phone',
  'language',
  'primary_service',
  'service_variant',
  'secondary_services',
  'need_description',
  'has_existing_website',
  'website_url',
  'operational_impact',
  'stated_budget_min',
  'stated_budget_max',
  'stated_budget_currency',
  'stated_budget_period',
  'stated_budget_raw',
  'timeline',
  'decision_involvement',
  'intent_level',
  'financial_alignment_status',
  'financial_alignment_reason',
  'financial_rule_version',
  'financial_evaluated_at',
  'lead_classification',
  'classification_reason',
  'qualification_summary',
  'next_step',
  'pipeline_stage',
  'source',
  'assigned_to',
  'created_at',
  'updated_at',
  'last_interaction_at',
].join(', ');

/**
 * Procura um lead por ID e todos os dados comerciais unificados (Lead 360) utilizando a service_role:
 * - Lead data
 * - Última conversa e lista de conversas
 * - Histórico de transições do pipeline (pipeline_stage_history)
 * - Agendamentos de reunião (calendar_bookings)
 * - Notas comerciais (lead_notes)
 * - Tarefas comerciais (lead_tasks)
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} leadId
 * @returns {Promise<{ lead: object|null, conversation: object|null, conversations: Array, pipelineHistory: Array, bookings: Array, notes: Array, tasks: Array }>}
 */
export async function fetchLeadByIdFromDatabase(supabaseClient, leadId) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  // Consulta paralela das 6 entidades via Promise.all para evitar N+1 queries
  const [leadRes, historyRes, bookingsRes, convsRes, notes, tasks] = await Promise.all([
    supabaseClient
      .from('leads')
      .select(LEAD_DETAIL_FIELDS)
      .eq('id', leadId)
      .maybeSingle(),

    supabaseClient
      .from('pipeline_stage_history')
      .select('id, lead_id, from_stage, to_stage, source, changed_by, changed_at')
      .eq('lead_id', leadId)
      .order('changed_at', { ascending: true }),

    supabaseClient
      .from('calendar_bookings')
      .select('id, status, start_time, end_time, timezone, attendee_name, attendee_email, created_at')
      .eq('lead_id', leadId)
      .order('start_time', { ascending: false }),

    supabaseClient
      .from('conversations')
      .select('id, status, commercial_stage, primary_outcome, language, created_at, last_activity_at')
      .eq('lead_id', leadId)
      .order('last_activity_at', { ascending: false }),

    fetchLeadNotesFromDatabase(supabaseClient, leadId, 50),
    fetchLeadTasksFromDatabase(supabaseClient, leadId, 100),
  ]);

  if (leadRes.error) {
    throw new Error(`Erro ao consultar lead na base de dados: ${leadRes.error.message}`);
  }

  if (!leadRes.data) {
    const err = new Error('Lead não encontrada');
    err.statusCode = 404;
    throw err;
  }

  const lead = leadRes.data;
  const pipelineHistory = historyRes.data || [];
  const bookings = bookingsRes.data || [];
  const conversations = convsRes.data || [];
  const conversation = conversations.length > 0 ? conversations[0] : null;

  return {
    lead,
    conversation,
    conversations,
    pipelineHistory,
    bookings,
    notes: notes || [],
    tasks: tasks || [],
  };
}

