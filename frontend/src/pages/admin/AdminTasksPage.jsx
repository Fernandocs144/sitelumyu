import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  Building2,
  ChevronRight,
  ArrowUpRight,
  Search,
  Plus,
  Pencil,
  X,
  ChevronLeft,
  Check,
  RotateCcw,
  UserCheck,
  Phone,
} from 'lucide-react';
import { formatPipelineStage } from '../../utils/adminFormatters';

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
 * Formata data/hora de tarefas no idioma PT.
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

/**
 * Formata um timestamp ISO para o formato 'YYYY-MM-DDTHH:mm' aceite por <input type="datetime-local">.
 */
function formatIsoForDateTimeInput(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
}

export default function AdminTasksPage() {
  // Estado dos filtros e paginação server-side
  const [category, setCategory] = useState('pending'); // pending, overdue, today, upcoming, nodue, completed
  const [priority, setPriority] = useState('all'); // all, high, normal, low
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dados recebidos do servidor
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({
    openTotal: 0,
    overdue: 0,
    today: 0,
    upcoming: 0,
    nodue: 0,
    completed: 0,
  });

  // Estados de loading e erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Estado do Modal de Edição
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('normal');
  const [editTaskDueAt, setEditTaskDueAt] = useState('');
  const [editReasonCode, setEditReasonCode] = useState(null);
  const [savingEditTask, setSavingEditTask] = useState(false);
  const [editTaskError, setEditTaskError] = useState(null);

  // Estado do Modal de Criação Global
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [searchingLeads, setSearchingLeads] = useState(false);
  const [leadSearchResults, setLeadSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createPriority, setCreatePriority] = useState('normal');
  const [createDueAt, setCreateDueAt] = useState('');
  const [createReasonCode, setCreateReasonCode] = useState(null);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Função principal de carregamento server-side
  const fetchTasksFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tzOffset = new Date().getTimezoneOffset();
      const queryParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        category,
        priority,
        timezone_offset: String(tzOffset),
      });

      const response = await fetch(`/api/admin/tasks?${queryParams.toString()}`, {
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar tarefas comerciais');
      }

      const receivedTasks = data.tasks || [];
      const receivedTotal = data.total || 0;
      const calcTotalPages = data.totalPages || Math.ceil(receivedTotal / pageSize) || 1;

      setTasks(receivedTasks);
      setTotal(receivedTotal);
      setTotalPages(calcTotalPages);

      if (data.counts) {
        setCounts(data.counts);
      }

      // Tratar descontinuidade de páginas (ex: se a página atual deixar de existir)
      if (page > calcTotalPages && calcTotalPages > 0) {
        setPage(calcTotalPages);
      }
    } catch (err) {
      setError(err.message || 'Erro na ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }, [category, priority, page, pageSize]);

  useEffect(() => {
    fetchTasksFromServer();
  }, [fetchTasksFromServer]);

  // Pesquisa de leads para o Modal de Criação Global (Debounced 300ms)
  useEffect(() => {
    if (!showCreateModal) return;
    let isMounted = true;

    const timer = setTimeout(async () => {
      setSearchingLeads(true);
      try {
        const q = leadSearchQuery.trim();
        const response = await fetch(`/api/admin/leads?search=${encodeURIComponent(q)}&pageSize=10`, {
          credentials: 'same-origin',
        });
        const data = await response.json();
        if (isMounted && response.ok && data.ok) {
          setLeadSearchResults(data.leads || []);
        }
      } catch (err) {
        // falha silenciosa
      } finally {
        if (isMounted) setSearchingLeads(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [leadSearchQuery, showCreateModal]);

  // Ações de alteração de filtros (fazem reset para page 1)
  const handleCategorySelect = (newCategory) => {
    if (newCategory === category) return;
    setCategory(newCategory);
    setPage(1);
  };

  const handlePrioritySelect = (newPriority) => {
    if (newPriority === priority) return;
    setPriority(newPriority);
    setPage(1);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (isNaN(newSize) || newSize === pageSize) return;
    setPageSize(newSize);
    setPage(1);
  };

  // Alternar Estado da Tarefa (Concluir / Reabrir)
  const handleToggleStatus = async (task) => {
    if (!task || updatingTaskId) return;

    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    setUpdatingTaskId(task.id);

    try {
      const response = await fetch(`/api/admin/leads/${task.lead_id}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao alterar estado da tarefa');
      }

      await fetchTasksFromServer();
    } catch (err) {
      alert(err.message || 'Erro ao alterar estado da tarefa');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Abrir Modal de Edição
  const handleStartEdit = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title || '');
    setEditTaskPriority(task.priority || 'normal');
    setEditTaskDueAt(formatIsoForDateTimeInput(task.due_at));
    setEditReasonCode(task.reason_code === 'phone_call' ? 'phone_call' : (task.reason_code || null));
    setEditTaskError(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTaskError(null);
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    const titleToSubmit = editTaskTitle.trim();
    if (!titleToSubmit || savingEditTask || !editingTask) return;

    setSavingEditTask(true);
    setEditTaskError(null);

    let dueAtIso = null;
    if (editTaskDueAt) {
      try {
        const parsed = new Date(editTaskDueAt);
        if (isNaN(parsed.getTime())) {
          setEditTaskError('Data/hora de prazo inválida');
          setSavingEditTask(false);
          return;
        }
        dueAtIso = parsed.toISOString();
      } catch (err) {
        setEditTaskError('Data/hora de prazo inválida');
        setSavingEditTask(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/leads/${editingTask.lead_id}/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: titleToSubmit,
          priority: editTaskPriority,
          due_at: dueAtIso,
          reason_code: editReasonCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao editar tarefa comercial');
      }

      setEditingTask(null);
      await fetchTasksFromServer();
    } catch (err) {
      setEditTaskError(err.message || 'Erro ao editar tarefa comercial');
    } finally {
      setSavingEditTask(false);
    }
  };

  // Abrir / Fechar Modal de Criação Global
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSelectedLead(null);
    setLeadSearchQuery('');
    setCreateTitle('');
    setCreatePriority('normal');
    setCreateDueAt('');
    setCreateReasonCode(null);
    setCreateError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedLead(null);
    setCreateError(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const titleToSubmit = createTitle.trim();
    if (!selectedLead || !titleToSubmit || savingCreate) return;

    setSavingCreate(true);
    setCreateError(null);

    let dueAtIso = null;
    if (createDueAt) {
      try {
        const parsed = new Date(createDueAt);
        if (isNaN(parsed.getTime())) {
          setCreateError('Data/hora de prazo inválida');
          setSavingCreate(false);
          return;
        }
        dueAtIso = parsed.toISOString();
      } catch (err) {
        setCreateError('Data/hora de prazo inválida');
        setSavingCreate(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/leads/${selectedLead.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: titleToSubmit,
          priority: createPriority,
          due_at: dueAtIso,
          reason_code: createReasonCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao criar tarefa comercial');
      }

      setShowCreateModal(false);
      setPage(1);
      await fetchTasksFromServer();
    } catch (err) {
      setCreateError(err.message || 'Erro ao criar tarefa comercial');
    } finally {
      setSavingCreate(false);
    }
  };

  // Títulos descritivos para o cabeçalho do bloco
  const getCategoryTitle = () => {
    switch (category) {
      case 'overdue':
        return 'Tarefas Vencidas';
      case 'today':
        return 'Tarefas para Hoje';
      case 'upcoming':
        return 'Próximas Tarefas';
      case 'nodue':
        return 'Tarefas Sem Prazo';
      case 'completed':
        return 'Tarefas Concluídas';
      case 'pending':
      default:
        return 'Todas as Tarefas Pendentes';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Centro de Tarefas Comerciais
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão operacional, acompanhamento e triagem de tarefas manuais
            </p>
          </div>
        </div>

        {/* BOTÃO "+ NOVA TAREFA COMERCIAL" */}
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition-colors shadow-lg shadow-amber-600/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa Comercial</span>
        </button>
      </div>

      {/* DASHBOARD DE CARTÕES / CONTAGENS GLOBAIS (FILTROS SERVER-SIDE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'pending', label: 'Pendentes', count: counts.openTotal, color: 'amber', icon: <ListTodo className="w-3.5 h-3.5" /> },
          { id: 'overdue', label: 'Vencidas', count: counts.overdue, color: 'rose', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { id: 'today', label: 'Hoje', count: counts.today, color: 'indigo', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'upcoming', label: 'Próximas', count: counts.upcoming, color: 'emerald', icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: 'nodue', label: 'Sem Prazo', count: counts.nodue, color: 'slate', icon: <ListTodo className="w-3.5 h-3.5" /> },
          { id: 'completed', label: 'Concluídas', count: counts.completed, color: 'emerald', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        ].map((card) => {
          const isActive = category === card.id;
          let activeStyles = 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-inner font-semibold';
          if (card.color === 'rose') activeStyles = 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-inner font-semibold';
          if (card.color === 'indigo') activeStyles = 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-inner font-semibold';
          if (card.color === 'emerald') activeStyles = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-inner font-semibold';
          if (card.color === 'slate') activeStyles = 'bg-slate-500/15 border-slate-500/40 text-slate-200 shadow-inner font-semibold';

          return (
            <button
              key={card.id}
              onClick={() => handleCategorySelect(card.id)}
              className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl ${
                isActive
                  ? activeStyles
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block font-semibold flex items-center justify-between">
                <span>{card.label}</span>
                {card.icon}
              </span>
              <span className="text-xl md:text-2xl font-bold mt-1.5 block">{card.count}</span>
            </button>
          );
        })}
      </div>

      {/* BARRA DE FILTRO DE PRIORIDADE */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Prioridade (Server-Side):</span>
          </span>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'high', label: 'Alta' },
            { id: 'normal', label: 'Normal' },
            { id: 'low', label: 'Baixa' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePrioritySelect(item.id)}
              className={`px-3 py-1 rounded-xl font-medium transition-colors border ${
                priority === item.id
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* SELECTOR DE TAMANHO DE PÁGINA */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Itens por página:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="bg-[#0c091f] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-500/50"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* SECTOR DA LISTA DE TAREFAS */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">{getCategoryTitle()}</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {total}
            </span>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
            <p className="text-xs text-slate-400">A carregar tarefas da categoria selecionada...</p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
            <button
              onClick={() => fetchTasksFromServer()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : tasks.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12 text-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Nenhuma tarefa encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não existem registos nesta categoria com os filtros aplicados.
            </p>
          </div>
        ) : (
          /* LISTA DE TAREFAS */
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const prioBadge = formatTaskPriority(task.priority);
              const formattedDue = formatTaskDate(task.due_at);
              const formattedComp = formatTaskDate(task.completed_at);
              const pipelineBadge = task.lead?.pipeline_stage ? formatPipelineStage(task.lead.pipeline_stage) : null;
              const isUpdating = updatingTaskId === task.id;
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl bg-white/[0.02] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'opacity-70 border-white/[0.04]'
                      : task.is_overdue
                      ? 'border-rose-500/30 bg-rose-500/[0.02]'
                      : 'border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  {/* METADADOS DA TAREFA E DA LEAD */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium text-xs break-words ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioBadge.className}`}>
                        {prioBadge.label}
                      </span>

                      {task.is_overdue && !isCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          <span>Vencida</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                      <Link
                        to={`/admin/leads/${task.lead.id}`}
                        className="inline-flex items-center space-x-1 font-semibold text-indigo-300 hover:text-indigo-200 transition-colors group"
                      >
                        <User className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                        <span>{task.lead.display_name}</span>
                        {task.lead.company_name && (
                          <span className="text-slate-400 font-normal">({task.lead.company_name})</span>
                        )}
                        <ArrowUpRight className="w-3 h-3 text-indigo-400 opacity-70 group-hover:opacity-100" />
                      </Link>

                      {task.lead?.phone && (
                        <a
                          href={`tel:${task.lead.phone}`}
                          className="inline-flex items-center space-x-1 font-medium text-sky-300 hover:text-sky-200 transition-colors"
                          title="Ligar para a lead"
                        >
                          <Phone className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>Telefone: {task.lead.phone}</span>
                        </a>
                      )}

                      {pipelineBadge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pipelineBadge.className}`}>
                          {pipelineBadge.label}
                        </span>
                      )}

                      {!isCompleted && formattedDue && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Prazo: <strong className={task.is_overdue ? 'text-rose-400' : 'text-slate-200'}>{formattedDue}</strong></span>
                        </div>
                      )}

                      {isCompleted && formattedComp && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Concluída a: <strong className="text-slate-300">{formattedComp}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AÇÕES DA TAREFA */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      disabled={isUpdating}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-lg border border-white/[0.08] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      disabled={isUpdating}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 disabled:opacity-50 ${
                        isCompleted
                          ? 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border-slate-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isCompleted ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{isCompleted ? 'Reabrir' : 'Concluir'}</span>
                    </button>

                    <Link
                      to={`/admin/leads/${task.lead.id}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/20 text-xs font-medium transition-colors"
                    >
                      <span>Lead 360</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BARRA DE PAGINAÇÃO SERVER-SIDE */}
        {!loading && !error && total > 0 && (
          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">
              A apresentar <strong className="text-white">{tasks.length}</strong> de <strong className="text-white">{total}</strong> tarefas (Página {page} de {totalPages})
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-amber-300 font-bold">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <span>Seguinte</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: + NOVA TAREFA COMERCIAL (COM PESQUISA E SELEÇÃO DE LEAD) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f0b29] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Nova Tarefa Comercial</span>
              </h3>
              <button onClick={handleCloseCreateModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* PESQUISA DE LEAD */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Selecionar Lead Comercial <span className="text-rose-400">*</span>
                </label>

                {selectedLead ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <strong className="text-white block">{selectedLead.name || selectedLead.email}</strong>
                        {selectedLead.company_name && (
                          <span className="text-slate-400 text-[11px] block">{selectedLead.company_name}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLead(null)}
                      className="text-xs text-rose-400 hover:underline font-medium"
                    >
                      Alterar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={leadSearchQuery}
                        onChange={(e) => setLeadSearchQuery(e.target.value)}
                        placeholder="Pesquisar por nome, email ou empresa..."
                        className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 border border-white/[0.06] rounded-xl p-1 bg-white/[0.01]">
                      {searchingLeads ? (
                        <p className="text-[11px] text-slate-500 p-2 text-center">A pesquisar leads...</p>
                      ) : leadSearchResults.length === 0 ? (
                        <p className="text-[11px] text-slate-500 p-2 text-center">Nenhuma lead encontrada com este termo.</p>
                      ) : (
                        leadSearchResults.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setSelectedLead(l)}
                            className="w-full text-left p-2 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-200 truncate">{l.name || l.email}</span>
                            {l.company_name && <span className="text-[10px] text-slate-400 truncate ml-2">({l.company_name})</span>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Título da Tarefa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Ex: Enviar proposta comercial atualizada..."
                  maxLength={255}
                  required
                  disabled={savingCreate}
                  className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50 disabled:opacity-50"
                />
              </div>

              {/* PRIORIDADE E PRAZO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    disabled={savingCreate}
                    className="w-full bg-[#0c091f] border border-white/[0.1] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50 disabled:opacity-50"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prazo (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={createDueAt}
                    onChange={(e) => setCreateDueAt(e.target.value)}
                    disabled={savingCreate}
                    className="w-full bg-[#0c091f] border border-white/[0.1] rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-amber-500/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* BOTÕES DO MODAL */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={savingCreate}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingCreate || !selectedLead || !createTitle.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shadow-lg shadow-amber-600/10"
                >
                  {savingCreate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A criar...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Tarefa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR TAREFA COMERCIAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f0b29] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                <span>Editar Tarefa Comercial</span>
              </h3>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTEXTO DA LEAD (READ-ONLY) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
              <span>Lead: </span>
              <strong className="text-white">{editingTask.lead?.display_name || 'Lead sem nome'}</strong>
            </div>

            {editTaskError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editTaskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  placeholder="Título da tarefa..."
                  maxLength={255}
                  required
                  disabled={savingEditTask}
                  className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value)}
                    disabled={savingEditTask}
                    className="w-full bg-[#0c091f] border border-white/[0.1] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50 disabled:opacity-50"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Prazo (due_at)</label>
                    {editTaskDueAt && (
                      <button
                        type="button"
                        onClick={() => setEditTaskDueAt('')}
                        disabled={savingEditTask}
                        className="text-[10px] text-rose-400 hover:underline font-medium"
                      >
                        Remover prazo
                      </button>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={editTaskDueAt}
                    onChange={(e) => setEditTaskDueAt(e.target.value)}
                    disabled={savingEditTask}
                    className="w-full bg-[#0c091f] border border-white/[0.1] rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-amber-500/50 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEditTask}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingEditTask || !editTaskTitle.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shadow-lg shadow-amber-600/10"
                >
                  {savingEditTask ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
