import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  Building2,
  ExternalLink,
  RefreshCw,
  Info,
  Wand2,
  Copy,
  Check,
  EyeOff,
  RotateCcw,
  Calendar,
  X,
  FileCheck2,
  Ban,
  Mail,
  ListTodo,
  ShieldAlert,
  ArrowRight,
  Briefcase,
  UserCheck,
  Send
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  STAGE_LABELS_PT,
  STAGE_BADGE_CLASSES,
  PRIORITY_LABELS_PT,
  PRIORITY_BADGE_CLASSES,
  formatDatePT,
  formatDateTimePT,
  formatRelativeDatePT,
  formatCadenceProgressPT
} from '../../utils/followUpFormatters';

export default function AdminFollowUpsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('attention'); // 'attention' | 'scheduled' | 'snoozed' | 'ignored' | 'blocked'

  // Rascunhos gerados por leadId: { [leadId]: { subject, message, generation_source } }
  const [drafts, setDrafts] = useState({});
  const [generatingLeadId, setGeneratingLeadId] = useState(null);
  const [approvingLeadId, setApprovingLeadId] = useState(null);
  const [cancellingCommId, setCancellingCommId] = useState(null);
  const [draftErrors, setDraftErrors] = useState({});
  const [copiedLeadId, setCopiedLeadId] = useState(null);

  // Modais para Adiar e Ignorar
  const [snoozeModalLead, setSnoozeModalLead] = useState(null);
  const [snoozeOption, setSnoozeOption] = useState('tomorrow'); // 'tomorrow' | '3days' | '1week' | 'custom'
  const [customSnoozeDate, setCustomSnoozeDate] = useState('');
  const [snoozeNote, setSnoozeNote] = useState('');

  const [ignoreModalLead, setIgnoreModalLead] = useState(null);
  const [ignoreNote, setIgnoreNote] = useState('');

  const [actionLoadingLeadId, setActionLoadingLeadId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Disparo manual (Send Now)
  const [sendModalComm, setSendModalComm] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const handleConfirmSend = async (commId) => {
    if (!commId || isSending) return;
    setIsSending(true);
    setSendError('');

    try {
      const res = await fetch(`/api/admin/follow-ups/${commId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'resend' })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      setSendModalComm(null);
      setSendSuccess('Email disparado com sucesso e aceite pelo provider!');
      setTimeout(() => setSendSuccess(''), 6000);
      await loadFollowUps();
    } catch (err) {
      setSendError(err.message || 'Falha ao processar envio de email');
    } finally {
      setIsSending(false);
    }
  };

  const loadFollowUps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/follow-ups?show_blocked=true&limit=200`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro ao carregar dados');
      }
      setRecommendations(data.recommendations || []);
      setTotal(data.total || 0);
      setTruncated(!!data.truncated);
      setLimit(data.limit || 200);
    } catch (err) {
      setError('Não foi possível carregar os acompanhamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const handleGenerateDraft = async (leadId) => {
    if (generatingLeadId) return;
    setGeneratingLeadId(leadId);
    setDraftErrors((prev) => ({ ...prev, [leadId]: null }));

    try {
      const res = await fetch(`/api/admin/follow-ups/${leadId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao gerar rascunho de acompanhamento');
      }

      setDrafts((prev) => ({
        ...prev,
        [leadId]: {
          subject: data.draft.subject || '',
          message: data.draft.message || '',
          generation_source: data.draft.generation_source || 'fallback'
        }
      }));
    } catch (err) {
      setDraftErrors((prev) => ({
        ...prev,
        [leadId]: err.message || 'Falha ao gerar sugestão'
      }));
    } finally {
      setGeneratingLeadId(null);
    }
  };

  const handleDraftChange = (leadId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: value
      }
    }));
  };

  const handleCopyDraft = (textToCopy, copyKey) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLeadId(copyKey);
    setTimeout(() => setCopiedLeadId(null), 2000);
  };

  const handleApproveMessage = async (leadId) => {
    const draft = drafts[leadId];
    if (!draft || !draft.message || approvingLeadId) return;

    setApprovingLeadId(leadId);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/follow-ups/${leadId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: draft.subject || null,
          body: draft.message,
          generation_source: draft.generation_source || 'manual'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao aprovar mensagem');
      }

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
      await loadFollowUps();
    } catch (err) {
      setActionError(err.message || 'Falha ao aprovar mensagem');
    } finally {
      setApprovingLeadId(null);
    }
  };

  const handleCancelApproval = async (communicationId) => {
    if (!communicationId || cancellingCommId) return;

    setCancellingCommId(communicationId);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/approved-communications/${communicationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao cancelar aprovação');
      }

      await loadFollowUps();
    } catch (err) {
      setActionError(err.message || 'Falha ao cancelar aprovação');
    } finally {
      setCancellingCommId(null);
    }
  };

  const handleStateAction = async (leadId, action, snoozedUntil = null, note = null) => {
    setActionLoadingLeadId(leadId);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/follow-ups/${leadId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          snoozed_until: snoozedUntil,
          note
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao atualizar estado');
      }

      setSnoozeModalLead(null);
      setIgnoreModalLead(null);
      setSnoozeNote('');
      setIgnoreNote('');
      setCustomSnoozeDate('');
      await loadFollowUps();
    } catch (err) {
      setActionError(err.message || 'Falha ao submeter ação');
    } finally {
      setActionLoadingLeadId(null);
    }
  };

  const confirmSnooze = () => {
    if (!snoozeModalLead) return;

    let targetDate = new Date();
    if (snoozeOption === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (snoozeOption === '3days') {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (snoozeOption === '1week') {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (snoozeOption === 'custom') {
      if (!customSnoozeDate) {
        setActionError('Por favor selecione uma data personalizada');
        return;
      }
      targetDate = new Date(customSnoozeDate);
      if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
        setActionError('A data personalizada deve ser no futuro');
        return;
      }
    }

    handleStateAction(snoozeModalLead.lead_id, 'snoozed', targetDate.toISOString(), snoozeNote);
  };

  const confirmIgnore = () => {
    if (!ignoreModalLead) return;
    handleStateAction(ignoreModalLead.lead_id, 'ignored', null, ignoreNote);
  };

  const handleRestore = (leadId) => {
    handleStateAction(leadId, 'restored', null, null);
  };

  // Categorização e Separação por Tabs
  const categorized = useMemo(() => {
    const attention = [];
    const scheduled = [];
    const snoozed = [];
    const ignored = [];
    const blocked = [];

    for (const item of recommendations) {
      if (item.blocked) {
        blocked.push(item);
      } else if (item.effective_state === 'snoozed') {
        snoozed.push(item);
      } else if (item.effective_state === 'ignored') {
        ignored.push(item);
      } else if (item.needs_follow_up) {
        attention.push(item);
      } else {
        scheduled.push(item);
      }
    }

    // Ordenação de prioridade na tab Atenção
    attention.sort((a, b) => {
      const rank = (item) => {
        if (item.reason_code === 'unknown_dispatch_pending_reconciliation') return 1;
        if (item.reason_code === 'manual_task_due' || item.action_type === 'internal_action') return 2;
        if (item.cadence?.attempt_number === 2) return 3;
        if (item.pipeline_stage === 'proposal') return 4;
        if (item.cadence?.attempt_number === 1 || item.pipeline_stage === 'new') return 5;
        if (item.cadence?.status === 'exhausted' || item.action_type === 'human_review') return 6;
        return 7;
      };
      return rank(a) - rank(b);
    });

    return { attention, scheduled, snoozed, ignored, blocked };
  }, [recommendations]);

  const activeList = useMemo(() => {
    let list = [];
    if (activeTab === 'attention') list = categorized.attention;
    else if (activeTab === 'scheduled') list = categorized.scheduled;
    else if (activeTab === 'snoozed') list = categorized.snoozed;
    else if (activeTab === 'ignored') list = categorized.ignored;
    else if (activeTab === 'blocked') list = categorized.blocked;

    if (showBlocked && activeTab !== 'blocked') {
      return [...list, ...categorized.blocked];
    }
    return list;
  }, [activeTab, categorized, showBlocked]);

  return (
    <AdminLayout activeTab="followups">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Acompanhamento Comercial
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Leads que precisam de atenção, acompanhamentos agendados e ações comerciais.
            </p>
          </div>

          <button
            onClick={loadFollowUps}
            disabled={loading || !!generatingLeadId || !!actionLoadingLeadId || !!approvingLeadId || !!cancellingCommId}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-200 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Acompanhamentos
          </button>
        </div>

        {/* Aviso de Truncagem */}
        {truncated && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Lista truncada:</span> A apresentar os primeiros {limit} registos de um total de {total} leads.
            </div>
          </div>
        )}

        {/* Mensagens de Erro Globais */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadFollowUps}
              className="px-3 py-1 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
            >
              Voltar a tentar
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {sendSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{sendSuccess}</span>
            </div>
            <button onClick={() => setSendSuccess('')} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs Principais de Filtro */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('attention')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'attention'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Atenção ({categorized.attention.length})
            </button>

            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'scheduled'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Agendados ({categorized.scheduled.length})
            </button>

            <button
              onClick={() => setActiveTab('snoozed')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'snoozed'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Adiados ({categorized.snoozed.length})
            </button>

            <button
              onClick={() => setActiveTab('ignored')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ignored'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ignorados ({categorized.ignored.length})
            </button>

            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'blocked'
                  ? 'bg-gray-800 text-gray-200 border border-gray-700 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Bloqueados ({categorized.blocked.length})
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBlocked}
              onChange={(e) => {
                setShowBlocked(e.target.checked);
                if (!e.target.checked && activeTab === 'blocked') {
                  setActiveTab('attention');
                }
              }}
              className="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
            />
            Incluir bloqueados na vista geral
          </label>
        </div>

        {/* Conteúdo / Lista de Cards */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span>A carregar acompanhamentos comerciais...</span>
          </div>
        ) : activeList.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-gray-800 rounded-xl bg-gray-900/30 p-8 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-gray-200">
              {activeTab === 'attention' && 'Não existem acompanhamentos que precisem de atenção.'}
              {activeTab === 'scheduled' && 'Não existem acompanhamentos agendados.'}
              {activeTab === 'snoozed' && 'Não existem acompanhamentos adiados.'}
              {activeTab === 'ignored' && 'Não existem acompanhamentos ignorados.'}
              {activeTab === 'blocked' && 'Não existem acompanhamentos bloqueados.'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Todas as leads deste segmento estão atualizadas e com o fluxo operacional correto.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeList.map((item) => {
              const draft = drafts[item.lead_id];
              const approvedComm = item.approved_communication;
              const isGenerating = generatingLeadId === item.lead_id;
              const isApproving = approvingLeadId === item.lead_id;
              const isCancelling = cancellingCommId === approvedComm?.id;
              const draftErr = draftErrors[item.lead_id];
              const isActionLoading = actionLoadingLeadId === item.lead_id;

              const cadenceProgressStr = formatCadenceProgressPT(item.cadence, item.pipeline_stage, item.reason_code);
              const isUnknownDispatch = item.reason_code === 'unknown_dispatch_pending_reconciliation';
              const isTaskOverdue = item.reason_code === 'manual_task_due';
              const isMeetingOutcomePending = item.reason_code === 'meeting_outcome_pending';
              const isMeetingFollowUp = item.reason_code === 'meeting_follow_up';
              const isNegotiationStale = item.reason_code === 'negotiation_stale';

              return (
                <div
                  key={item.lead_id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    isUnknownDispatch
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : item.blocked
                      ? 'bg-gray-900/40 border-gray-800'
                      : approvedComm
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : item.effective_state === 'snoozed'
                      ? 'bg-blue-950/20 border-blue-800/40'
                      : item.effective_state === 'ignored'
                      ? 'bg-purple-950/20 border-purple-800/40'
                      : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Informação do Lead e Hierarquia Visual */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Linha 1: Nome + Empresa + Serviço + Pipeline */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/leads/${item.lead_id}`}
                          className="text-base font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
                        >
                          <span>{item.lead_name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                        </Link>

                        {item.company_name && (
                          <span className="text-xs text-gray-300 flex items-center gap-1 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700/60 font-medium">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {item.company_name}
                          </span>
                        )}

                        {item.primary_service && (
                          <span className="text-xs text-gray-300 flex items-center gap-1 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
                            <Briefcase className="w-3 h-3 text-gray-400" />
                            {item.primary_service}
                          </span>
                        )}

                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${STAGE_BADGE_CLASSES[item.pipeline_stage] || STAGE_BADGE_CLASSES.new}`}>
                          {STAGE_LABELS_PT[item.pipeline_stage] || item.pipeline_stage}
                        </span>

                        {cadenceProgressStr && (
                          <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {cadenceProgressStr}
                          </span>
                        )}
                      </div>

                      {/* Linha 2: Motivo Comercial / Explicação do Estado */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {isUnknownDispatch ? (
                          <div className="w-full text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/25 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                              <ShieldAlert className="w-4 h-4 text-rose-400" />
                              Envio por confirmar (Atenção Segura)
                            </div>
                            <p className="text-[11px] text-rose-300/90">
                              Não foi possível confirmar o estado de um envio anterior. Novos contactos estão temporariamente bloqueados.
                            </p>
                          </div>
                        ) : item.blocked ? (
                          <span className="text-gray-300 flex items-center gap-1 bg-gray-800/60 px-2.5 py-1 rounded border border-gray-700/50">
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.blocked_reason || 'Recomendação suspensa'}</span>
                          </span>
                        ) : item.reason_label ? (
                          <span className="text-amber-200 font-medium flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.reason_label}</span>
                          </span>
                        ) : null}

                        {item.priority && !isUnknownDispatch && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${PRIORITY_BADGE_CLASSES[item.priority] || PRIORITY_BADGE_CLASSES.normal}`}>
                            Prioridade {PRIORITY_LABELS_PT[item.priority] || item.priority}
                          </span>
                        )}

                        {approvedComm && (
                          <span className="text-xs text-emerald-300 font-semibold bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                            Mensagem Aprovada
                          </span>
                        )}

                        {item.effective_state === 'snoozed' && !approvedComm && (
                          <span className="text-xs text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            Adiado até {formatDatePT(item.snoozed_until)} ({formatRelativeDatePT(item.snoozed_until)})
                          </span>
                        )}

                        {item.effective_state === 'ignored' && !approvedComm && (
                          <span className="text-xs text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                            Ignorado pelo Admin
                          </span>
                        )}
                      </div>

                      {/* Detalhe de Notas de Ação se existirem */}
                      {item.action_note && (
                        <div className="text-xs text-gray-300 italic bg-gray-950/60 p-2 rounded border border-gray-800/80">
                          "{item.action_note}"
                        </div>
                      )}

                      {/* Linha 3: Data de última interação comercial real */}
                      <div className="text-[11px] text-gray-400">
                        Última interação comercial real:{' '}
                        <span className="text-gray-200 font-medium">
                          {formatDateTimePT(item.last_commercial_interaction_at)} ({formatRelativeDatePT(item.last_commercial_interaction_at)})
                        </span>
                      </div>
                    </div>

                    {/* Zona de Botões de Ação Principais */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                      {/* Botoes de Navegação Deep Link */}
                      {isTaskOverdue && (
                        <Link
                          to="/admin/tarefas"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-lg transition-colors"
                        >
                          <ListTodo className="w-3.5 h-3.5 text-purple-400" />
                          Ver Tarefa
                        </Link>
                      )}

                      {(isMeetingOutcomePending || item.reason_code === 'future_meeting_scheduled') && (
                        <Link
                          to="/admin/reunioes"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          Ver Reunião
                        </Link>
                      )}

                      <Link
                        to={`/admin/leads/${item.lead_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700/80 border border-gray-700/80 rounded-lg transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        Ver Lead
                      </Link>

                      {/* Botões de Ação de Cadência (Apenas se elegível e não bloqueado por segurança) */}
                      {!item.blocked && !isUnknownDispatch && (
                        <>
                          {item.effective_state === 'active' && !approvedComm && item.needs_follow_up && (
                            <>
                              {item.contact_eligible ? (
                                <button
                                  onClick={() => handleGenerateDraft(item.lead_id)}
                                  disabled={isGenerating || isActionLoading || isApproving}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {isGenerating ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                      A Gerar...
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                                      Gerar Sugestão
                                    </>
                                  )}
                                </button>
                              ) : null}

                              <button
                                onClick={() => {
                                  setSnoozeModalLead(item);
                                  setSnoozeOption('tomorrow');
                                  setSnoozeNote('');
                                }}
                                disabled={isGenerating || isActionLoading || isApproving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Adiar...
                              </button>

                              <button
                                onClick={() => {
                                  setIgnoreModalLead(item);
                                  setIgnoreNote('');
                                }}
                                disabled={isGenerating || isActionLoading || isApproving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Ignorar
                              </button>
                            </>
                          )}

                          {(item.effective_state === 'snoozed' || item.effective_state === 'ignored') && !approvedComm && (
                            <button
                              onClick={() => handleRestore(item.lead_id)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              {isActionLoading ? 'A restaurar...' : 'Restaurar agora'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Erro Local do Card */}
                  {draftErr && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center justify-between">
                      <span>{draftErr}</span>
                      <button onClick={() => setDraftErrors((prev) => ({ ...prev, [item.lead_id]: null }))} className="text-gray-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Exibição da Mensagem Comercial Aprovada (Fase 7D.1 / 7I.1) */}
                  {approvedComm && (() => {
                    const dispatchesList = approvedComm.dispatches || [];
                    const acceptedDispatch = dispatchesList.find(d => d.status === 'accepted');
                    const unknownDispatch = dispatchesList.find(d => d.status === 'unknown');
                    const canSendNow = !acceptedDispatch && !unknownDispatch && item.contact_eligible;

                    return (
                      <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-200">Mensagem Aprovada para Envio</span>
                            <span className="text-[11px] text-gray-300 flex items-center gap-1 bg-gray-900/90 px-2.5 py-0.5 rounded border border-gray-700/60 font-mono">
                              <Mail className="w-3 h-3 text-emerald-400" />
                              {approvedComm.recipient_email}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {canSendNow && (
                              <button
                                onClick={() => {
                                  setSendModalComm(approvedComm);
                                  setSendError('');
                                }}
                                disabled={isCancelling || isSending}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-400" />
                                Enviar agora
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyDraft(approvedComm.subject ? `Assunto: ${approvedComm.subject}\n\n${approvedComm.body}` : approvedComm.body, `app_${approvedComm.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
                            >
                              {copiedLeadId === `app_${approvedComm.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                  Copiar Texto
                                </>
                              )}
                            </button>

                            {!acceptedDispatch && !unknownDispatch && (
                              <button
                                onClick={() => handleCancelApproval(approvedComm.id)}
                                disabled={isCancelling || isSending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-400" />
                                {isCancelling ? 'A cancelar...' : 'Cancelar Aprovação'}
                              </button>
                            )}
                          </div>
                        </div>

                        {approvedComm.subject && (
                          <div>
                            <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Assunto Aprovado:</span>
                            <div className="text-xs font-semibold text-white mt-0.5">{approvedComm.subject}</div>
                          </div>
                        )}

                        <div>
                          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Corpo da Mensagem:</span>
                          <div className="text-xs text-gray-200 mt-1.5 whitespace-pre-wrap leading-relaxed bg-gray-950/80 p-3.5 rounded-lg border border-gray-800/80 font-sans">
                            {approvedComm.body}
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-400 pt-1 flex items-center justify-between border-t border-emerald-900/40">
                          <span>Aprovado em: {formatDateTimePT(approvedComm.approved_at)}</span>
                          {acceptedDispatch ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Email Enviado ({formatDateTimePT(acceptedDispatch.provider_accepted_at)})
                            </span>
                          ) : unknownDispatch ? (
                            <span className="text-rose-400 font-semibold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              Envio em estado incerto (Aguardar reconciliação)
                            </span>
                          ) : (
                            <span className="italic text-gray-400">(Aguarda envio manual pelo Admin)</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Painel de Rascunho Gerado / Editável (Sem aprovação ativa) */}
                  {draft && !approvedComm && (
                    <div className="mt-4 p-4 bg-gray-950/90 border border-gray-800 rounded-xl space-y-3 shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-gray-200">Sugestão de Mensagem Comercial</span>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${
                            draft.generation_source === 'ai'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {draft.generation_source === 'ai' ? 'Gerado por IA' : 'Sugestão de contingência'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyDraft(draft.subject ? `Assunto: ${draft.subject}\n\n${draft.message}` : draft.message, item.lead_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700/80 border border-gray-700/80 rounded-lg transition-colors"
                          >
                            {copiedLeadId === item.lead_id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                                Copiar Texto
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleApproveMessage(item.lead_id)}
                            disabled={isApproving || !draft.message}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {isApproving ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                A Aprovar...
                              </>
                            ) : (
                              <>
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                                Aprovar Mensagem
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {draft.subject !== undefined && (
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Assunto Sugerido</label>
                          <input
                            type="text"
                            value={draft.subject}
                            onChange={(e) => handleDraftChange(item.lead_id, 'subject', e.target.value)}
                            className="w-full text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">Corpo da Mensagem</label>
                        <textarea
                          rows={5}
                          value={draft.message}
                          onChange={(e) => handleDraftChange(item.lead_id, 'message', e.target.value)}
                          className="w-full text-xs bg-gray-900 border border-gray-800 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-sans min-h-[120px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Adiar (Snooze) */}
      {snoozeModalLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Adiar Acompanhamento
              </h3>
              <button onClick={() => setSnoozeModalLead(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              O acompanhamento de <strong className="text-white">{snoozeModalLead.lead_name}</strong> ficará oculto da lista de atenção até à data definida.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Prazo de Aditamento</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSnoozeOption('tomorrow')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-colors ${
                    snoozeOption === 'tomorrow'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  Amanhã (+24h)
                </button>
                <button
                  type="button"
                  onClick={() => setSnoozeOption('3days')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-colors ${
                    snoozeOption === '3days'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  Em 3 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setSnoozeOption('1week')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-colors ${
                    snoozeOption === '1week'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  Em 1 Semana
                </button>
                <button
                  type="button"
                  onClick={() => setSnoozeOption('custom')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-colors ${
                    snoozeOption === 'custom'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            </div>

            {snoozeOption === 'custom' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">Data e Hora (Local)</label>
                <input
                  type="datetime-local"
                  value={customSnoozeDate}
                  onChange={(e) => setCustomSnoozeDate(e.target.value)}
                  className="w-full text-xs bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-300">Nota de Justificação (Opcional)</label>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="Ex.: Cliente estará ausente até quinta-feira..."
                value={snoozeNote}
                onChange={(e) => setSnoozeNote(e.target.value)}
                className="w-full text-xs bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setSnoozeModalLead(null)}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSnooze}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                Confirmar Adiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ignorar (Ignore) */}
      {ignoreModalLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-purple-400" />
                Ignorar Acompanhamento
              </h3>
              <button onClick={() => setIgnoreModalLead(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Deseja ignorar o acompanhamento de <strong className="text-white">{ignoreModalLead.lead_name}</strong>? A recomendação não voltará a aparecer até que ocorra uma nova interação comercial.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-300">Nota de Justificação (Opcional)</label>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="Ex.: Acompanhamento realizado diretamente por chamada..."
                value={ignoreNote}
                onChange={(e) => setIgnoreNote(e.target.value)}
                className="w-full text-xs bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIgnoreModalLead(null)}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmIgnore}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-sm"
              >
                Confirmar Ignorar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Envio Manual (Send Now) */}
      {sendModalComm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Confirmar Envio Manual de Email
              </h3>
              <button onClick={() => setSendModalComm(null)} disabled={isSending} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <div>
                <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Destinatário</span>
                <div className="font-mono text-gray-200 mt-0.5 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
                  {sendModalComm.recipient_email}
                </div>
              </div>

              {sendModalComm.subject && (
                <div>
                  <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Assunto</span>
                  <div className="font-medium text-white mt-0.5">{sendModalComm.subject}</div>
                </div>
              )}

              <div>
                <span className="block font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Pré-visualização do Corpo</span>
                <div className="mt-1 p-3 bg-gray-950 rounded-lg border border-gray-800 text-gray-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {sendModalComm.body}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  Modo de Teste Seguro Ativo (Safe Test Mode)
                </div>
                <p className="text-[11px] text-amber-300/90 leading-normal">
                  O disparo será validado contra a lista de permissões. O email apenas será entregue se o destinatário for o endereço de teste autorizado (<strong className="text-white font-mono">fjcs_2011@hotmail.com</strong>).
                </p>
              </div>

              {sendError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                  <button onClick={() => setSendError('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setSendModalComm(null)}
                disabled={isSending}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSend(sendModalComm.id)}
                disabled={isSending}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    A Enviar Email...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Confirmar e Enviar Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
