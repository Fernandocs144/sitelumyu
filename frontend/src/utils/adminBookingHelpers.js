/**
 * Utility functions for LUMYO Admin Bookings (Calendar and List views)
 */

/**
 * Retorna um fuso horário válido com fallback seguro para Europe/Lisbon.
 */
export function getValidTimeZone(tzStr) {
  if (!tzStr || typeof tzStr !== 'string') return 'Europe/Lisbon';
  const trimmed = tzStr.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch (e) {
    return 'Europe/Lisbon';
  }
}

/**
 * Extrai a chave de data no formato YYYY-MM-DD considerando o fuso horário especificado.
 */
export function getBookingDateKey(dateStr, timeZoneStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const tz = getValidTimeZone(timeZoneStr);
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: tz,
    });
    const parts = formatter.formatToParts(d);
    let year = '', month = '', day = '';
    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
    }
    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
}

/**
 * Formata apenas a hora (ex: "10:30") no fuso horário correto.
 */
export function formatBookingTime(dateStr, timeZoneStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const tz = getValidTimeZone(timeZoneStr);
    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    }).format(d);
  } catch (e) {
    return '—';
  }
}

/**
 * Formata a data num formato legível em português (ex: "18 set. 2026").
 */
export function formatBookingDate(dateStr, timeZoneStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const tz = getValidTimeZone(timeZoneStr);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: tz,
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formata o intervalo de horas (ex: "12:30 – 13:00").
 */
export function formatBookingTimeRange(startTimeStr, endTimeStr, timeZoneStr) {
  if (!startTimeStr) return '—';
  try {
    const startD = new Date(startTimeStr);
    if (isNaN(startD.getTime())) return '—';
    const tz = getValidTimeZone(timeZoneStr);

    const startFormatted = new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    }).format(startD);

    if (!endTimeStr) return startFormatted;

    const endD = new Date(endTimeStr);
    if (isNaN(endD.getTime())) return startFormatted;

    const endFormatted = new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    }).format(endD);

    return `${startFormatted} – ${endFormatted}`;
  } catch (e) {
    return '—';
  }
}

/**
 * Formata uma data YYYY-MM-DD em português (ex: "Sexta-feira, 18 de setembro de 2026").
 */
export function formatDateKeyToPT(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return '';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts;
  if (!y || !m || !d) return dateKey;
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateObj);
}

/**
 * Mapeia o estado para a label textual em Português.
 */
export function getStatusLabel(status) {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'rescheduled':
      return 'Reagendada';
    case 'cancelled':
      return 'Cancelada';
    case 'pending':
    default:
      return 'Pendente';
  }
}
