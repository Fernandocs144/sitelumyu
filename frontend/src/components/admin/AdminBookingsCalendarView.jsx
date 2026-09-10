import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MessageSquare,
  Users as UsersIcon,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatPrimaryService } from '../../utils/adminFormatters';
import {
  getValidTimeZone,
  getBookingDateKey,
  formatBookingTime,
  formatBookingTimeRange,
  formatDateKeyToPT,
  getStatusLabel,
} from '../../utils/adminBookingHelpers';

const DAYS_OF_WEEK_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Renderiza o Badge visual de Estado.
 */
function renderStatusBadge(status) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>Confirmada</span>
        </span>
      );
    case 'rescheduled':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>Reagendada</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          <span>Cancelada</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span>Pendente</span>
        </span>
      );
  }
}

export default function AdminBookingsCalendarView({ bookings = [], onSelectBooking, selectedBooking }) {
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showCancelled, setShowCancelled] = useState(false);

  // Hoje no formato YYYY-MM-DD em Europe/Lisbon
  const todayKey = useMemo(() => getBookingDateKey(new Date().toISOString(), 'Europe/Lisbon'), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Agrupar bookings por dateKey (YYYY-MM-DD)
  const bookingsByDateKey = useMemo(() => {
    const map = {};
    (bookings || []).forEach((b) => {
      if (!showCancelled && b.status === 'cancelled') return;
      const key = getBookingDateKey(b.start_time, b.timezone);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });

    // Ordenar bookings de cada dia por hora de início ASC
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const tA = a.start_time ? new Date(a.start_time).getTime() : 0;
        const tB = b.start_time ? new Date(b.start_time).getTime() : 0;
        return tA - tB;
      });
    });

    return map;
  }, [bookings, showCancelled]);

  // NAVEGAÇÃO DE DATAS (< Hoje >)
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(todayKey);
  };

  // CÁLCULO DOS DIAS DO MÊS (Grelha 7 colunas - Segunda a Domingo)
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    // getDay(): Dom=0, Seg=1, Ter=2 ... Sab=6
    // Ajustar para Seg=0 ... Dom=6
    const firstDayOfWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const startDate = new Date(year, month, 1 - firstDayOfWeekIndex);

    // Determinar se o mês precisa de 35 ou 42 células
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = firstDayOfWeekIndex + totalDaysInMonth > 35 ? 42 : 35;

    const cells = [];
    let d = new Date(startDate);

    for (let i = 0; i < totalCells; i++) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayNum}`;
      const isCurrentMonth = d.getMonth() === month;
      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDateKey;

      cells.push({
        dateObj: new Date(d),
        dateKey,
        dayNumber: d.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        bookings: bookingsByDateKey[dateKey] || [],
      });

      d.setDate(d.getDate() + 1);
    }

    return cells;
  }, [currentDate, todayKey, selectedDateKey, bookingsByDateKey]);

  // CÁLCULO DOS DIAS DA SEMANA (Segunda a Domingo)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    let d = new Date(monday);

    for (let i = 0; i < 7; i++) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayNum}`;

      days.push({
        dateObj: new Date(d),
        dateKey,
        dayNumber: d.getDate(),
        dayLabel: DAYS_OF_WEEK_SHORT[i],
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateKey,
        bookings: bookingsByDateKey[dateKey] || [],
      });

      d.setDate(d.getDate() + 1);
    }

    return days;
  }, [currentDate, todayKey, selectedDateKey, bookingsByDateKey]);

  // LABEL HEADER DO PERÍODO
  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return new Intl.DateTimeFormat('pt-PT', {
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
    } else {
      if (weekDays.length === 0) return '';
      const start = weekDays[0];
      const end = weekDays[6];
      const startStr = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' }).format(start.dateObj);
      const endStr = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }).format(end.dateObj);
      return `${startStr} – ${endStr}`;
    }
  }, [viewMode, currentDate, weekDays]);

  // Reuniões do dia selecionado
  const selectedDayBookings = useMemo(() => {
    return bookingsByDateKey[selectedDateKey] || [];
  }, [bookingsByDateKey, selectedDateKey]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER / CONTROLES DO CALENDÁRIO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/[0.03] border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl">
        {/* NAVEGAÇÃO (< HOJE > + MÊS/ANO) */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={handlePrev}
              aria-label="Período anterior"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              aria-label="Período seguinte"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-white capitalize tracking-tight">
            {periodLabel}
          </h2>
        </div>

        {/* OPÇÕES (VISTA MÊS/SEMANA + CHECKBOX CANCELADAS) */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          {/* CHECKBOX MOSTRAR CANCELADAS */}
          <label className="inline-flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-white/[0.02] hover:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.06] transition-all">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500/50 w-3.5 h-3.5"
            />
            <span>Mostrar canceladas</span>
          </label>

          {/* ALTERNADOR MÊS / SEMANA */}
          <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP — VISTA MENSAL (7 COLUNAS) */}
      {viewMode === 'month' && (
        <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* CABEÇALHO DOS DIAS DA SEMANA */}
          <div className="grid grid-cols-7 border-b border-white/[0.08] bg-white/[0.02] text-center text-xs font-semibold text-slate-400 py-3 uppercase tracking-wider">
            {DAYS_OF_WEEK_SHORT.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* GRELHA MENSAL */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.06] bg-white/[0.01]">
            {monthGridDays.map((cell) => {
              const maxDisplay = 3;
              const hasOverflow = cell.bookings.length > maxDisplay;
              const displayedBookings = hasOverflow ? cell.bookings.slice(0, 2) : cell.bookings;
              const overflowCount = cell.bookings.length - 2;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                    !cell.isCurrentMonth ? 'bg-black/20 opacity-40' : 'hover:bg-white/[0.02]'
                  } ${cell.isSelected ? 'ring-1 ring-purple-500/50 bg-purple-500/[0.03]' : ''}`}
                >
                  {/* CABEÇALHO DO DIA */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        cell.isToday
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 font-bold'
                          : cell.isSelected
                          ? 'bg-white/10 text-purple-300 font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.bookings.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded-md bg-white/[0.04]">
                        {cell.bookings.length}
                      </span>
                    )}
                  </div>

                  {/* LISTA DE REUNIÕES DA CÉLULA */}
                  <div className="space-y-1 flex-1">
                    {displayedBookings.map((b) => {
                      const isSelectedBooking = selectedBooking?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateKey(cell.dateKey);
                            onSelectBooking?.(b);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all truncate flex items-center justify-between gap-1 border ${
                            isSelectedBooking
                              ? 'bg-purple-600 text-white border-purple-400'
                              : b.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                              : b.status === 'rescheduled'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'
                              : 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20 hover:bg-indigo-500/20'
                          }`}
                          title={`${formatBookingTime(b.start_time, b.timezone)} ${b.attendee_name || ''} (${getStatusLabel(b.status)})`}
                        >
                          <span className="truncate">
                            <span className="font-semibold mr-1">{formatBookingTime(b.start_time, b.timezone)}</span>
                            {b.attendee_name || 'Participante'}
                          </span>
                          {b.status === 'cancelled' && (
                            <span className="text-[9px] font-bold text-rose-400 shrink-0">Canc.</span>
                          )}
                        </div>
                      );
                    })}

                    {/* INDICADOR DE OVERFLOW (+N REUNIÕES) */}
                    {hasOverflow && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(cell.dateKey);
                        }}
                        className="w-full text-left px-2 py-0.5 text-[10px] font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-all"
                      >
                        +{overflowCount} reuniões
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DESKTOP / GENERAL — VISTA SEMANAL (AGENDA COMERCIAL DE 7 DIAS) */}
      {viewMode === 'week' && (
        <div className="hidden md:grid grid-cols-7 gap-3">
          {weekDays.map((day) => {
            return (
              <div
                key={day.dateKey}
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={`bg-white/[0.03] border rounded-2xl p-3 space-y-3 flex flex-col justify-between cursor-pointer transition-all ${
                  day.isSelected
                    ? 'border-purple-500/50 ring-1 ring-purple-500/30 bg-purple-500/[0.03]'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {/* CABEÇALHO DO DIA NA SEMANA */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block">{day.dayLabel}</span>
                    <span
                      className={`text-base font-bold ${
                        day.isToday ? 'text-purple-400' : 'text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  {day.bookings.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {day.bookings.length}
                    </span>
                  )}
                </div>

                {/* REUNIÕES DO DIA */}
                <div className="space-y-2 flex-1 min-h-[140px]">
                  {day.bookings.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-6">Nenhuma reunião</p>
                  ) : (
                    day.bookings.map((b) => {
                      const isSelectedBooking = selectedBooking?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateKey(day.dateKey);
                            onSelectBooking?.(b);
                          }}
                          className={`p-2 rounded-xl border text-xs space-y-1 transition-all ${
                            isSelectedBooking
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-purple-300">
                              {formatBookingTime(b.start_time, b.timezone)}
                            </span>
                            {renderStatusBadge(b.status)}
                          </div>
                          <p className="font-semibold text-white truncate text-[11px]">{b.attendee_name || '—'}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MOBILE (< md) — FAIXA HORIZONTAL DE DIAS + AGENDA VERTICAL */}
      <div className="block md:hidden space-y-4">
        {/* FAIXA HORIZONTAL DOS DIAS */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-2 backdrop-blur-xl">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {weekDays.map((day) => {
              const isSel = day.dateKey === selectedDateKey;
              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className={`flex flex-col items-center min-w-[54px] py-2.5 px-2 rounded-xl text-xs font-medium transition-all shrink-0 border ${
                    isSel
                      ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-lg shadow-purple-500/20'
                      : day.isToday
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : 'bg-white/[0.02] text-slate-300 border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-[10px] uppercase opacity-80">{day.dayLabel}</span>
                  <span className="text-sm font-bold mt-0.5">{day.dayNumber}</span>
                  {day.bookings.length > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSel ? 'bg-white' : 'bg-purple-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* AGENDA VERTICAL DO DIA SELECIONADO MOBILE */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {formatDateKeyToPT(selectedDateKey)}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {selectedDayBookings.length} {selectedDayBookings.length === 1 ? 'reunião' : 'reuniões'}
            </span>
          </div>

          {selectedDayBookings.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Nenhuma reunião neste dia.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDayBookings.map((b) => {
                const leadId = b.lead_id || b.lead?.id;
                const convId = b.conversation_id || b.conversation?.id;
                const leadName = b.lead?.name;

                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking?.(b)}
                    className="bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 rounded-xl p-3 space-y-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                        {formatBookingTimeRange(b.start_time, b.end_time, b.timezone)}
                      </span>
                      {renderStatusBadge(b.status)}
                    </div>

                    <div className="text-xs">
                      <p className="font-semibold text-white">{b.attendee_name || 'Participante sem nome'}</p>
                      <p className="text-slate-400 text-[11px]">{b.attendee_email || '—'}</p>
                    </div>

                    {leadName && (
                      <p className="text-[11px] text-indigo-300 font-medium pt-1">
                        Lead: {leadName}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. ÁREA CONTEXTUAL DO DIA SELECIONADO (DESKTOP) */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white capitalize">
              {formatDateKeyToPT(selectedDateKey)}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {selectedDayBookings.length} {selectedDayBookings.length === 1 ? 'reunião agendada' : 'reuniões agendadas'}
          </span>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Nenhuma reunião agendada para este dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayBookings.map((b) => {
              const leadId = b.lead_id || b.lead?.id;
              const convId = b.conversation_id || b.conversation?.id;
              const leadName = b.lead?.name;
              const companyName = b.lead?.company_name;
              const isSelected = selectedBooking?.id === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking?.(b)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400 inline mr-1" />
                      {formatBookingTimeRange(b.start_time, b.end_time, b.timezone)}
                    </span>
                    {renderStatusBadge(b.status)}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{b.attendee_name || 'Participante sem nome'}</h4>
                    <p className="text-[11px] text-slate-400">{b.attendee_email || '—'}</p>
                  </div>

                  {leadName && (
                    <div className="text-[11px] text-indigo-300 font-medium">
                      Lead: {leadName} {companyName ? `(${companyName})` : ''}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px]">
                    <div className="flex items-center space-x-2">
                      {leadId && <span className="text-slate-400">Lead #{leadId.slice(0, 8)}...</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBooking?.(b);
                      }}
                      className="text-purple-300 hover:text-white font-semibold transition-colors"
                    >
                      Selecionar →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
