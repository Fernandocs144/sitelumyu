/**
 * Formatadores e utilitários de apresentação em PT-PT para a UI do Acompanhamento Comercial (Fase 7H.1).
 */

export const STAGE_LABELS_PT = {
  new: 'Novo',
  qualified: 'Qualificado',
  meeting_scheduled: 'Reunião Agendada',
  meeting_completed: 'Reunião Realizada',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganha',
  lost: 'Perdida'
};

export const STAGE_BADGE_CLASSES = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  meeting_scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  meeting_completed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  proposal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  negotiation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  won: 'bg-green-500/10 text-green-400 border-green-500/20',
  lost: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

export const PRIORITY_LABELS_PT = {
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa'
};

export const PRIORITY_BADGE_CLASSES = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

/**
 * Formata datas ISO em formato de data curta amigável PT-PT.
 * Ex: "14 set. 2026" ou "14 set."
 */
export function formatDatePT(isoString, includeYear = true) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
  } catch (e) {
    return isoString;
  }
}

/**
 * Formata data/hora em PT-PT (ex: "14 set. 2026 às 15:30").
 */
export function formatDateTimePT(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dateStr = formatDatePT(isoString, true);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateStr} às ${hours}:${minutes}`;
  } catch (e) {
    return isoString;
  }
}

/**
 * Calcula data relativa em português (ex: "Hoje", "Amanhã", "Em 3 dias", "Há 4 dias").
 */
export function formatRelativeDatePT(isoString, now = new Date()) {
  if (!isoString) return '—';
  try {
    const target = new Date(isoString);
    if (isNaN(target.getTime())) return isoString;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 1) return `Em ${diffDays} dias`;
    if (diffDays < -1) return `Há ${Math.abs(diffDays)} dias`;
  } catch (e) {
    return isoString;
  }
}

/**
 * Devolve a descrição natural em PT-PT para o progresso da cadência comercial.
 */
export function formatCadenceProgressPT(cadence, stage, reasonCode) {
  if (!cadence) {
    if (stage === 'new') return 'Contacto inicial';
    return null;
  }

  const { status, attempt_number, attempt_limit, accepted_attempts } = cadence;

  if (status === 'exhausted') {
    if (stage === 'proposal') return 'Cadência da proposta terminada';
    return `${accepted_attempts || 2} de ${attempt_limit || 2} acompanhamentos realizados`;
  }

  if (stage === 'proposal') {
    if (status === 'waiting') {
      return `Em aguardo de proposta`;
    }
    if (attempt_number === 1) return '1.º acompanhamento da proposta';
    if (attempt_number === 2) return '2.º acompanhamento da proposta';
    return `Acompanhamento de proposta`;
  }

  if (stage === 'new') {
    if (accepted_attempts >= 1) return 'Contacto inicial realizado';
    return 'Contacto inicial';
  }

  // Stage Qualified ou genérico
  if (attempt_limit && attempt_limit > 1) {
    if (attempt_number) {
      return `${attempt_number}.º acompanhamento de ${attempt_limit}`;
    }
    if (accepted_attempts !== undefined) {
      return `${accepted_attempts} de ${attempt_limit} acompanhamentos realizados`;
    }
  }

  if (attempt_number) {
    return `${attempt_number}.º acompanhamento`;
  }

  return 'Acompanhamento comercial';
}
