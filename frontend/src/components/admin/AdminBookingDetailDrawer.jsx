import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  User,
  Mail,
  Building2,
  Briefcase,
  Award,
  MessageSquare,
  Users as UsersIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  formatPrimaryService,
  formatLeadClassification,
  formatClassificationBadge,
  formatCommercialStage,
  formatPrimaryOutcome,
} from '../../utils/adminFormatters';
import {
  getValidTimeZone,
  getBookingDateKey,
  formatBookingTimeRange,
  formatDateKeyToPT,
  getStatusLabel,
} from '../../utils/adminBookingHelpers';

/**
 * Renderiza o Badge visual de Estado da Reunião.
 */
function renderStatusBadge(status) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>Confirmada</span>
        </span>
      );
    case 'rescheduled':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>Reagendada</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          <span>Cancelada</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span>Pendente</span>
        </span>
      );
  }
}

export default function AdminBookingDetailDrawer({ booking, isOpen, onClose }) {
  // BLOQUEIO DO SCROLL DO BODY QUANDO O DRAWER ESTÁ ABERTO
  useEffect(() => {
    if (isOpen && booking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, booking]);

  // ATALHO DA TECLA ESCAPE PARA FECHAR
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const timezone = getValidTimeZone(booking.timezone);
  const dateKey = getBookingDateKey(booking.start_time, timezone);
  const formattedDate = formatDateKeyToPT(dateKey);
  const formattedTimeRange = formatBookingTimeRange(booking.start_time, booking.end_time, timezone);

  const lead = booking.lead;
  const conversation = booking.conversation;
  const leadId = booking.lead_id || lead?.id;
  const convId = booking.conversation_id || conversation?.id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* BACKDROP / OVERLAY CLICÁVEL */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* PAINEL LATERAL (DRAWER DESKTOP 460PX / FULL-SCREEN MOBILE) */}
      <aside
        className="relative w-full md:w-[460px] h-full bg-slate-900 border-l border-white/[0.1] shadow-2xl flex flex-col z-50 overflow-y-auto transform transition-all duration-200 ease-out text-slate-200"
        aria-label="Detalhes da Reunião"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. CABEÇALHO DO DRAWER */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight">Reunião</h2>
            {renderStatusBadge(booking.status)}
            {booking.provider === 'manual' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Reunião Manual (CRM)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar detalhes da reunião"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DE CONTEÚDO COM SCROLL INTERNO */}
        <div className="p-6 space-y-6 flex-1">
          {/* 2. DATA E HORA */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span>Data e Hora</span>
            </div>

            <div className="space-y-1.5 pl-6">
              <p className="text-sm font-bold text-white capitalize">{formattedDate || '—'}</p>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{formattedTimeRange}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Fuso horário: {timezone}</span>
              </div>
            </div>
          </div>

          {/* 3. PARTICIPANTE */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <User className="w-4 h-4 shrink-0" />
              <span>Participante</span>
            </div>

            <div className="space-y-2 pl-6">
              <div className="text-sm font-bold text-white">{booking.attendee_name || 'Sem nome indicado'}</div>

              {booking.attendee_email ? (
                <a
                  href={`mailto:${booking.attendee_email}`}
                  className="inline-flex items-center space-x-2 text-xs text-indigo-300 hover:text-indigo-200 transition-colors font-medium"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="underline">{booking.attendee_email}</span>
                </a>
              ) : (
                <div className="text-xs text-slate-500">Sem email registado</div>
              )}
            </div>
          </div>

          {/* 4. CONTEXTO COMERCIAL (LEAD) */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Contexto Comercial</span>
            </div>

            {lead ? (
              <div className="space-y-3 pl-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nome da Lead</span>
                  <span className="font-bold text-white text-sm">{lead.name || '—'}</span>
                </div>

                {lead.company_name && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Empresa</span>
                    <span className="font-semibold text-slate-200">{lead.company_name}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">Serviço de Interesse</span>
                  <span className="font-semibold text-purple-300">
                    {formatPrimaryService(lead.primary_service)}
                  </span>
                </div>

                {lead.lead_classification && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Classificação Comercial</span>
                    {(() => {
                      const badge = formatClassificationBadge(lead.lead_classification);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-6 text-xs text-slate-400 py-1">
                Esta reunião não está associada a um lead.
              </div>
            )}
          </div>

          {/* 5. CONTEXTO DA CONVERSA */}
          {conversation && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Contexto da Conversa</span>
              </div>

              <div className="space-y-3 pl-6 text-xs">
                {conversation.commercial_stage && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Etapa Comercial</span>
                    <span className="font-semibold text-slate-200">
                      {formatCommercialStage(conversation.commercial_stage)}
                    </span>
                  </div>
                )}

                {conversation.primary_outcome && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Resultado da Sessão</span>
                    <span className="font-semibold text-blue-300">
                      {formatPrimaryOutcome(conversation.primary_outcome)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5.5 NOTAS / OBSERVAÇÕES */}
          {booking.provider_metadata?.notes && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2 backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notas / Observações
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap pl-2">
                {booking.provider_metadata.notes}
              </p>
            </div>
          )}
        </div>

        {/* 6. AÇÕES NO RODAPÉ DO DRAWER */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-6 border-t border-white/[0.08] flex items-center justify-end space-x-3">
          {leadId && (
            <Link
              to={`/admin/leads/${leadId}`}
              onClick={onClose}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-semibold transition-all"
            >
              <UsersIcon className="w-4 h-4 text-indigo-400" />
              <span>Ver Lead</span>
            </Link>
          )}

          {convId && (
            <Link
              to={`/admin/conversas/${convId}`}
              onClick={onClose}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Ver Conversa</span>
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
