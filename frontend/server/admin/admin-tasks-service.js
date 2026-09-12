import { formatTaskMetadata, sortLeadTasks } from './admin-lead-tasks-service.js';

/**
 * Calcula os limites de início do dia e fim do dia em formato ISO para o fuso horário local do utilizador.
 *
 * @param {number} [timezoneOffsetMinutes=0] - offset em minutos retornado por Date.prototype.getTimezoneOffset()
 * @param {Date} [now=new Date()]
 * @returns {{ startOfTodayIso: string, startOfTomorrowIso: string }}
 */
export function getLocalDayBoundsIso(timezoneOffsetMinutes = 0, now = new Date()) {
  const offsetMs = (timezoneOffsetMinutes || 0) * 60 * 1000;
  const localNow = new Date(now.getTime() - offsetMs);

  const year = localNow.getUTCFullYear();
  const month = localNow.getUTCMonth();
  const day = localNow.getUTCDate();

  const startOfTodayLocal = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const startOfTomorrowLocal = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

  const startOfTodayUtc = new Date(startOfTodayLocal.getTime() + offsetMs);
  const startOfTomorrowUtc = new Date(startOfTomorrowLocal.getTime() + offsetMs);

  return {
    startOfTodayIso: startOfTodayUtc.toISOString(),
    startOfTomorrowIso: startOfTomorrowUtc.toISOString(),
  };
}

/**
 * Procura globalmente as tarefas comerciais (public.lead_tasks) com o contexto da lead (anti-N+1),
 * suportando paginação server-side real, contagens globais por categoria e ordenação determinística.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=20]
 * @param {number} [options.limit]
 * @param {string} [options.category='pending'] - pending|all|overdue|today|upcoming|nodue|completed
 * @param {string} [options.priority='all'] - all|high|normal|low
 * @param {number} [options.timezoneOffset=0] - offset em minutos do browser (ex: getTimezoneOffset())
 * @param {boolean} [options.includeCompleted=false]
 * @returns {Promise<object>}
 */
export async function fetchGlobalAdminTasksFromDatabase(supabaseClient, options = {}) {
  const page = typeof options.page === 'number' && options.page > 0 ? options.page : 1;
  const rawPageSize = options.pageSize || options.limit;
  const pageSize = typeof rawPageSize === 'number' && rawPageSize > 0 ? rawPageSize : 20;
  const priority = ['high', 'normal', 'low'].includes(options.priority) ? options.priority : 'all';

  let category = options.category;
  if (!category || category === 'all') {
    category = options.includeCompleted ? 'all' : 'pending';
  }

  const timezoneOffset = typeof options.timezoneOffset === 'number' ? options.timezoneOffset : 0;
  const { startOfTodayIso, startOfTomorrowIso } = getLocalDayBoundsIso(timezoneOffset);

  // 1. Obter contagens globais exatas para todos os cartões do topo
  const [
    { count: openTotalCount },
    { count: overdueCount },
    { count: todayCount },
    { count: upcomingCount },
    { count: nodueCount },
    { count: completedCount },
  ] = await Promise.all([
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'open').lt('due_at', startOfTodayIso),
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('due_at', startOfTodayIso).lt('due_at', startOfTomorrowIso),
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('due_at', startOfTomorrowIso),
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'open').is('due_at', null),
    supabaseClient.from('lead_tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  // 2. Construir query filtrada e paginada para a categoria selecionada
  let query = supabaseClient
    .from('lead_tasks')
    .select(
      `
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
      reason_code,
      lead:leads (
        id,
        name,
        email,
        company_name,
        pipeline_stage,
        lead_classification,
        primary_service
      )
    `,
      { count: 'exact' }
    );

  // Filtros por categoria/estado e prazos
  switch (category) {
    case 'overdue':
      query = query.eq('status', 'open').lt('due_at', startOfTodayIso);
      break;
    case 'today':
      query = query.eq('status', 'open').gte('due_at', startOfTodayIso).lt('due_at', startOfTomorrowIso);
      break;
    case 'upcoming':
      query = query.eq('status', 'open').gte('due_at', startOfTomorrowIso);
      break;
    case 'nodue':
      query = query.eq('status', 'open').is('due_at', null);
      break;
    case 'completed':
      query = query.eq('status', 'completed');
      break;
    case 'all':
      // Sem filtro de status (inclui abertas e concluídas)
      break;
    case 'pending':
    default:
      query = query.eq('status', 'open');
      break;
  }

  // Filtro opcional por prioridade
  if (priority !== 'all') {
    query = query.eq('priority', priority);
  }

  // Ordenação determinística e adequada por categoria
  switch (category) {
    case 'overdue':
    case 'today':
    case 'upcoming':
      query = query.order('due_at', { ascending: true }).order('id', { ascending: false });
      break;
    case 'nodue':
      query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
      break;
    case 'completed':
      query = query.order('completed_at', { ascending: false }).order('id', { ascending: false });
      break;
    case 'all':
      query = query
        .order('status', { ascending: true })
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      break;
    case 'pending':
    default:
      query = query
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      break;
  }

  // Paginação server-side real
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, count: totalFiltered, error } = await query;

  if (error) {
    throw new Error(`Erro ao consultar tarefas globais: ${error.message}`);
  }

  const total = typeof totalFiltered === 'number' ? totalFiltered : (data || []).length;
  const totalPages = Math.ceil(total / pageSize) || 1;

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
      reason_code: row.reason_code,
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

  return {
    tasks: formattedTasks,
    total,
    page,
    pageSize,
    totalPages,
    category,
    priority,
    counts: {
      openTotal: openTotalCount || 0,
      overdue: overdueCount || 0,
      today: todayCount || 0,
      upcoming: upcomingCount || 0,
      nodue: nodueCount || 0,
      completed: completedCount || 0,
    },
  };
}

