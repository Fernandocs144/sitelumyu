/**
 * FASE 7A.1 — FOLLOW-UP ENGINE V1 (Semantic Hardening)
 *
 * Motor determinístico e explicável de deteção e recomendação de follow-ups comerciais.
 * Função 100% pura: exige relógio 'nowRef' explícito e garante precisão factual de conceitos.
 */

export const FOLLOW_UP_RULES = {
  new: {
    staleDays: 2,
    priority: 'high',
    reasonCode: 'new_lead_stale',
    reasonLabel: 'Lead nova sem atividade recente'
  },
  qualified: {
    staleDays: 2,
    priority: 'high',
    reasonCode: 'stale_qualified_lead',
    reasonLabel: 'Lead qualificada sem agendamento nem atividade recente'
  },
  meeting_scheduled: {
    stalePostMeetingDays: 1,
    priority: 'high',
    reasonCode: 'meeting_outcome_pending',
    reasonLabel: 'Reunião agendada já terminou; confirmar resultado'
  },
  meeting_completed: {
    staleDays: 2,
    priority: 'high',
    reasonCode: 'meeting_follow_up',
    reasonLabel: 'Reunião realizada sem atividade posterior'
  },
  proposal: {
    staleBusinessDays: 3,
    priority: 'high',
    reasonCode: 'proposal_pending',
    reasonLabel: 'Lead em Proposta sem atividade recente'
  },
  negotiation: {
    staleDays: 3,
    priority: 'high',
    reasonCode: 'negotiation_stale',
    reasonLabel: 'Lead em Negociação sem atividade recente'
  }
};

/**
 * Utilitário puro e determinístico de cálculo de Dias Úteis (V1).
 * "Business Days V1 exclui apenas fins de semana."
 *
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number} Número de dias úteis completos decorridos entre startDate e endDate
 */
export function isWeekendUTC(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function countBusinessDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let count = 0;
  let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (current < endDay) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayOfWeek = current.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return count;
}

export function addBusinessDays(startDate, businessDaysCount) {
  const current = new Date(startDate);
  let added = 0;
  while (added < businessDaysCount) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dayOfWeek = current.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return current;
}

/**
 * Determina o timestamp da última interação comercial real com a lead.
 * Fontes válidas: leads.last_interaction_at, conversations.last_activity_at/updated_at, leads.created_at (fallback).
 * EXCLUI: calendar_bookings, lead_notes, lead_tasks.
 */
