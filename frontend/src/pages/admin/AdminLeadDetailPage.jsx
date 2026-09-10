import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  DollarSign,
  Clock,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Compass,
  Calendar,
  Kanban,
  ExternalLink,
  GitCommit,
  CheckCircle2,
  Tag,
  ShieldCheck,
  ChevronRight,
  FileText,
  Plus,
  ListTodo,
  Check,
  RotateCcw,
  AlertTriangle,
  User,
} from 'lucide-react';
import {
  formatServiceFull,
  formatBudget,
  formatLanguage,
  formatTimeline,
  formatDecisionInvolvement,
  formatIntentLevel,
  formatAlignmentBadge,
  formatAlignmentReason,
  formatClassificationBadge,
  formatClassificationReason,
  formatNextStep,
  formatSource,
  formatConversationStatus,
  formatCommercialStage,
  formatPrimaryOutcome,
  formatDate,
  formatPipelineStage,
  formatPipelineSource,
  formatBookingStatus,
} from '../../utils/adminFormatters';

/**
 * Ordena determinísticamente a lista de tarefas da Lead 360 no cliente:
 * A) Abertas primeiro (vencidas primeiro, depois prazo mais próximo, depois sem prazo);
 * B) Concluídas no fim (concluídas mais recentemente primeiro).
 */
