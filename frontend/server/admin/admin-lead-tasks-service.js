import { isValidUuid } from './admin-lead-detail-service.js';

/**
 * Ordena determinísticamente uma lista de tarefas da Lead 360:
 * A) Tarefas abertas primeiro;
 * B) Entre abertas: vencidas primeiro, depois prazo mais próximo, depois sem prazo (ordenadas por created_at DESC);
 * C) Concluídas no fim;
 * D) Entre concluídas: concluídas mais recentemente primeiro.
 *
 * @param {Array} tasks
 * @returns {Array}
 */
export function sortLeadTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const nowMs = Date.now();

  return [...tasks].sort((a, b) => {
    const aOpen = a.status === 'open';
    const bOpen = b.status === 'open';

    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    if (aOpen && bOpen) {
      const aDueMs = a.due_at ? new Date(a.due_at).getTime() : null;
      const bDueMs = b.due_at ? new Date(b.due_at).getTime() : null;

      const aOverdue = Boolean(aDueMs && aDueMs < nowMs);
      const bOverdue = Boolean(bDueMs && bDueMs < nowMs);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      if (aOverdue && bOverdue) {
        return aDueMs - bDueMs;
      }

      if (aDueMs !== null && bDueMs !== null) {
        return aDueMs - bDueMs;
      }
      if (aDueMs !== null && bDueMs === null) return -1;
      if (aDueMs === null && bDueMs !== null) return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    // Ambas concluídas
    const aCompMs = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bCompMs = b.completed_at ? new Date(b.completed_at).getTime() : 0;

    if (aCompMs !== bCompMs) {
      return bCompMs - aCompMs;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Adiciona metadados derivados (ex: is_overdue, assignee_name) a um objeto de tarefa.
 *
 * @param {object} task
 * @returns {object}
 */
export function formatTaskMetadata(task) {
  if (!task) return null;
  const nowMs = Date.now();
  const dueMs = task.due_at ? new Date(task.due_at).getTime() : null;
  const isOverdue = task.status === 'open' && Boolean(dueMs && dueMs < nowMs);

  return {
    ...task,
    is_overdue: isOverdue,
    assignee_name: 'Admin',
    creator_name: 'Admin',
    completer_name: task.completed_by ? 'Admin' : null,
  };
}

/**
 * Procura as tarefas comerciais de um lead ordenadas segundo as regras de negócio da Lead 360.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} leadId
 * @param {number} [limit=100]
 * @returns {Promise<Array>}
 */
export async function fetchLeadTasksFromDatabase(supabaseClient, leadId, limit = 100) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('lead_tasks')
    .select('id, lead_id, title, status, priority, due_at, assigned_to, created_by, created_at, completed_at, completed_by, reason_code')
    .eq('lead_id', leadId)
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao consultar tarefas da lead: ${error.message}`);
  }

  const formattedTasks = (data || []).map(formatTaskMetadata);
  return sortLeadTasks(formattedTasks);
}

/**
 * Cria uma nova tarefa comercial associada a uma lead.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ leadId: string, title: string, priority?: string, dueAt?: string|null, assignedTo?: string, createdBy: string }} params
 * @returns {Promise<object>}
 */
export async function createLeadTaskInDatabase(
  supabaseClient,
  { leadId, title, priority = 'normal', dueAt = null, assignedTo = null, createdBy, reasonCode, reason_code, taskType }
) {
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

  const effectiveAssignedTo = assignedTo || createdBy;
  if (!isValidUuid(effectiveAssignedTo)) {
    const err = new Error('ID de utilizador responsável inválido');
    err.statusCode = 400;
    throw err;
  }

  if (typeof title !== 'string' || title.trim().length === 0) {
    const err = new Error('O título da tarefa não pode estar vazio');
    err.statusCode = 400;
    throw err;
  }

  if (title.length > 255) {
    const err = new Error('O título da tarefa não pode ter mais de 255 caracteres');
    err.statusCode = 400;
    throw err;
  }

  const allowedPriorities = ['low', 'normal', 'high'];
  if (!allowedPriorities.includes(priority)) {
    const err = new Error('Prioridade de tarefa inválida. Valores permitidos: low, normal, high');
    err.statusCode = 400;
    throw err;
  }

  const rawReasonCode = reasonCode !== undefined ? reasonCode : (reason_code !== undefined ? reason_code : taskType);
  let normalizedReasonCode = null;
  if (rawReasonCode && rawReasonCode !== 'phone_call') {
    normalizedReasonCode = rawReasonCode;
  }

  let formattedDueAt = null;
  if (dueAt !== null && dueAt !== undefined && dueAt !== '') {
    const parsedDate = new Date(dueAt);
    if (isNaN(parsedDate.getTime())) {
      const err = new Error('Data/hora de prazo (due_at) inválida');
      err.statusCode = 400;
      throw err;
    }
    formattedDueAt = parsedDate.toISOString();
  }

  // Verificar se o lead existe
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

  const trimmedTitle = title.trim();

  const { data, error } = await supabaseClient
    .from('lead_tasks')
    .insert({
      lead_id: leadId,
      title: trimmedTitle,
      status: 'open',
      priority,
      due_at: formattedDueAt,
      assigned_to: effectiveAssignedTo,
      created_by: createdBy,
      reason_code: normalizedReasonCode,
    })
    .select('id, lead_id, title, status, priority, due_at, assigned_to, created_by, created_at, completed_at, completed_by, reason_code')
    .single();

  if (error) {
    throw new Error(`Erro ao criar tarefa da lead: ${error.message}`);
  }

  return formatTaskMetadata(data);
}

/**
 * Altera o estado de uma tarefa (open <-> completed).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ leadId: string, taskId: string, status: string, adminUserId: string }} params
 * @returns {Promise<object>}
 */
export async function updateLeadTaskStatusInDatabase(
  supabaseClient,
  { leadId, taskId, status, adminUserId }
) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidUuid(taskId)) {
    const err = new Error('ID de tarefa inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidUuid(adminUserId)) {
    const err = new Error('ID de utilizador admin inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!['open', 'completed'].includes(status)) {
    const err = new Error('Estado de tarefa inválido. Valores permitidos: open, completed');
    err.statusCode = 400;
    throw err;
  }

  // Verificar pertença da tarefa ao lead (Garantia de Segurança)
  const { data: existingTask, error: taskErr } = await supabaseClient
    .from('lead_tasks')
    .select('id, lead_id, status')
    .eq('id', taskId)
    .eq('lead_id', leadId)
    .maybeSingle();

  if (taskErr) {
    throw new Error(`Erro ao consultar tarefa: ${taskErr.message}`);
  }

  if (!existingTask) {
    const err = new Error('Tarefa não encontrada para esta lead');
    err.statusCode = 404;
    throw err;
  }

  const isCompleting = status === 'completed';
  const updatePayload = {
    status,
    completed_at: isCompleting ? new Date().toISOString() : null,
    completed_by: isCompleting ? adminUserId : null,
  };

  const { data, error } = await supabaseClient
    .from('lead_tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('lead_id', leadId)
    .select('id, lead_id, title, status, priority, due_at, assigned_to, created_by, created_at, completed_at, completed_by, reason_code')
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar estado da tarefa: ${error.message}`);
  }

  return formatTaskMetadata(data);
}

/**
 * Atualiza os detalhes de uma tarefa comercial existente (título, prioridade, prazo, tipo/reason_code).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ leadId: string, taskId: string, title?: string, priority?: string, dueAt?: string|null, reasonCode?: string|null, reason_code?: string|null, taskType?: string|null }} params
 * @returns {Promise<object>}
 */
export async function updateLeadTaskDetailsInDatabase(
  supabaseClient,
  { leadId, taskId, title, priority, dueAt, reasonCode, reason_code, taskType }
) {
  if (!isValidUuid(leadId)) {
    const err = new Error('ID de lead inválido');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidUuid(taskId)) {
    const err = new Error('ID de tarefa inválido');
    err.statusCode = 400;
    throw err;
  }

  // Verificar pertença da tarefa à lead
  const { data: existingTask, error: taskErr } = await supabaseClient
    .from('lead_tasks')
    .select('id, lead_id, title, priority, due_at, reason_code')
    .eq('id', taskId)
    .eq('lead_id', leadId)
    .maybeSingle();

  if (taskErr) {
    throw new Error(`Erro ao consultar tarefa: ${taskErr.message}`);
  }

  if (!existingTask) {
    const err = new Error('Tarefa não encontrada para esta lead');
    err.statusCode = 404;
    throw err;
  }

  const updatePayload = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      const err = new Error('O título da tarefa não pode estar vazio');
      err.statusCode = 400;
      throw err;
    }
    if (title.length > 255) {
      const err = new Error('O título da tarefa não pode ter mais de 255 caracteres');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.title = title.trim();
  }

  if (priority !== undefined) {
    const allowedPriorities = ['low', 'normal', 'high'];
    if (!allowedPriorities.includes(priority)) {
      const err = new Error('Prioridade de tarefa inválida. Valores permitidos: low, normal, high');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.priority = priority;
  }

  if (dueAt !== undefined) {
    if (dueAt === null || dueAt === '') {
      updatePayload.due_at = null;
    } else {
      const parsedDate = new Date(dueAt);
      if (isNaN(parsedDate.getTime())) {
        const err = new Error('Data/hora de prazo (due_at) inválida');
        err.statusCode = 400;
        throw err;
      }
      updatePayload.due_at = parsedDate.toISOString();
    }
  }

  const rawReasonCode = reasonCode !== undefined ? reasonCode : (reason_code !== undefined ? reason_code : taskType);
  if (rawReasonCode !== undefined) {
    if (rawReasonCode === 'phone_call' || rawReasonCode === null || rawReasonCode === '') {
      updatePayload.reason_code = null;
    } else {
      updatePayload.reason_code = rawReasonCode;
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    const err = new Error('Nenhum campo para atualizar foi fornecido');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseClient
    .from('lead_tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('lead_id', leadId)
    .select('id, lead_id, title, status, priority, due_at, assigned_to, created_by, created_at, completed_at, completed_by, reason_code')
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar detalhes da tarefa: ${error.message}`);
  }

  return formatTaskMetadata(data);
}

export { fetchGlobalAdminTasksFromDatabase } from './admin-tasks-service.js';