export function getLastCommercialInteractionAt(context) {
  const timestamps = [];

  if (context?.lead?.last_interaction_at) {
    const t = new Date(context.lead.last_interaction_at).getTime();
    if (!isNaN(t)) timestamps.push(t);
  }

  if (context?.latestConversation?.last_activity_at) {
    const t = new Date(context.latestConversation.last_activity_at).getTime();
    if (!isNaN(t)) timestamps.push(t);
  }

  if (timestamps.length === 0 && context?.lead?.created_at) {
    const t = new Date(context.lead.created_at).getTime();
    if (!isNaN(t)) timestamps.push(t);
  }

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

/**
 * Avalia se uma lead necessita de follow-up comercial.
 * Função pura: exige 'nowRef' explícito.
 *
 * @param {Object} context Contexto completo da lead
 * @param {Date|string} nowRef Instante de referência para avaliação (OBRIGATÓRIO)
 * @returns {Object} Resultado de recomendação
 */
export function evaluateFollowUp(context, nowRef) {
  if (!nowRef) {
    throw new Error('Instante de referência "nowRef" é obrigatório em evaluateFollowUp');
  }

  const now = typeof nowRef === 'string' ? new Date(nowRef) : nowRef;
  if (isNaN(now.getTime())) {
    throw new Error('Instante de referência "nowRef" é inválido em evaluateFollowUp');
  }

  const nowMs = now.getTime();
  const lead = context?.lead || {};
  const leadId = lead.id || null;
  const stage = lead.pipeline_stage || 'new';
  const classification = lead.lead_classification || 'potential';

  // Extrair o Cadence Read Model do contexto
  const cadenceModel = context?.cadenceReadModel || context?.cadence || null;
  const cadenceInstanceId = cadenceModel?.cadence_instance_id || null;
  const acceptedAttempts = typeof cadenceModel?.accepted_attempts === 'number' ? cadenceModel.accepted_attempts : 0;
  const lastAcceptedAtISO = cadenceModel?.last_accepted_at || null;
  const lastAcceptedAt = lastAcceptedAtISO ? new Date(lastAcceptedAtISO) : null;
  const hasUnknownDispatch = Boolean(cadenceModel?.has_unknown_dispatch || context?.has_unknown_dispatch);

  // 1. Bloqueios Absolutos (Terminal states)
  if (stage === 'won') {
    return {
      lead_id: leadId,
      needs_follow_up: false,
      reason_code: null,
      reason_label: null,
      priority: null,
      recommended_at: null,
      action_type: null,
      contact_eligible: false,
      blocked: true,
      blocked_reason: 'Lead ganha (negócio encerrado com sucesso)',
      cadence: null
    };
  }

  if (stage === 'lost') {
    return {
      lead_id: leadId,
      needs_follow_up: false,
      reason_code: null,
      reason_label: null,
      priority: null,
      recommended_at: null,
      action_type: null,
      contact_eligible: false,
      blocked: true,
      blocked_reason: 'Lead perdida (negócio encerrado)',
      cadence: null
    };
  }

  if (classification === 'disqualified' || stage === 'disqualified') {
    return {
      lead_id: leadId,
      needs_follow_up: false,
      reason_code: null,
      reason_label: null,
      priority: null,
      recommended_at: null,
      action_type: null,
      contact_eligible: false,
      blocked: true,
      blocked_reason: 'Lead desqualificada comercialmente',
      cadence: null
    };
  }

  // 2. Barreira Transversal de Segurança para Disparos em Estado 'unknown' (Item 19)
  if (hasUnknownDispatch) {
    return {
      lead_id: leadId,
      needs_follow_up: true,
      reason_code: 'unknown_dispatch_pending_reconciliation',
      reason_label: 'Existe um disparo em estado incerto (unknown) que aguarda reconciliação manual',
      priority: 'high',
      recommended_at: now.toISOString(),
      action_type: 'human_review',
      contact_eligible: false,
      blocked: true,
      blocked_reason: 'Disparo prévio em estado incerto (unknown) aguarda reconciliação manual',
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'blocked_unknown_dispatch',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: acceptedAttempts,
        last_accepted_at: lastAcceptedAtISO,
        next_eligible_at: null
      }
    };
  }

  // 3. Bloqueio por Reunião Futura Ativa
  const bookings = Array.isArray(context?.bookings) ? context.bookings : [];
  const futureActiveBooking = bookings.find(b => {
    if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;
    const startTime = new Date(b.start_time).getTime();
    return startTime > nowMs;
  });

  if (futureActiveBooking) {
    const formattedDate = new Date(futureActiveBooking.start_time).toLocaleDateString('pt-PT');
    return {
      lead_id: leadId,
      needs_follow_up: false,
      reason_code: null,
      reason_label: null,
      priority: null,
      recommended_at: null,
      action_type: null,
      contact_eligible: false,
      blocked: true,
      blocked_reason: `Reunião futura agendada para ${formattedDate}`,
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'blocked',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: acceptedAttempts,
        last_accepted_at: lastAcceptedAtISO,
        next_eligible_at: null
      }
    };
  }

  // 4. Avaliação de Sinais (Ordem de Precedência)

  // Sinal 1: Tarefa comercial aberta e vencida (Manual Task Overdue)
  const tasks = Array.isArray(context?.tasks) ? context.tasks : [];
  const overdueTask = tasks.find(t => {
    if (t.status !== 'open') return false;
    if (!t.due_at) return false;
    return new Date(t.due_at).getTime() < nowMs;
  });

  if (overdueTask) {
    const dueMs = new Date(overdueTask.due_at).getTime();
    return {
      lead_id: leadId,
      needs_follow_up: true,
      reason_code: 'manual_task_due',
      reason_label: `Tarefa comercial vencida: ${overdueTask.title}`,
      priority: overdueTask.priority || 'normal',
      recommended_at: new Date(dueMs).toISOString(),
      action_type: 'internal_action',
      contact_eligible: false,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'not_applicable',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: acceptedAttempts,
        last_accepted_at: lastAcceptedAtISO,
        next_eligible_at: null
      }
    };
  }

  // Verificação de Tarefa Manual Aberta no Futuro (Future Task Precedence)
  const futureOpenTask = tasks.find(t => {
    if (t.status !== 'open') return false;
    if (!t.due_at) return false;
    const dueMs = new Date(t.due_at).getTime();
    return !isNaN(dueMs) && dueMs > nowMs;
  });

  const checkFutureTaskPrecedence = (genericActionType, currentAttemptNum, currentAttemptLim) => {
    if (futureOpenTask && genericActionType === 'external_contact') {
      const formattedDate = new Date(futureOpenTask.due_at).toLocaleDateString('pt-PT');
      return {
        lead_id: leadId,
        needs_follow_up: false,
        reason_code: null,
        reason_label: null,
        priority: null,
        recommended_at: null,
        action_type: null,
        contact_eligible: false,
        blocked: true,
        blocked_reason: `Tarefa comercial agendada para ${formattedDate} (${futureOpenTask.title})`,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'blocked',
          attempt_number: currentAttemptNum || null,
          attempt_limit: currentAttemptLim || null,
          accepted_attempts: acceptedAttempts,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: null
        }
      };
    }
    return null;
  };

  // Obter última interação comercial real (Sem bookings/notes/tasks)
  const lastInteraction = getLastCommercialInteractionAt(context);
  const lastInteractionMs = lastInteraction ? lastInteraction.getTime() : nowMs;
  const daysSinceInteraction = (nowMs - lastInteractionMs) / (1000 * 60 * 60 * 24);

  // Sinal 2: meeting_scheduled com reunião cuja data de início já passou (start_time <= now)
  if (stage === 'meeting_scheduled') {
    const pastBooking = bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'rescheduled') && new Date(b.start_time).getTime() <= nowMs)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

    const meetingRefTimeMs = pastBooking?.end_time
      ? new Date(pastBooking.end_time).getTime()
      : (pastBooking?.start_time ? new Date(pastBooking.start_time).getTime() : lastInteractionMs);

    const postMeetingStaleDays = FOLLOW_UP_RULES.meeting_scheduled.stalePostMeetingDays;
    const recommendedTimeMs = meetingRefTimeMs + postMeetingStaleDays * 24 * 60 * 60 * 1000;
    const needsFollowUp = nowMs >= recommendedTimeMs;

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.meeting_scheduled.reasonCode,
      reason_label: FOLLOW_UP_RULES.meeting_scheduled.reasonLabel,
      priority: FOLLOW_UP_RULES.meeting_scheduled.priority,
      recommended_at: new Date(recommendedTimeMs).toISOString(),
      action_type: 'internal_action',
      contact_eligible: false,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'not_applicable',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: null
      }
    };
  }

  // Sinal 3: meeting_completed
  if (stage === 'meeting_completed') {
    const staleThreshold = FOLLOW_UP_RULES.meeting_completed.staleDays;
    const recommendedTimeMs = lastInteractionMs + staleThreshold * 24 * 60 * 60 * 1000;
    const needsFollowUp = daysSinceInteraction >= staleThreshold;

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.meeting_completed.reasonCode,
      reason_label: FOLLOW_UP_RULES.meeting_completed.reasonLabel,
      priority: FOLLOW_UP_RULES.meeting_completed.priority,
      recommended_at: new Date(recommendedTimeMs).toISOString(),
      action_type: 'internal_action',
      contact_eligible: false,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'not_applicable',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: null
      }
    };
  }

  // Sinal 4: proposal (Calculado via Cadência & Business Days V1)
  if (stage === 'proposal') {
    const attemptLimit = 2;

    if (acceptedAttempts >= 2) {
      // Cadência de Proposta exaurida (2/2 tentativas aceites efetuadas)
      return {
        lead_id: leadId,
        needs_follow_up: true,
        reason_code: 'cadence_exhausted',
        reason_label: 'Cadência comercial de Proposta terminada (2/2 acompanhamentos efetuados)',
        priority: 'normal',
        recommended_at: now.toISOString(),
        action_type: 'human_review',
        contact_eligible: false,
        blocked: false,
        blocked_reason: null,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'exhausted',
          attempt_number: 2,
          attempt_limit: 2,
          accepted_attempts: acceptedAttempts,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: null
        }
      };
    }

    if (acceptedAttempts === 1) {
      // Tentativa #2 de Proposta: exige >= 5 Business Days V1 desde last_accepted_at
      const lastAcceptedMs = lastAcceptedAt ? lastAcceptedAt.getTime() : lastInteractionMs;
      const nextEligibleDate = addBusinessDays(lastAcceptedMs, 5);
      const businessDaysSinceAccepted = countBusinessDaysBetween(lastAcceptedMs, nowMs);
      const needsFollowUp = businessDaysSinceAccepted >= 5;

      if (!needsFollowUp) {
        return {
          lead_id: leadId,
          needs_follow_up: false,
          reason_code: FOLLOW_UP_RULES.proposal.reasonCode,
          reason_label: 'Aguardar intervalo de 5 dias úteis após 1.º acompanhamento de Proposta',
          priority: FOLLOW_UP_RULES.proposal.priority,
          recommended_at: nextEligibleDate.toISOString(),
          action_type: null,
          contact_eligible: false,
          blocked: false,
          blocked_reason: null,
          cadence: {
            instance_id: cadenceInstanceId,
            status: 'waiting',
            attempt_number: 2,
            attempt_limit: 2,
            accepted_attempts: 1,
            last_accepted_at: lastAcceptedAtISO,
            next_eligible_at: nextEligibleDate.toISOString()
          }
        };
      }

      const taskBlock = checkFutureTaskPrecedence('external_contact', 2, 2);
      if (taskBlock) return taskBlock;

      return {
        lead_id: leadId,
        needs_follow_up: true,
        reason_code: FOLLOW_UP_RULES.proposal.reasonCode,
        reason_label: 'Elegível para 2.º acompanhamento de Proposta',
        priority: FOLLOW_UP_RULES.proposal.priority,
        recommended_at: nextEligibleDate.toISOString(),
        action_type: 'external_contact',
        contact_eligible: true,
        blocked: false,
        blocked_reason: null,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'active',
          attempt_number: 2,
          attempt_limit: 2,
          accepted_attempts: 1,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: nextEligibleDate.toISOString()
        }
      };
    }

    // acceptedAttempts === 0: Tentativa #1 de Proposta (>= 3 Business Days V1 desde lastInteraction)
    const staleBusinessDays = FOLLOW_UP_RULES.proposal.staleBusinessDays;
    const businessDaysPassed = countBusinessDaysBetween(lastInteractionMs, nowMs);
    const needsFollowUp = businessDaysPassed >= staleBusinessDays;

    if (needsFollowUp) {
      const taskBlock = checkFutureTaskPrecedence('external_contact', 1, 2);
      if (taskBlock) return taskBlock;
    }

    const recommendedDate = addBusinessDays(lastInteractionMs, staleBusinessDays);

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.proposal.reasonCode,
      reason_label: 'Lead em Proposta sem atividade recente (1.º acompanhamento)',
      priority: FOLLOW_UP_RULES.proposal.priority,
      recommended_at: recommendedDate.toISOString(),
      action_type: 'external_contact',
      contact_eligible: true,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: needsFollowUp ? 'active' : 'waiting',
        attempt_number: 1,
        attempt_limit: 2,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: recommendedDate.toISOString()
      }
    };
  }

  // Sinal 5: negotiation
  if (stage === 'negotiation') {
    const staleThreshold = FOLLOW_UP_RULES.negotiation.staleDays;
    const recommendedTimeMs = lastInteractionMs + staleThreshold * 24 * 60 * 60 * 1000;
    const needsFollowUp = daysSinceInteraction >= staleThreshold;

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.negotiation.reasonCode,
      reason_label: FOLLOW_UP_RULES.negotiation.reasonLabel,
      priority: FOLLOW_UP_RULES.negotiation.priority,
      recommended_at: new Date(recommendedTimeMs).toISOString(),
      action_type: 'human_review',
      contact_eligible: false,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: 'not_applicable',
        attempt_number: null,
        attempt_limit: null,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: null
      }
    };
  }

  // Sinal 6: qualified (Calculado via Cadência)
  if (stage === 'qualified') {
    const attemptLimit = 2;

    if (acceptedAttempts >= 2) {
      // Cadência Qualificada exaurida
      return {
        lead_id: leadId,
        needs_follow_up: true,
        reason_code: 'cadence_exhausted',
        reason_label: 'Cadência comercial terminada (2/2 acompanhamentos efetuados)',
        priority: 'normal',
        recommended_at: now.toISOString(),
        action_type: 'human_review',
        contact_eligible: false,
        blocked: false,
        blocked_reason: null,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'exhausted',
          attempt_number: 2,
          attempt_limit: 2,
          accepted_attempts: acceptedAttempts,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: null
        }
      };
    }

    if (acceptedAttempts === 1) {
      // Tentativa #2 em Qualificada: exige >= 4 dias corridos desde last_accepted_at
      const lastAcceptedMs = lastAcceptedAt ? lastAcceptedAt.getTime() : lastInteractionMs;
      const nextEligibleMs = lastAcceptedMs + 4 * 24 * 60 * 60 * 1000;
      const needsFollowUp = nowMs >= nextEligibleMs;

      if (!needsFollowUp) {
        return {
          lead_id: leadId,
          needs_follow_up: false,
          reason_code: FOLLOW_UP_RULES.qualified.reasonCode,
          reason_label: 'Aguardar intervalo de 4 dias após 1.º acompanhamento',
          priority: FOLLOW_UP_RULES.qualified.priority,
          recommended_at: new Date(nextEligibleMs).toISOString(),
          action_type: null,
          contact_eligible: false,
          blocked: false,
          blocked_reason: null,
          cadence: {
            instance_id: cadenceInstanceId,
            status: 'waiting',
            attempt_number: 2,
            attempt_limit: 2,
            accepted_attempts: 1,
            last_accepted_at: lastAcceptedAtISO,
            next_eligible_at: new Date(nextEligibleMs).toISOString()
          }
        };
      }

      const taskBlock = checkFutureTaskPrecedence('external_contact', 2, 2);
      if (taskBlock) return taskBlock;

      return {
        lead_id: leadId,
        needs_follow_up: true,
        reason_code: FOLLOW_UP_RULES.qualified.reasonCode,
        reason_label: 'Elegível para 2.º acompanhamento em Qualificada',
        priority: FOLLOW_UP_RULES.qualified.priority,
        recommended_at: new Date(nextEligibleMs).toISOString(),
        action_type: 'external_contact',
        contact_eligible: true,
        blocked: false,
        blocked_reason: null,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'active',
          attempt_number: 2,
          attempt_limit: 2,
          accepted_attempts: 1,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: new Date(nextEligibleMs).toISOString()
        }
      };
    }

    // acceptedAttempts === 0: Tentativa #1 em Qualificada (>= 2 dias corridos)
    const staleThreshold = FOLLOW_UP_RULES.qualified.staleDays; // 2 dias
    const recommendedTimeMs = lastInteractionMs + staleThreshold * 24 * 60 * 60 * 1000;
    const needsFollowUp = daysSinceInteraction >= staleThreshold;

    if (needsFollowUp) {
      const taskBlock = checkFutureTaskPrecedence('external_contact', 1, 2);
      if (taskBlock) return taskBlock;
    }

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.qualified.reasonCode,
      reason_label: 'Lead qualificada sem agendamento nem atividade recente (1.º acompanhamento)',
      priority: FOLLOW_UP_RULES.qualified.priority,
      recommended_at: new Date(recommendedTimeMs).toISOString(),
      action_type: 'external_contact',
      contact_eligible: true,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: needsFollowUp ? 'active' : 'waiting',
        attempt_number: 1,
        attempt_limit: 2,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: new Date(recommendedTimeMs).toISOString()
      }
    };
  }

  // Sinal 7: new (new_lead_stale com Cadência)
  if (stage === 'new') {
    const attemptLimit = 1;

    if (acceptedAttempts >= 1) {
      // Cadência de Lead Nova exaurida (1/1 acompanhamento efetuado)
      return {
        lead_id: leadId,
        needs_follow_up: true,
        reason_code: 'cadence_exhausted',
        reason_label: 'Cadência de Lead Nova terminada (1/1 acompanhamento efetuado)',
        priority: 'normal',
        recommended_at: now.toISOString(),
        action_type: 'human_review',
        contact_eligible: false,
        blocked: false,
        blocked_reason: null,
        cadence: {
          instance_id: cadenceInstanceId,
          status: 'exhausted',
          attempt_number: 1,
          attempt_limit: 1,
          accepted_attempts: acceptedAttempts,
          last_accepted_at: lastAcceptedAtISO,
          next_eligible_at: null
        }
      };
    }

    const staleThreshold = FOLLOW_UP_RULES.new.staleDays;
    const createdAtMs = lead.created_at ? new Date(lead.created_at).getTime() : lastInteractionMs;
    const daysSinceCreation = (nowMs - createdAtMs) / (1000 * 60 * 60 * 24);
    const recommendedTimeMs = createdAtMs + staleThreshold * 24 * 60 * 60 * 1000;
    const needsFollowUp = daysSinceCreation >= staleThreshold;

    const hasValidEmail = Boolean(
      lead.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())
    );
    const hasFactualNeedOrService = Boolean(
      (lead.need_description && lead.need_description.trim().length > 0) ||
      (lead.primary_service && lead.primary_service.trim().length > 0)
    );

    const isSufficientContext = hasValidEmail && hasFactualNeedOrService;
    const actionType = isSufficientContext ? 'external_contact' : 'human_review';
    const contactEligible = isSufficientContext;

    if (needsFollowUp && actionType === 'external_contact') {
      const taskBlock = checkFutureTaskPrecedence('external_contact', 1, 1);
      if (taskBlock) return taskBlock;
    }

    return {
      lead_id: leadId,
      needs_follow_up: needsFollowUp,
      reason_code: FOLLOW_UP_RULES.new.reasonCode,
      reason_label: FOLLOW_UP_RULES.new.reasonLabel,
      priority: FOLLOW_UP_RULES.new.priority,
      recommended_at: new Date(recommendedTimeMs).toISOString(),
      action_type: actionType,
      contact_eligible: contactEligible,
      blocked: false,
      blocked_reason: null,
      cadence: {
        instance_id: cadenceInstanceId,
        status: needsFollowUp ? 'active' : 'waiting',
        attempt_number: 1,
        attempt_limit: 1,
        accepted_attempts: 0,
        last_accepted_at: null,
        next_eligible_at: new Date(recommendedTimeMs).toISOString()
      }
    };
  }

  // Fallback
  return {
    lead_id: leadId,
    needs_follow_up: false,
    reason_code: null,
    reason_label: null,
    priority: null,
    recommended_at: null,
    action_type: null,
    contact_eligible: false,
    blocked: false,
    blocked_reason: null,
    cadence: null
  };
}
