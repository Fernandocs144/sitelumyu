import { createClient } from '@supabase/supabase-js';

const ALLOWED_PERIODS = ['7d', '30d', '90d', 'all'];

/**
 * Normaliza e valida o parâmetro de período temporal.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ period: string }}
 */
export function parseDashboardQueryParams(searchParams) {
  let period = (searchParams.get('period') || '').trim().toLowerCase();
  if (!ALLOWED_PERIODS.includes(period)) {
    period = '30d'; // Default: Últimos 30 dias
  }
  return { period };
}

/**
 * Calcula a data limite (cutoff ISO string) para o filtro temporal.
 *
 * @param {string} period
 * @returns {string|null}
 */
export function getPeriodCutoffDate(period) {
  if (period === 'all') return null;

  const now = new Date();
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;

  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}

/**
 * Consulta e agrega os dados do Dashboard Comercial Admin a partir do Supabase local.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ period: string }} params
 * @returns {Promise<object>}
 */
export async function fetchAdminDashboardFromDatabase(supabaseClient, params) {
  const { period } = params;
  const cutoffIso = getPeriodCutoffDate(period);

  // Construir queries paralelas para minimizar tempo de resposta
  let leadsQuery = supabaseClient
    .from('leads')
    .select('id, name, company_name, email, primary_service, lead_classification, financial_alignment_status, created_at')
    .order('created_at', { ascending: false });

  let conversationsQuery = supabaseClient
    .from('conversations')
    .select('id, status, commercial_stage, primary_outcome, created_at, last_activity_at, leads!inner(id, name, company_name, email)')
    .order('last_activity_at', { ascending: false });

  let bookingsQuery = supabaseClient
    .from('calendar_bookings')
    .select('id, created_at, status')
    .in('status', ['confirmed', 'rescheduled']);

  if (cutoffIso) {
    leadsQuery = leadsQuery.gte('created_at', cutoffIso);
    conversationsQuery = conversationsQuery.gte('last_activity_at', cutoffIso);
    bookingsQuery = bookingsQuery.gte('created_at', cutoffIso);
  }

  const [leadsRes, conversationsRes, bookingsRes] = await Promise.all([
    leadsQuery,
    conversationsQuery,
    bookingsQuery,
  ]);

  if (leadsRes.error) {
    throw new Error(`Erro ao obter leads do dashboard: ${leadsRes.error.message}`);
  }
  if (conversationsRes.error) {
    throw new Error(`Erro ao obter conversas do dashboard: ${conversationsRes.error.message}`);
  }

  const leads = leadsRes.data || [];
  const conversations = conversationsRes.data || [];

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (l) => l.lead_classification === 'qualified' || l.lead_classification === 'priority'
  ).length;

  const totalConversations = conversations.length;
  const bookings = (bookingsRes && !bookingsRes.error && Array.isArray(bookingsRes.data)) ? bookingsRes.data : [];
  const meetingsBooked = bookings.length;

  // 1. Agregação: Leads por Classificação
  const classificationCounts = {
    priority: 0,
    qualified: 0,
    potential: 0,
    informational: 0,
    disqualified: 0,
    unknown: 0,
  };

  leads.forEach((l) => {
    const key = l.lead_classification && classificationCounts.hasOwnProperty(l.lead_classification)
      ? l.lead_classification
      : 'unknown';
    classificationCounts[key] += 1;
  });

  const leadsByClassification = Object.entries(classificationCounts).map(([key, count]) => {
    const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return { key, count, percentage };
  });

  // 2. Agregação: Leads por Serviço Principal
  const serviceCounts = {
    websites: 0,
    automation: 0,
    ai: 0,
    digital_growth: 0,
    other: 0,
  };

  leads.forEach((l) => {
    const key = l.primary_service && serviceCounts.hasOwnProperty(l.primary_service)
      ? l.primary_service
      : 'other';
    serviceCounts[key] += 1;
  });

  const leadsByService = Object.entries(serviceCounts).map(([key, count]) => {
    const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return { key, count, percentage };
  });

  // 3. Agregação: Alinhamento Financeiro
  const alignmentCounts = {
    aligned: 0,
    possibly_low: 0,
    low_alignment: 0,
    unknown: 0,
  };

  leads.forEach((l) => {
    const key = l.financial_alignment_status && alignmentCounts.hasOwnProperty(l.financial_alignment_status)
      ? l.financial_alignment_status
      : 'unknown';
    alignmentCounts[key] += 1;
  });

  const financialAlignment = Object.entries(alignmentCounts).map(([key, count]) => {
    const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return { key, count, percentage };
  });

  // 4. Atividade Recente (Top 5)
  const recentLeads = leads.slice(0, 5).map((l) => ({
    id: l.id,
    name: l.name || l.company_name || 'Lead sem nome',
    company_name: l.company_name || null,
    primary_service: l.primary_service,
    lead_classification: l.lead_classification,
    created_at: l.created_at,
  }));

  const recentConversations = conversations.slice(0, 5).map((c) => ({
    id: c.id,
    visitor_name: c.leads?.name || c.leads?.company_name || 'Visitante não identificado',
    email: c.leads?.email || null,
    commercial_stage: c.commercial_stage,
    primary_outcome: c.primary_outcome,
    last_activity_at: c.last_activity_at || c.created_at,
  }));

  return {
    period,
    kpis: {
      totalLeads,
      qualifiedLeads,
      totalConversations,
      meetingsBooked,
    },
    distributions: {
      leadsByClassification,
      leadsByService,
      financialAlignment,
    },
    recentLeads,
    recentConversations,
  };
}
