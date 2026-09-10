/**
 * Módulo centralizado de formatação legível e comercial de taxonomias do sistema LUMYO Admin.
 * Converte códigos/enums da base de dados em linguagem clara para o administrador.
 */

/**
 * Fallback legível genérico para qualquer código ou enum não mapeado explicitamente.
 * Remove underscores/hífens e capitaliza cada palavra (ex: 'some_code' -> 'Some Code').
 */
export function formatFallback(val) {
  if (!val || typeof val !== 'string') return '—';
  const trimmed = val.trim();
  if (!trimmed) return '—';

  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formata o Serviço Principal.
 */
export function formatPrimaryService(service) {
  if (!service) return '—';
  const map = {
    websites: 'Websites',
    automation: 'Automação de Processos',
    ai: 'Inteligência Artificial',
    digital_growth: 'Crescimento Digital',
  };
  return map[service] || formatFallback(service);
}

/**
 * Formata a Variante de Serviço (ex: Websites).
 */
export function formatServiceVariant(variant) {
  if (!variant) return '—';
  const map = {
    landing_page: 'Landing Page',
    institutional_website: 'Website Institucional',
    custom_website: 'Website à Medida',
    ecommerce: 'Loja Online / E-commerce',
  };
  return map[variant] || formatFallback(variant);
}

/**
 * Formata Serviço Principal juntamente com a Variante.
 */
export function formatServiceFull(primaryService, serviceVariant) {
  const base = formatPrimaryService(primaryService);
  if (base === '—') return '—';
  if (primaryService === 'websites' && serviceVariant) {
    const variantFormatted = formatServiceVariant(serviceVariant);
    return `${base} (${variantFormatted})`;
  }
  return base;
}

/**
 * Formata Idioma de preferência.
 */
export function formatLanguage(lang) {
  if (!lang) return 'Português (PT)';
  const lower = lang.toLowerCase();
  if (lower === 'pt') return 'Português (PT)';
  if (lower === 'en') return 'Inglês (EN)';
  return formatFallback(lang);
}

/**
 * Formata o Prazo / Timeline do projeto.
 */
export function formatTimeline(timeline) {
  if (!timeline) return '—';
  const map = {
    immediate: 'Imediato / Urgente',
    asap: 'O mais rapidamente possível',
    within_1_month: 'No prazo de 1 mês',
    '1_to_3_months': 'Entre 1 a 3 meses',
    '3_to_6_months': 'Entre 3 a 6 meses',
    flexible: 'Flexível / A definir',
    exploring: 'Fase de exploração inicial',
  };
  return map[timeline] || formatFallback(timeline);
}

/**
 * Formata a Participação na Decisão.
 */
export function formatDecisionInvolvement(involvement) {
  if (!involvement) return '—';
  const map = {
    sole_decision_maker: 'Decisor único',
    co_decision_maker: 'Co-decisor / Sócio',
    evaluator: 'Avaliador / Pesquisador',
    recommender: 'Recomendador técnico',
    unknown: 'Não informado',
  };
  return map[involvement] || formatFallback(involvement);
}

/**
 * Formata o Nível de Intenção Comercial.
 */
export function formatIntentLevel(intent) {
  if (!intent) return '—';
  const lower = intent.toLowerCase();
  const map = {
    high: 'Elevado',
    medium: 'Médio',
    low: 'Baixo',
    exploratory: 'Exploratório',
    unknown: 'Não determinado',
  };
  return map[lower] || formatFallback(intent);
}

/**
 * Badge e Label de Alinhamento Financeiro.
 */
export function formatAlignmentBadge(status) {
  switch (status) {
    case 'aligned':
      return { label: 'Elevado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'possibly_low':
      return { label: 'Moderado', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'low_alignment':
      return { label: 'Baixo', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: 'Não avaliado', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

/**
 * Formata a Razão do Alinhamento Financeiro em linguagem comercial legível.
 */
export function formatAlignmentReason(reason) {
  if (!reason) return '—';
  const map = {
    budget_at_or_above_minimum: 'Orçamento igual ou superior ao mínimo de referência',
    budget_aligned_project_range: 'Orçamento declarado dentro da faixa de referência para a variante do projeto',
    budget_above_typical_reference: 'Orçamento declarado acima da faixa habitual (avaliação de solução à medida)',
    budget_range_crosses_minimum: 'Faixa orçamental cruza o mínimo de referência recomendado',
    budget_within_20_percent_below_minimum: 'Orçamento ligeiramente abaixo do mínimo de referência (até 20% de tolerância)',
    budget_materially_below_minimum: 'Orçamento substancialmente abaixo do mínimo de referência',
    budget_below_minimum_range: 'Orçamento declarado abaixo do valor de referência habitual',
    budget_not_normalized: 'Orçamento não especificado ou pendente de clarificação',
    service_not_identified: 'Serviço principal não identificado',
    website_variant_not_identified: 'Variante de website não identificada',
    multiple_services_scope_unknown: 'Âmbito composto por múltiplos serviços pendente de cotação',
    budget_values_missing: 'Valores numéricos de orçamento ausentes',
    service_reference_not_found: 'Referência de preço do serviço não encontrada',
    currency_not_supported: 'Moeda declarada não suportada',
    period_mismatch: 'Divergência no período orçamental',
  };
  return map[reason] || formatFallback(reason);
}

/**
 * Badge e Label de Classificação Comercial.
 */
export function formatClassificationBadge(classification) {
  switch (classification) {
    case 'priority':
      return { label: 'Priority', className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    case 'qualified':
      return { label: 'Qualified', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'potential':
      return { label: 'Potential', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'informational':
      return { label: 'Informational', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'disqualified':
      return { label: 'Disqualified', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: formatFallback(classification), className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

/**
 * Formata o Fundamento/Razão da Classificação Comercial.
 */
export function formatClassificationReason(reason) {
  if (!reason) return '—';
  const map = {
    qualification_complete_financial_aligned: 'Qualificação concluída e financeiramente alinhada',
    qualification_complete_financial_possibly_low: 'Qualificação concluída com orçamento moderadamente alinhado',
    qualification_complete_financial_unknown: 'Qualificação concluída com orçamento por avaliar',
    financial_alignment_low: 'Qualificação pendente devido a orçamento abaixo do mínimo de referência',
    contact_and_timeline_missing: 'Pendente de confirmação de dados de contacto e prazo',
    contact_missing: 'Pendente de confirmação de email/contacto',
    timeline_missing: 'Pendente de definição do prazo do projeto',
    website_variant_missing: 'Pendente de seleção da variante de website',
    concrete_need_missing: 'Pendente de especificação detalhada da necessidade',
    service_not_identified: 'Pendente de identificação do serviço desejado',
  };
  return map[reason] || formatFallback(reason);
}

/**
 * Formata o Próximo Passo Comercial.
 */
export function formatNextStep(step) {
  if (!step) return '—';
  const map = {
    booking_pending: 'Marcação de reunião pendente',
    schedule_meeting: 'Agendar reunião de diagnóstico',
    human_contact_requested: 'Contacto humano solicitado pelo visitante',
    follow_up_later: 'Acompanhamento posterior (lead em ponderação)',
    clarify_details: 'Clarificar requisitos do projeto',
    nurture: 'Manter em acompanhamento (Nurture)',
    request_details: 'Solicitar detalhes adicionais',
  };
  return map[step] || formatFallback(step);
}

/**
 * Formata a Origem do Registo.
 */
export function formatSource(source) {
  if (!source) return 'Website';
  const map = {
    website_agent: 'Agente Comercial Lumyo (Website)',
    manual_entry: 'Inserção Manual',
    contact_form: 'Formulário de Contacto',
  };
  return map[source] || formatFallback(source);
}

/**
 * Formata o Estado da Conversa Associada.
 */
export function formatConversationStatus(status) {
  if (!status) return '—';
  const lower = status.toLowerCase();
  const map = {
    active: 'Ativa',
    inactive: 'Inativa',
    completed: 'Concluída',
    escalated: 'Encaminhada para Humano',
    archived: 'Arquivada',
  };
  return map[lower] || formatFallback(status);
}

/**
 * Formata a Etapa Comercial da Conversa.
 */
export function formatCommercialStage(stage) {
  if (!stage) return '—';
  const map = {
    discovery: 'Descoberta / Levantamento de necessidades',
    exploring_need: 'Exploração da necessidade',
    qualifying: 'Qualificação comercial',
    suggesting_booking: 'Proposta de agendamento',
    booking_in_progress: 'Agendamento em curso',
    closed: 'Encerrada',
  };
  return map[stage] || formatFallback(stage);
}

/**
 * Formata o Resultado Primário da Conversa.
 */
export function formatPrimaryOutcome(outcome) {
  if (!outcome) return 'Em progresso';
  const map = {
    meeting_booked: 'Reunião agendada',
    lead_qualified: 'Lead qualificada',
    lead_captured: 'Contacto capturado',
    information_only: 'Esclarecimento informacional',
    human_handoff: 'Encaminhamento para equipa humana',
    not_interested: 'Sem interesse comercial',
    possible_abandonment: 'Possível abandono da sessão',
    abandoned_before_contact: 'Abandonado antes de indicar contacto',
    abandoned_during_qualification: 'Abandonado durante a qualificação',
    abandoned_during_booking: 'Abandonado durante o agendamento',
    technical_failure: 'Falha técnica na sessão',
    spam_detected: 'Mensagem irrelevante / Spam',
  };
  return map[outcome] || formatFallback(outcome);
}

/**
 * Formata valores orçamentais.
 */
export function formatBudget(lead) {
  if (!lead) return '—';
  const min = lead.stated_budget_min;
  const max = lead.stated_budget_max;
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${Number(min).toLocaleString('pt-PT')}€ - ${Number(max).toLocaleString('pt-PT')}€`;
  }
  if (min !== null && min !== undefined) {
    return `>= ${Number(min).toLocaleString('pt-PT')}€`;
  }
  if (max !== null && max !== undefined) {
    return `<= ${Number(max).toLocaleString('pt-PT')}€`;
  }
  if (lead.stated_budget_raw) {
    return lead.stated_budget_raw;
  }
  return '—';
}

/**
 * Formata o Serviço Principal (alias).
 */
export function formatServiceType(service) {
  return formatPrimaryService(service);
}

/**
 * Formata a Classificação da Lead (alias).
 */
export function formatLeadClassification(classification) {
  if (!classification) return '—';
  const badge = formatClassificationBadge(classification);
  return badge.label || formatFallback(classification);
}

/**
 * Formata o Alinhamento Financeiro da Lead (alias).
 */
export function formatFinancialAlignment(status) {
  if (!status) return '—';
  const badge = formatAlignmentBadge(status);
  return badge.label || formatFallback(status);
}

/**
 * Formata datas em PT com hora.
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Formata Etapa do Pipeline CRM com label em Português e estilo de badge.
 */
export function formatPipelineStage(stage) {
  if (!stage) return { label: '—', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  const map = {
    new: { label: 'Novo', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    qualified: { label: 'Qualificado', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    meeting_scheduled: { label: 'Reunião Agendada', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    meeting_completed: { label: 'Reunião Realizada', className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    proposal: { label: 'Proposta', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    negotiation: { label: 'Negociação', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    won: { label: 'Ganho', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
    lost: { label: 'Perdido', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  };
  return map[stage] || { label: formatFallback(stage), className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
}

/**
 * Formata a Origem de Transição do Pipeline para linguagem clara em Português.
 */
export function formatPipelineSource(source) {
  if (!source) return 'Sistema';
  const map = {
    agent: 'Agente IA',
    calendar_webhook: 'Calendário',
    admin_user: 'Alteração manual',
    system: 'Sistema',
  };
  return map[source] || formatFallback(source);
}

/**
 * Formata o Estado de um Agendamento de Reunião (Calendar Booking).
 */
export function formatBookingStatus(status) {
  if (!status) return { label: '—', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  const lower = status.toLowerCase();
  const map = {
    confirmed: { label: 'Confirmada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    rescheduled: { label: 'Reagendada', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    cancelled: { label: 'Cancelada', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  };
  return map[lower] || { label: formatFallback(status), className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
}

