import React, { useState, useEffect } from 'react';
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
  Tag,
  ChevronRight,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { formatPipelineStage } from '../../utils/adminFormatters';

/**
 * Classifica dinamicamente uma tarefa no fuso horário do browser do utilizador.
 *
 * @param {object} task
 * @returns {'overdue'|'today'|'upcoming'|'nodue'|'completed'}
 */
export function classifyTaskTemporalCategory(task) {
  if (task.status === 'completed') return 'completed';
  if (!task.due_at) return 'nodue';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const due = new Date(task.due_at);

  if (due < startOfToday) {
    return 'overdue';
  } else if (due >= startOfToday && due < startOfTomorrow) {
    return 'today';
  } else {
    return 'upcoming';
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
 * Peso numérico de prioridade para ordenação.
 */
function getPriorityWeight(priority) {
  switch (priority) {
    case 'high':
      return 3;
    case 'normal':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

/**
 * Ordena determinística de tarefas globais por categoria temporal e prioridade.
 */
function sortGlobalTasks(tasks, category) {
  if (!Array.isArray(tasks)) return [];

  return [...tasks].sort((a, b) => {
    if (category === 'completed') {
      const aComp = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bComp = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bComp - aComp;
    }

    if (category === 'overdue') {
      const aDue = a.due_at ? new Date(a.due_at).getTime() : 0;
      const bDue = b.due_at ? new Date(b.due_at).getTime() : 0;
      if (aDue !== bDue) return aDue - bDue;
      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    }

    if (category === 'nodue') {
      const prioDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (prioDiff !== 0) return prioDiff;
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bCreated - aCreated;
    }

    // hoje ou próximas
    const prioDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (prioDiff !== 0) return prioDiff;

    const aDue = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const bDue = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return aDue - bDue;
  });
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [limit, setLimit] = useState(200);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [temporalFilter, setTemporalFilter] = useState('all'); // all, overdue, today, upcoming, nodue
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, high, normal, low
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGlobalTasks() {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (showCompleted) {
          queryParams.set('include_completed', 'true');
        }
        queryParams.set('limit', '200');

        const response = await fetch(`/api/admin/tasks?${queryParams.toString()}`, {
          credentials: 'same-origin',
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Erro ao carregar tarefas globais');
        }

        setTasks(data.tasks || []);
        setTotal(data.total || 0);
        setTruncated(Boolean(data.truncated));
        setLimit(data.limit || 200);
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

    loadGlobalTasks();

    return () => {
      isMounted = false;
    };
  }, [showCompleted]);

  // Derivar categorias e contagens temporais no fuso horário local do utilizador
  const categorizedTasks = {
    overdue: [],
    today: [],
    upcoming: [],
    nodue: [],
    completed: [],
  };

  tasks.forEach((task) => {
    const cat = classifyTaskTemporalCategory(task);
    if (categorizedTasks[cat]) {
      categorizedTasks[cat].push(task);
    }
  });

  const counts = {
    overdue: categorizedTasks.overdue.length,
    today: categorizedTasks.today.length,
    upcoming: categorizedTasks.upcoming.length,
    nodue: categorizedTasks.nodue.length,
    completed: categorizedTasks.completed.length,
    openTotal:
      categorizedTasks.overdue.length +
      categorizedTasks.today.length +
      categorizedTasks.upcoming.length +
      categorizedTasks.nodue.length,
  };

  // Filtragem por prioridade
  const filterByPriority = (taskList) => {
    if (priorityFilter === 'all') return taskList;
    return taskList.filter((t) => t.priority === priorityFilter);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ListTodo className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Centro de Tarefas Comerciais</h1>
            <p className="text-xs text-slate-400">A carregar tarefas pendentes...</p>
          </div>
        </div>

        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 backdrop-blur-xl">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm text-slate-400">A processar o trabalho comercial pendente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-12">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Erro ao carregar tarefas</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      </div>
    );
  }

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
              Visão global e acompanhamento do trabalho comercial pendente
            </p>
          </div>
        </div>

        {/* ALERTA DE TRUNCAGEM */}
        {truncated && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>A apresentar {tasks.length} tarefas de um total de {total} registadas.</span>
          </div>
        )}
      </div>

      {/* DASHBOARD DE CARDS / COUNTS TEMPORAIS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setTemporalFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl ${
            temporalFilter === 'all'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-inner'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider block font-semibold text-slate-500">Pendentes</span>
          <span className="text-xl md:text-2xl font-bold text-white mt-1 block">{counts.openTotal}</span>
        </button>

        <button
          onClick={() => setTemporalFilter('overdue')}
          className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl ${
            temporalFilter === 'overdue'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold shadow-inner'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider block font-semibold text-rose-400 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 mr-1 inline" />
            <span>Vencidas</span>
          </span>
          <span className="text-xl md:text-2xl font-bold text-rose-300 mt-1 block">{counts.overdue}</span>
        </button>

        <button
          onClick={() => setTemporalFilter('today')}
          className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl ${
            temporalFilter === 'today'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold shadow-inner'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider block font-semibold text-indigo-400">Hoje</span>
          <span className="text-xl md:text-2xl font-bold text-indigo-200 mt-1 block">{counts.today}</span>
        </button>

        <button
          onClick={() => setTemporalFilter('upcoming')}
          className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl ${
            temporalFilter === 'upcoming'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-inner'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider block font-semibold text-emerald-400">Próximas</span>
          <span className="text-xl md:text-2xl font-bold text-emerald-200 mt-1 block">{counts.upcoming}</span>
        </button>

        <button
          onClick={() => setTemporalFilter('nodue')}
          className={`p-4 rounded-xl border text-left transition-all backdrop-blur-xl col-span-2 sm:col-span-1 ${
            temporalFilter === 'nodue'
              ? 'bg-slate-500/15 border-slate-500/40 text-slate-200 font-semibold shadow-inner'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider block font-semibold text-slate-400">Sem Prazo</span>
          <span className="text-xl md:text-2xl font-bold text-slate-300 mt-1 block">{counts.nodue}</span>
        </button>
      </div>

      {/* BARRA DE FILTROS E CONCLUÍDAS */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        {/* FILTRO DE PRIORIDADE */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Prioridade:</span>
          </span>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'high', label: 'Alta' },
            { id: 'normal', label: 'Normal' },
            { id: 'low', label: 'Baixa' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPriorityFilter(item.id)}
              className={`px-3 py-1 rounded-xl font-medium transition-colors border ${
                priorityFilter === item.id
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CHECKBOX PARA MOSTRAR CONCLUÍDAS */}
        <label className="inline-flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded bg-white/[0.04] border-white/[0.1] text-amber-500 focus:ring-amber-500/50"
          />
          <span>Mostrar concluídas</span>
        </label>
      </div>

      {/* SECTOR DE LISTA DE TAREFAS */}
      <div className="space-y-6">
        {/* CATEGORIA: VENCIDAS */}
        {(temporalFilter === 'all' || temporalFilter === 'overdue') && (
          <TaskCategoryBlock
            title="Vencidas"
            count={counts.overdue}
            badgeClass="bg-rose-500/20 text-rose-300 border-rose-500/30"
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
            emptyMessage="Nenhuma tarefa vencida."
            tasks={sortGlobalTasks(filterByPriority(categorizedTasks.overdue), 'overdue')}
          />
        )}

        {/* CATEGORIA: HOJE */}
        {(temporalFilter === 'all' || temporalFilter === 'today') && (
          <TaskCategoryBlock
            title="Hoje"
            count={counts.today}
            badgeClass="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
            icon={<Clock className="w-4 h-4 text-indigo-400" />}
            emptyMessage="Nenhuma tarefa para hoje."
            tasks={sortGlobalTasks(filterByPriority(categorizedTasks.today), 'today')}
          />
        )}

        {/* CATEGORIA: PRÓXIMAS */}
        {(temporalFilter === 'all' || temporalFilter === 'upcoming') && (
          <TaskCategoryBlock
            title="Próximas"
            count={counts.upcoming}
            badgeClass="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            icon={<Calendar className="w-4 h-4 text-emerald-400" />}
            emptyMessage="Nenhuma tarefa próxima agendada."
            tasks={sortGlobalTasks(filterByPriority(categorizedTasks.upcoming), 'upcoming')}
          />
        )}

        {/* CATEGORIA: SEM PRAZO */}
        {(temporalFilter === 'all' || temporalFilter === 'nodue') && (
          <TaskCategoryBlock
            title="Sem Prazo"
            count={counts.nodue}
            badgeClass="bg-slate-500/20 text-slate-300 border-slate-500/30"
            icon={<ListTodo className="w-4 h-4 text-slate-400" />}
            emptyMessage="Nenhuma tarefa sem prazo."
            tasks={sortGlobalTasks(filterByPriority(categorizedTasks.nodue), 'nodue')}
          />
        )}

        {/* CATEGORIA: CONCLUÍDAS (SE MOSTRAR CONCLUÍDAS ESTIVER ATIVO) */}
        {showCompleted && (
          <TaskCategoryBlock
            title="Tarefas Concluídas"
            count={counts.completed}
            badgeClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            emptyMessage="Nenhuma tarefa concluída no histórico recente."
            tasks={sortGlobalTasks(filterByPriority(categorizedTasks.completed), 'completed')}
            isCompletedBlock
          />
        )}

        {/* EMPTY STATE GERAL QUANDO NÃO HÁ TAREFAS ABERTAS */}
        {counts.openTotal === 0 && !showCompleted && (
          <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Não existem tarefas pendentes</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todas as tarefas comerciais estão em dia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente funcional para renderizar um bloco categórico de tarefas.
 */
function TaskCategoryBlock({ title, count, badgeClass, icon, emptyMessage, tasks, isCompletedBlock = false }) {
  if (count === 0 && tasks.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-3">
        <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
          {icon}
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
            0
          </span>
        </div>
        <p className="text-xs text-slate-500 italic py-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const prioBadge = formatTaskPriority(task.priority);
          const formattedDue = formatTaskDate(task.due_at);
          const formattedComp = formatTaskDate(task.completed_at);
          const pipelineBadge = task.lead?.pipeline_stage ? formatPipelineStage(task.lead.pipeline_stage) : null;

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl bg-white/[0.02] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCompletedBlock
                  ? 'opacity-70 border-white/[0.04]'
                  : task.is_overdue
                  ? 'border-rose-500/30 bg-rose-500/[0.02]'
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* LADO ESQUERDO: TÍTULO, BADGES E METADADOS DA LEAD */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium text-xs break-words ${isCompletedBlock ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {task.title}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioBadge.className}`}>
                    {prioBadge.label}
                  </span>

                  {task.is_overdue && !isCompletedBlock && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      <span>Vencida</span>
                    </span>
                  )}
                </div>

                {/* CONTEXTO DA LEAD E PRAZO */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                  {/* LINK DA LEAD */}
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

                  {/* ETAPA PIPELINE DA LEAD */}
                  {pipelineBadge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pipelineBadge.className}`}>
                      {pipelineBadge.label}
                    </span>
                  )}

                  {/* PRAZO */}
                  {!isCompletedBlock && formattedDue && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Prazo: <strong className={task.is_overdue ? 'text-rose-400' : 'text-slate-200'}>{formattedDue}</strong></span>
                    </div>
                  )}

                  {/* DATA DE CONCLUSÃO */}
                  {isCompletedBlock && formattedComp && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Concluída a: <strong className="text-slate-300">{formattedComp}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* LADO DIREITO: LINK DIRETO LEAD 360 */}
              <div className="shrink-0 self-end md:self-center">
                <Link
                  to={`/admin/leads/${task.lead.id}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <span>Abrir Lead 360</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
