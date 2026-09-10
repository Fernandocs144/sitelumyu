import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Building,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  DollarSign,
  Globe,
  Hash,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Bot,
  User,
} from 'lucide-react';
import {
  formatConversationStatus,
  formatCommercialStage,
  formatPrimaryOutcome,
  formatServiceType,
  formatLeadClassification,
  formatFinancialAlignment,
  formatLanguage,
  formatDate,
} from '../../utils/adminFormatters';

/**
 * Badge visual de resultado da conversa.
 */
function formatOutcomeBadge(outcome) {
  if (!outcome) {
    return { label: 'Em Progresso', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  }
  const label = formatPrimaryOutcome(outcome);
  switch (outcome) {
    case 'meeting_booked':
    case 'lead_qualified':
      return { label, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'lead_captured':
      return { label, className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    case 'human_handoff':
      return { label, className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    case 'not_interested':
      return { label, className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    case 'possible_abandonment':
    case 'abandoned_before_contact':
    case 'abandoned_during_qualification':
    case 'abandoned_during_booking':
      return { label, className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    default:
      return { label, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

export default function AdminConversationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversationDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/conversations/${id}`, {
        credentials: 'same-origin',
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar o detalhe da conversa');
      }

      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Falha ao comunicar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConversationDetail();
  }, [fetchConversationDetail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">A carregar transcrição da conversa...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/admin/conversas')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar às Conversas</span>
        </button>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white">Não foi possível carregar a conversa</h2>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{error || 'Conversa não encontrada.'}</p>
          <button
            onClick={fetchConversationDetail}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  const lead = conversation.lead;
  const outcomeBadge = formatOutcomeBadge(conversation.primary_outcome);
  const visitorName = lead?.name || lead?.company_name || 'Visitante não identificado';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* NAVEGAÇÃO DE VOLTAR E HEADER */}
      <div className="space-y-4 pb-6 border-b border-white/[0.08]">
        <button
          onClick={() => navigate('/admin/conversas')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar às Conversas</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              {lead ? (
                <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <UserX className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <h1 className="text-2xl font-bold text-white tracking-tight">{visitorName}</h1>
            </div>
            {lead?.email && <p className="text-xs text-slate-400 pl-7">{lead.email}</p>}
          </div>

          {/* BADGES DE ESTADO E ETAPA */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">
              {formatConversationStatus(conversation.status)}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {formatCommercialStage(conversation.commercial_stage)}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${outcomeBadge.className}`}>
              {outcomeBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: TRANSCRIÇÃO + SIDEBAR METADADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ÁREA DA TRANSCRIÇÃO DE MENSAGENS (2 COLUNAS EM DESKTOP) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">Transcrição da Conversa</h2>
              </div>
              <span className="text-[11px] text-slate-400">
                {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
              </span>
            </div>

            {/* LISTA CRONOLÓGICA DE MENSAGENS */}
            <div className="space-y-4 pt-2">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhuma mensagem registada nesta conversa.
                </div>
              ) : (
                messages.map((msg) => {
                  const isVisitor = msg.sender_role === 'visitor';

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${
                        isVisitor ? 'justify-start' : 'justify-start'
                      }`}
                    >
                      {/* ÍCONE DE AUTOR */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isVisitor
                            ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {isVisitor ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* BALÃO DE MENSAGEM */}
                      <div
                        className={`flex-1 rounded-2xl p-4 space-y-1.5 border text-xs leading-relaxed max-w-2xl ${
                          isVisitor
                            ? 'bg-white/[0.04] border-white/[0.08] text-slate-200'
                            : 'bg-indigo-950/30 border-indigo-500/20 text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/[0.05]">
                          <span className="font-semibold text-slate-300">
                            {isVisitor ? (lead?.name || 'Visitante') : 'Agente Lumyo'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>

                        {/* CONTEÚDO DE TEXTO PURO (SEGURANÇA CONTRA XSS / HTML INJETADO) */}
                        <div className="whitespace-pre-wrap break-words font-sans text-slate-300">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR DE METADADOS COMERCIAIS & DA CONVERSA */}
        <div className="space-y-6">
          {/* PAINEL DE INFORMAÇÃO COMERCIAL DA LEAD */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/[0.08]">
              Informação Comercial
            </h3>

            {lead ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium">Nome</span>
                  <span className="font-semibold text-white">{lead.name || '—'}</span>
                </div>

                {lead.company_name && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                      <Building className="w-3 h-3" />
                      <span>Empresa</span>
                    </span>
                    <span className="text-slate-300">{lead.company_name}</span>
                  </div>
                )}

                {lead.email && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </span>
                    <span className="text-slate-300 break-all">{lead.email}</span>
                  </div>
                )}

                {lead.phone && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>Telefone</span>
                    </span>
                    <span className="text-slate-300">{lead.phone}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                    <Briefcase className="w-3 h-3" />
                    <span>Serviço Solicitado</span>
                  </span>
                  <span className="text-slate-300">{formatServiceType(lead.primary_service)}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Classificação</span>
                  </span>
                  <span className="text-slate-300 font-medium">
                    {formatLeadClassification(lead.lead_classification)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Alinhamento Financeiro</span>
                  </span>
                  <span className="text-slate-300 font-medium">
                    {formatFinancialAlignment(lead.financial_alignment_status)}
                  </span>
                </div>

                {/* BOTÃO PARA NAVEGAR PARA O DETALHE DA LEAD */}
                <div className="pt-3 border-t border-white/[0.08]">
                  <Link
                    to={`/admin/leads/${lead.id}`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium rounded-xl border border-indigo-500/20 transition-colors"
                  >
                    <span>Ver Lead Comercial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 text-xs space-y-1">
                <UserX className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                <p>Nenhuma lead associada a esta sessão.</p>
                <p className="text-[10px] text-slate-600">Sessão iniciada por visitante anónimo.</p>
              </div>
            )}
          </div>

          {/* PAINEL DE DADOS TÉCNICOS DA CONVERSA */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/[0.08]">
              Dados da Conversa
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Estado da Sessão</span>
                <span className="text-slate-300 font-medium">{formatConversationStatus(conversation.status)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Etapa Comercial</span>
                <span className="text-slate-300 font-medium">{formatCommercialStage(conversation.commercial_stage)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Resultado Primário</span>
                <span className="text-slate-300 font-medium">{formatPrimaryOutcome(conversation.primary_outcome)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>Idioma</span>
                </span>
                <span className="text-slate-300">{formatLanguage(conversation.language)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Data de Início</span>
                </span>
                <span className="text-slate-400">{formatDate(conversation.created_at)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Última Atividade</span>
                </span>
                <span className="text-slate-400">{formatDate(conversation.last_activity_at)}</span>
              </div>

              {conversation.closed_at && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium">Data de Encerramento</span>
                  <span className="text-slate-400">{formatDate(conversation.closed_at)}</span>
                </div>
              )}

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium">Total de Mensagens</span>
                <span className="text-slate-300 font-medium">{messages.length}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-medium flex items-center space-x-1">
                  <Hash className="w-3 h-3" />
                  <span>ID da Conversa</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400 break-all">{conversation.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