function sortLeadTasks(tasks) {
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

    const aCompMs = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bCompMs = b.completed_at ? new Date(b.completed_at).getTime() : 0;

    if (aCompMs !== bCompMs) {
      return bCompMs - aCompMs;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Determina o nome de exibição amigável do lead.
 */
function getLeadDisplayName(lead) {
  if (!lead) return 'Lead sem nome';
  if (lead.name && typeof lead.name === 'string' && lead.name.trim().length > 0) {
    return lead.name.trim();
  }
  if (lead.email && typeof lead.email === 'string' && lead.email.trim().length > 0) {
    return lead.email.trim();
  }
  return 'Lead sem nome';
}

/**
 * Formata intervalo de datas para reuniões agendadas.
 */
function formatBookingTimespan(startTime, endTime, timezone) {
  if (!startTime) return '—';
  try {
    const start = new Date(startTime);
    const startStr = start.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!endTime) return `${startStr} (${timezone || 'WET'})`;

    const end = new Date(endTime);
    const endStr = end.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${startStr} às ${endStr} (${timezone || 'WET'})`;
  } catch (e) {
    return startTime;
  }
}

/**
 * Formata prioridade visual de tarefas.
 */
function formatTaskPriority(priority) {
  switch (priority) {
    case 'high':
      return { label: 'Alta', className: 'bg-rose-500/10 text-rose-300 border-rose-500/20' };
    case 'low':
      return { label: 'Baixa', className: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
    case 'normal':
    default:
      return { label: 'Normal', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
  }
}

/**
 * Formata data/hora de tarefas em PT.
 */
function formatTaskDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
}

export default function AdminLeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [pipelineHistory, setPipelineHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskDueAt, setTaskDueAt] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLeadDetail() {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      try {
        const response = await fetch(`/api/admin/leads/${id}`, {
          credentials: 'same-origin',
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || !data.ok) {
          setStatusCode(response.status);
          throw new Error(data.error || 'Erro ao carregar os detalhes do lead');
        }

        setLead(data.lead);
        setConversation(data.conversation || null);
        setConversations(data.conversations || []);
        setPipelineHistory(data.pipelineHistory || []);
        setBookings(data.bookings || []);
        setNotes(data.notes || []);
        setTasks(sortLeadTasks(data.tasks || []));
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Erro na ligação ao servidor');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadLeadDetail();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    const contentToSubmit = noteInput.trim();
    if (!contentToSubmit || savingNote) return;

    setSavingNote(true);
    setNoteError(null);

    try {
      const response = await fetch(`/api/admin/leads/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ content: contentToSubmit }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao adicionar nota comercial');
      }

      if (data.note) {
        setNotes((prevNotes) => [data.note, ...prevNotes]);
      }
      setNoteInput('');
    } catch (err) {
      setNoteError(err.message || 'Erro ao adicionar nota comercial');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const titleToSubmit = taskTitle.trim();
    if (!titleToSubmit || savingTask) return;

    setSavingTask(true);
    setTaskError(null);

    let dueAtIso = null;
    if (taskDueAt) {
      try {
        dueAtIso = new Date(taskDueAt).toISOString();
      } catch (err) {
        setTaskError('Data/hora de prazo inválida');
        setSavingTask(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/leads/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: titleToSubmit,
          priority: taskPriority,
          due_at: dueAtIso,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao criar tarefa comercial');
      }

      if (data.task) {
        setTasks((prevTasks) => sortLeadTasks([data.task, ...prevTasks]));
      }
      setTaskTitle('');
      setTaskPriority('normal');
      setTaskDueAt('');
    } catch (err) {
      setTaskError(err.message || 'Erro ao criar tarefa comercial');
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskToToggle) => {
    if (!taskToToggle || updatingTaskId) return;

    const newStatus = taskToToggle.status === 'completed' ? 'open' : 'completed';
    setUpdatingTaskId(taskToToggle.id);
    setTaskError(null);

    try {
      const response = await fetch(`/api/admin/leads/${id}/tasks/${taskToToggle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao alterar estado da tarefa');
      }

      if (data.task) {
        setTasks((prevTasks) =>
          sortLeadTasks(prevTasks.map((t) => (t.id === taskToToggle.id ? data.task : t)))
        );
      }
    } catch (err) {
      setTaskError(err.message || 'Erro ao alterar estado da tarefa');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const openTasks = tasks.filter((t) => t.status === 'open');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">A carregar ficha Lead 360...</p>
      </div>
    );
  }

  if (error || statusCode === 404) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/admin/leads')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Leads</span>
        </button>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {statusCode === 404 ? 'Lead não encontrada' : 'Erro ao carregar lead'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {error || 'Não foi possível localizar o registo de lead solicitado.'}
          </p>
          <button
            onClick={() => navigate('/admin/leads')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <span>Ver todas as leads</span>
          </button>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const displayName = getLeadDisplayName(lead);
  const alignBadge = formatAlignmentBadge(lead.financial_alignment_status);
  const classBadge = formatClassificationBadge(lead.lead_classification);
  const pipelineStageBadge = formatPipelineStage(lead.pipeline_stage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* BOTÃO NAVEGAÇÃO VOLTAR E LINK PIPELINE */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/leads"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Leads</span>
        </Link>

        <Link
          to="/admin/pipeline"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-indigo-300 transition-colors"
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Ver no Pipeline CRM</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {/* CABEÇALHO DO LEAD 360 */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {displayName}
            </h1>

            {/* BADGES: CLASSIFICAÇÃO | ALINHAMENTO | PIPELINE */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${classBadge.className}`}>
              {classBadge.label}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${alignBadge.className}`}>
              Alinhamento: {alignBadge.label}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${pipelineStageBadge.className}`}>
              Pipeline: {pipelineStageBadge.label}
            </span>
          </div>

          {/* CONTACTOS E EMPRESA */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {lead.email && (
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <a href={`mailto:${lead.email}`} className="hover:text-indigo-300 transition-colors">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <a href={`tel:${lead.phone}`} className="hover:text-indigo-300 transition-colors">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.company_name && (
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{lead.company_name}</span>
              </div>
            )}
            {lead.primary_service && (
              <div className="flex items-center space-x-1.5 text-indigo-300">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium">{formatServiceFull(lead.primary_service, lead.service_variant)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 self-start md:self-auto text-xs text-slate-400 border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0 shrink-0">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Última Atividade</span>
            <span className="text-slate-200 font-medium">{formatDate(lead.last_interaction_at || lead.created_at)}</span>
          </div>
        </div>
      </div>

      {/* GRELHA PRINCIPAL DE SECÇÕES (LEAD 360) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA - CONTEÚDO COMERCIAL PRINCIPAL (2 COLUNAS EM DESKTOP) */}
        <div className="lg:col-span-2 space-y-6">
          {/* BLOCO 1: RESUMO COMERCIAL & NECESSIDADES */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Resumo Comercial & Necessidades</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Serviço Pretendido</span>
                <span className="text-slate-200 font-semibold text-sm mt-0.5 block">
                  {formatServiceFull(lead.primary_service, lead.service_variant)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Website Atual</span>
                {lead.website_url ? (
                  <a
                    href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline inline-flex items-center space-x-1 mt-0.5 font-medium truncate max-w-full"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="truncate">{lead.website_url}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 block mt-0.5">
                    {lead.has_existing_website === false
                      ? 'Não possui website (Projeto de raiz)'
                      : lead.has_existing_website === true
                      ? 'Possui website (URL não especificado)'
                      : 'Não informado'}
                  </span>
                )}
              </div>
            </div>

            {/* Descrição da Necessidade */}
            {lead.need_description && (
              <div className="pt-3 border-t border-white/[0.06] text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium mb-1">
                  Descrição da Necessidade / Requisitos
                </span>
                <p className="text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-line">
                  {lead.need_description}
                </p>
              </div>
            )}

            {/* Impacto Operacional */}
            {lead.operational_impact && (
              <div className="pt-2 text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium mb-1">
                  Impacto Operacional / Desafio Negocial
                </span>
                <p className="text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-line">
                  {lead.operational_impact}
                </p>
              </div>
            )}

            {/* Metadados Comerciais de Contexto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-white/[0.06] text-xs">
              {lead.timeline && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Prazo / Timeline</span>
                  <span className="text-slate-300 font-medium block mt-0.5">{formatTimeline(lead.timeline)}</span>
                </div>
              )}

              {lead.decision_involvement && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Decisão</span>
                  <span className="text-slate-300 font-medium block mt-0.5">{formatDecisionInvolvement(lead.decision_involvement)}</span>
                </div>
              )}

              {lead.intent_level && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Intenção</span>
                  <span className="text-slate-300 font-medium block mt-0.5">{formatIntentLevel(lead.intent_level)}</span>
                </div>
              )}

              {lead.next_step && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Próximo Passo</span>
                  <span className="text-indigo-300 font-medium block mt-0.5">{formatNextStep(lead.next_step)}</span>
                </div>
              )}

            </div>
          </div>

          {/* BLOCO: NOTAS COMERCIAIS */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Notas Comerciais</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                {notes.length}
              </span>
            </div>

            {/* FORMULÁRIO PARA ADICIONAR NOTA */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Escreva uma nova nota comercial sobre esta lead..."
                  rows={3}
                  maxLength={5000}
                  disabled={savingNote}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all resize-y disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>Máximo 5000 caracteres</span>
                  <span>{noteInput.length}/5000</span>
                </div>
              </div>

              {noteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{noteError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !noteInput.trim()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-xs font-medium transition-colors disabled:cursor-not-allowed shadow-lg shadow-cyan-600/10"
                >
                  {savingNote ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Nota</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* LISTA DE NOTAS */}
            <div className="pt-3 space-y-3 border-t border-white/[0.06]">
              {notes.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                  <p className="text-xs text-slate-500">Nenhuma nota comercial registada para esta lead.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-cyan-300">
                            {note.author_name || 'Admin'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BLOCO: TAREFAS COMERCIAIS */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <ListTodo className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Tarefas Comerciais</h2>
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {openTasks.length} Abertas
                </span>
                <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {completedTasks.length} Concluídas
                </span>
              </div>
            </div>

            {/* FORMULÁRIO PARA CRIAR TAREFA */}
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Título da tarefa comercial..."
                  maxLength={255}
                  disabled={savingTask}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium mb-1">
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    disabled={savingTask}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-2.5 text-xs text-slate-200 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="low" className="bg-[#0c091f] text-slate-200">Baixa</option>
                    <option value="normal" className="bg-[#0c091f] text-slate-200">Normal</option>
                    <option value="high" className="bg-[#0c091f] text-slate-200">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium mb-1">
                    Prazo (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={taskDueAt}
                    onChange={(e) => setTaskDueAt(e.target.value)}
                    disabled={savingTask}
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-2 text-xs text-slate-200 outline-none transition-all disabled:opacity-50"
                  />
                  <span className="text-[9px] text-slate-500 block mt-1">
                    Hora local do dispositivo
                  </span>
                </div>

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    type="submit"
                    disabled={savingTask || !taskTitle.trim()}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-xs font-medium transition-colors disabled:cursor-not-allowed shadow-lg shadow-amber-600/10"
                  >
                    {savingTask ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A criar...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Tarefa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {taskError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{taskError}</span>
                </div>
              )}
            </form>

            {/* LISTA DE TAREFAS ABERTAS */}
            <div className="pt-3 space-y-3 border-t border-white/[0.06]">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tarefas Abertas ({openTasks.length})
              </h3>

              {openTasks.length === 0 ? (
                <div className="py-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                  <p className="text-xs text-slate-500">Nenhuma tarefa aberta pendente.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openTasks.map((task) => {
                    const prioBadge = formatTaskPriority(task.priority);
                    const formattedDue = formatTaskDate(task.due_at);
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl bg-white/[0.02] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          task.is_overdue
                            ? 'border-rose-500/30 bg-rose-500/[0.02]'
                            : 'border-white/[0.06]'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-200 text-xs break-words">
                              {task.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioBadge.className}`}>
                              {prioBadge.label}
                            </span>
                            {task.is_overdue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />
                                <span>Vencida</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            {formattedDue && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>Prazo: <strong className={task.is_overdue ? 'text-rose-400' : 'text-slate-300'}>{formattedDue}</strong></span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>Responsável: <strong className="text-slate-300">Admin</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={isUpdating}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/20 text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Concluir</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LISTA DE TAREFAS CONCLUÍDAS */}
            {completedTasks.length > 0 && (
              <div className="pt-3 space-y-3 border-t border-white/[0.06]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tarefas Concluídas ({completedTasks.length})
                </h3>

                <div className="space-y-2.5">
                  {completedTasks.map((task) => {
                    const prioBadge = formatTaskPriority(task.priority);
                    const formattedComp = formatTaskDate(task.completed_at || task.updated_at);
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] opacity-75 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-400 text-xs line-through break-words">
                              {task.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border opacity-75 ${prioBadge.className}`}>
                              {prioBadge.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            {formattedComp && (
                              <span>Concluída a: {formattedComp}</span>
                            )}
                            <span>•</span>
                            <span>Por: Admin</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={isUpdating}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 rounded-lg border border-slate-500/20 text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Reabrir</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* BLOCO 2: QUALIFICAÇÃO & ALINHAMENTO FINANCEIRO */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Qualificação Comercial & Orçamento</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Classificação Comercial</span>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-medium border ${classBadge.className}`}>
                    {classBadge.label}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Orçamento Declarado</span>
                <span className="text-slate-200 font-semibold text-sm mt-0.5 block">{formatBudget(lead)}</span>
                {lead.stated_budget_period && lead.stated_budget_period !== 'unknown' && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Período: {lead.stated_budget_period === 'monthly' ? 'Mensal' : 'Por Projeto'}
                  </span>
                )}
              </div>
            </div>

            {/* Motivo do Alinhamento Financeiro */}
            {lead.financial_alignment_reason && (
              <div className="pt-3 border-t border-white/[0.06] text-xs space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Alinhamento Financeiro ({alignBadge.label})
                </span>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex items-start space-x-2">
                  <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{formatAlignmentReason(lead.financial_alignment_reason)}</span>
                </div>
              </div>
            )}

            {/* Fundamento da Classificação Comercial */}
            {lead.classification_reason && (
              <div className="pt-2 text-xs space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Fundamento da Classificação
                </span>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-slate-300">
                  {formatClassificationReason(lead.classification_reason)}
                </div>
              </div>
            )}
          </div>

          {/* BLOCO 3: REUNIÕES AGENDADAS (CALENDAR BOOKINGS) */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Reuniões</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                {bookings.length}
              </span>
            </div>

            {bookings.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                <p className="text-xs text-slate-500">Nenhuma reunião agendada para esta lead.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const statusBadge = formatBookingStatus(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full font-medium border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Criada a: {formatDate(booking.created_at)}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-200 text-sm">
                        {formatBookingTimespan(booking.start_time, booking.end_time, booking.timezone)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-white/[0.04]">
                        {booking.attendee_name && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>{booking.attendee_name}</span>
                          </div>
                        )}
                        {booking.attendee_email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{booking.attendee_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BLOCO 4: SESSÕES DE CONVERSA ASSOCIADAS */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Conversas</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                {conversations.length}
              </span>
            </div>

            {conversations.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                <p className="text-xs text-slate-500">Nenhuma sessão de conversa registada para esta lead.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white truncate">
                          Etapa: {formatCommercialStage(conv.commercial_stage)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Resultado: <strong className="text-indigo-300 font-medium">{formatPrimaryOutcome(conv.primary_outcome)}</strong></span>
                        <span>•</span>
                        <span>Estado: <strong className="text-slate-300 font-medium">{formatConversationStatus(conv.status)}</strong></span>
                      </div>

                      <div className="text-[10px] text-slate-500">
                        Última atividade: {formatDate(conv.last_activity_at || conv.created_at)}
                      </div>
                    </div>

                    <Link
                      to={`/admin/conversas/${conv.id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/20 text-xs font-medium transition-colors shrink-0 self-start sm:self-center"
                    >
                      <span>Ver conversa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA - SIDEBAR DE PIPELINE & IDENTIDADE (1 COLUNA EM DESKTOP) */}
        <div className="space-y-6">
          {/* BLOCO 5: PIPELINE CRM ATUAL & HISTÓRICO DE EVOLUÇÃO */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
              <Kanban className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Pipeline CRM</h2>
            </div>

            {/* ETAPA ATUAL READ-ONLY */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Etapa Atual</span>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pipelineStageBadge.className}`}>
                  {pipelineStageBadge.label}
                </span>
              </div>
            </div>

            {/* HISTÓRICO DE EVOLUÇÃO DO PIPELINE */}
            <div className="pt-2 space-y-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Histórico do Pipeline
              </span>

              {pipelineHistory.length === 0 ? (
                <div className="py-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                  <p className="text-[11px] text-slate-500">Sem histórico de alterações do pipeline.</p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-4 border-l border-white/[0.08]">
                  {pipelineHistory.map((item) => {
                    const toStageBadge = formatPipelineStage(item.to_stage);
                    const fromStageBadge = item.from_stage ? formatPipelineStage(item.from_stage) : null;
                    const sourceText = formatPipelineSource(item.source);

                    return (
                      <div key={item.id} className="relative text-xs space-y-1">
                        {/* PONTO NA TIMELINE */}
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-[#0c091f]" />

                        <div className="font-semibold text-slate-200">
                          {!item.from_stage ? (
                            <span>Entrada no Pipeline: <strong className="text-white">{toStageBadge.label}</strong></span>
                          ) : (
                            <span>
                              {fromStageBadge?.label} <span className="text-slate-500 mx-1">→</span> {toStageBadge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span>{formatDate(item.changed_at)}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{sourceText}</span>
                        </div>

                        {item.reason && (
                          <p className="text-[11px] text-slate-400 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04] mt-1">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BLOCO 6: IDENTIDADE E METADADOS */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Identidade e Contacto</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Nome Completo</span>
                <span className="text-slate-200 font-medium block mt-0.5">{lead.name || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Empresa</span>
                <span className="text-slate-200 font-medium block mt-0.5">{lead.company_name || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Email</span>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline block mt-0.5">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-slate-400 block mt-0.5">Não informado</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Telefone</span>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-indigo-400 hover:underline block mt-0.5">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-slate-400 block mt-0.5">Não informado</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Idioma</span>
                <span className="text-slate-300 font-medium block mt-0.5">
                  {formatLanguage(lead.language)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Data de Criação</span>
                <span className="text-slate-300 block mt-0.5">{formatDate(lead.created_at)}</span>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">ID do Lead</span>
                <span className="text-[11px] font-mono text-slate-500 block mt-0.5 select-all">{lead.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

