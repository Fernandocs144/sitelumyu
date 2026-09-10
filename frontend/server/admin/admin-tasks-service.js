import { formatTaskMetadata, sortLeadTasks } from './admin-lead-tasks-service.js';

/**
 * Procura globalmente as tarefas comerciais (public.lead_tasks) com o contexto mínimo da lead (anti-N+1).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ limit?: number, includeCompleted?: boolean }} [options]
 * @returns {Promise<{ tasks: Array, total: number, truncated: boolean, limit: number }>}
 */
export async function fetchGlobalAdminTasksFromDatabase(supabaseClient, options = {}) {
  const limit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : 200;
  const includeCompleted = Boolean(options.includeCompleted);

  // 1. Obter a contagem total de registos
  let countQuery = supabaseClient
    .from('lead_tasks')
    .select('id', { count: 'exact', head: true });

  if (!includeCompleted) {
    countQuery = countQuery.eq('status', 'open');
  }

  const { count: totalCount, error: countErr } = await countQuery;
  if (countErr) {
    throw new Error(`Erro ao contar tarefas globais: ${countErr.message}`);
  }

  // 2. Consulta anti-N+1 com join explícito da tabela leads
  let query = supabaseClient
    .from('lead_tasks')
    .select(`
      id,
      lead_id,
      title,
      status,
      priority,
      due_at,
      assigned_to,
      created_by,
      created_at,
      completed_at,
      completed_by,
      lead:leads (
        id,
        name,
        email,
        company_name,
        pipeline_stage,
        lead_classification,
        primary_service
      )
    `)
    .limit(limit);

  if (!includeCompleted) {
    query = query.eq('status', 'open');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao consultar tarefas globais: ${error.message}`);
  }

  const total = totalCount || (data || []).length;
  const truncated = total > limit;

  // Formatar cada tarefa com metadados e fallback do nome da lead
  const formattedTasks = (data || []).map((row) => {
    const leadObj = row.lead || {};
    let leadDisplayName = 'Lead sem nome';
    if (leadObj.name && typeof leadObj.name === 'string' && leadObj.name.trim().length > 0) {
      leadDisplayName = leadObj.name.trim();
    } else if (leadObj.email && typeof leadObj.email === 'string' && leadObj.email.trim().length > 0) {
      leadDisplayName = leadObj.email.trim();
    }

    const baseTask = formatTaskMetadata({
      id: row.id,
      lead_id: row.lead_id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      due_at: row.due_at,
      assigned_to: row.assigned_to,
      created_by: row.created_by,
      created_at: row.created_at,
      completed_at: row.completed_at,
      completed_by: row.completed_by,
    });

    return {
      ...baseTask,
      lead: {
        id: leadObj.id || row.lead_id,
        name: leadObj.name || null,
        email: leadObj.email || null,
        company_name: leadObj.company_name || null,
        pipeline_stage: leadObj.pipeline_stage || null,
        lead_classification: leadObj.lead_classification || null,
        primary_service: leadObj.primary_service || null,
        display_name: leadDisplayName,
      },
    };
  });

  const sortedTasks = sortLeadTasks(formattedTasks);

  return {
    tasks: sortedTasks,
    total,
    truncated,
    limit,
  };
}
