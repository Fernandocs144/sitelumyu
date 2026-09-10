import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Building2,
  ExternalLink,
  MessageSquare,
  Users as UsersIcon,
  ChevronRight,
  Info,
  CalendarCheck,
  History,
} from 'lucide-react';
import { formatPrimaryService } from '../../utils/adminFormatters';
import {
  getValidTimeZone,
  formatBookingDate,
  formatBookingTimeRange,
  getStatusLabel,
} from '../../utils/adminBookingHelpers';

export { getValidTimeZone, formatBookingDate, formatBookingTimeRange };

/**
 * Renderiza o Badge visual de Estado.
 */
function renderStatusBadge(status) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span>Confirmada</span>
        </span>
      );
    case 'rescheduled':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
          <span>Reagendada</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
          <span>Cancelada</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
          <span>Pendente</span>
        </span>
      );
  }
}

/**
 * Componente interno para uma secção de grupo (Próximas Reuniões ou Histórico).
 */
function BookingsGroupSection({ title, icon: Icon, count, bookings, emptyMessage, onSelectBooking }) {
  return (
    <div className="space-y-3">
      {/* CABEÇALHO DO GRUPO */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-purple-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h2>
          <span className="text-xs text-slate-500 font-medium">({count})</span>
        </div>
      </div>

      {/* ESTADO VAZIO DO GRUPO */}
      {bookings.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center text-xs text-slate-400 space-y-1">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* TABELA DESKTOP */}
          <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Data e Hora</th>
                  <th scope="col" className="py-3.5 px-4">Participante</th>
                  <th scope="col" className="py-3.5 px-4">Lead / Empresa</th>
                  <th scope="col" className="py-3.5 px-4">Serviço</th>
                  <th scope="col" className="py-3.5 px-4">Estado</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {bookings.map((b) => {
                  const leadId = b.lead_id || b.lead?.id;
                  const convId = b.conversation_id || b.conversation?.id;
                  const leadName = b.lead?.name;
                  const companyName = b.lead?.company_name;
                  const primaryService = b.lead?.primary_service;

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* DATA E HORA */}
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-100">
                            {formatBookingDate(b.start_time, b.timezone)}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500 inline mr-1" />
                            {formatBookingTimeRange(b.start_time, b.end_time, b.timezone)}
                          </span>
                        </div>
                      </td>

                      {/* PARTICIPANTE */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-200 truncate">{b.attendee_name || '—'}</span>
                          <span className="text-[11px] text-slate-400 truncate">{b.attendee_email || '—'}</span>
                        </div>
                      </td>

                      {/* LEAD / EMPRESA */}
                      <td className="py-3.5 px-4">
                        {leadName ? (
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-indigo-300 truncate">{leadName}</span>
                            {companyName ? (
                              <span className="text-[11px] text-slate-400 truncate">{companyName}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Sem lead associado</span>
                        )}
                      </td>

                      {/* SERVIÇO */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">
                          {primaryService ? formatPrimaryService(primaryService) : '—'}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(b.status)}
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {leadId && (
                            <Link
                              to={`/admin/leads/${leadId}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-medium transition-all"
                            >
                              <UsersIcon className="w-3 h-3 text-indigo-400" />
                              <span>Lead</span>
                            </Link>
                          )}

                          {convId && (
                            <Link
                              to={`/admin/conversas/${convId}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-medium transition-all"
                            >
                              <MessageSquare className="w-3 h-3 text-purple-400" />
                              <span>Conversa</span>
                            </Link>
                          )}

                          <button
                            onClick={() => onSelectBooking?.(b)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition-all"
                          >
                            <span>Detalhes</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CARDS MOBILE */}
          <div className="block md:hidden space-y-3">
            {bookings.map((b) => {
              const leadId = b.lead_id || b.lead?.id;
              const convId = b.conversation_id || b.conversation?.id;
              const leadName = b.lead?.name;
              const companyName = b.lead?.company_name;
              const primaryService = b.lead?.primary_service;

              return (
                <div
                  key={b.id}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl"
                >
                  {/* CABEÇALHO DO CARD */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-white">
                        {formatBookingDate(b.start_time, b.timezone)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                        {formatBookingTimeRange(b.start_time, b.end_time, b.timezone)}
                      </span>
                    </div>
                    <div>{renderStatusBadge(b.status)}</div>
                  </div>

                  {/* CORPO DO CARD */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2 text-slate-200 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{b.attendee_name || 'Participante sem nome'}</span>
                    </div>

                    {b.attendee_email && (
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{b.attendee_email}</span>
                      </div>
                    )}

                    {leadName && (
                      <div className="flex items-center space-x-2 text-slate-300 pt-1">
                        <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate font-medium text-indigo-300">
                          {leadName} {companyName ? `(${companyName})` : ''}
                        </span>
                      </div>
                    )}

                    {primaryService && (
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        Serviço: <span className="text-slate-300 font-medium">{formatPrimaryService(primaryService)}</span>
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ E AÇÕES DO CARD MOBILE */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.06]">
                    {leadId && (
                      <Link
                        to={`/admin/leads/${leadId}`}
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-medium"
                      >
                        <UsersIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Lead</span>
                      </Link>
                    )}

                    {convId && (
                      <Link
                        to={`/admin/conversas/${convId}`}
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        <span>Conversa</span>
                      </Link>
                    )}

                    <button
                      onClick={() => onSelectBooking?.(b)}
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium"
                    >
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Componente Principal da Vista em Lista Real de Reuniões.
 */
export default function AdminBookingsListView({ bookings = [], onSelectBooking }) {
  const nowMs = Date.now();

  const upcomingBookings = [];
  const historyBookings = [];

  (bookings || []).forEach((b) => {
    const isCancelled = b.status === 'cancelled';
    const startMs = b.start_time ? new Date(b.start_time).getTime() : 0;
    const isFuture = startMs >= nowMs;

    if (isFuture && !isCancelled) {
      upcomingBookings.push(b);
    } else {
      historyBookings.push(b);
    }
  });

  // Ordenar Próximas Reuniões ASC (mais recente primeiro)
  upcomingBookings.sort((a, b) => {
    const tA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const tB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return tA - tB;
  });

  // Ordenar Histórico DESC (mais recente primeiro)
  historyBookings.sort((a, b) => {
    const tA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const tB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return tB - tA;
  });

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3 backdrop-blur-xl max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Sem agendamentos</h3>
        <p className="text-xs text-slate-400">
          Ainda não existem agendamentos registados no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* GRUPO 1: PRÓXIMAS REUNIÕES */}
      <BookingsGroupSection
        title="Próximas Reuniões"
        icon={CalendarCheck}
        count={upcomingBookings.length}
        bookings={upcomingBookings}
        emptyMessage="Nenhuma reunião agendada."
        onSelectBooking={onSelectBooking}
      />

      {/* GRUPO 2: HISTÓRICO DE REUNIÕES */}
      <BookingsGroupSection
        title="Histórico de Reuniões"
        icon={History}
        count={historyBookings.length}
        bookings={historyBookings}
        emptyMessage="Ainda não existe histórico de reuniões."
        onSelectBooking={onSelectBooking}
      />
    </div>
  );
}
