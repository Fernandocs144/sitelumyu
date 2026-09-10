import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  formatCommercialStage,
  formatPrimaryOutcome,
  formatDate,
} from '../../utils/adminFormatters';

/**
 * Formata a badge de resultado da conversa.
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

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce de 300ms para a pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset para página 1 ao alterar pesquisa ou filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stageFilter, outcomeFilter]);

  // Obter conversas da API real GET /api/admin/conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (stageFilter) params.set('stage', stageFilter);
      if (outcomeFilter) params.set('outcome', outcomeFilter);

      const response = await fetch(`/api/admin/conversations?${params.toString()}`, {
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar a listagem de conversas');
      }

      setConversations(data.conversations || []);
      setPagination(data.pagination || { page, pageSize: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Falha na ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stageFilter, outcomeFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversas</h1>
          <p className="text-xs text-slate-400 mt-1">
            Histórico completo e monitorização das sessões conversacionais do agente Lumyo
          </p>
        </div>
        {!loading && (
          <div className="text-xs text-slate-400">
            Total: <span className="font-semibold text-slate-200">{pagination.total}</span> conversas
          </div>
        )}
      </div>

      {/* ÁREA DE PESQUISA E FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/[0.03] border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar por ID da conversa, nome ou email..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="relative">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer"
          >
            <option value="" className="bg-[#070513] text-slate-300">Todas as Etapas</option>
            <option value="discovery" className="bg-[#070513] text-slate-300">Descoberta</option>
            <option value="exploring_need" className="bg-[#070513] text-slate-300">Exploração da Necessidade</option>
            <option value="qualifying" className="bg-[#070513] text-slate-300">Qualificação Comercial</option>
            <option value="suggesting_booking" className="bg-[#070513] text-slate-300">Proposta de Agendamento</option>
            <option value="booking_in_progress" className="bg-[#070513] text-slate-300">Agendamento em Curso</option>
            <option value="closed" className="bg-[#070513] text-slate-300">Encerrada</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer"
          >
            <option value="" className="bg-[#070513] text-slate-300">Todos os Resultados</option>
            <option value="meeting_booked" className="bg-[#070513] text-slate-300">Reunião Agendada</option>
            <option value="lead_qualified" className="bg-[#070513] text-slate-300">Lead Qualificada</option>
            <option value="lead_captured" className="bg-[#070513] text-slate-300">Contacto Capturado</option>
            <option value="information_only" className="bg-[#070513] text-slate-300">Informacional</option>
            <option value="human_handoff" className="bg-[#070513] text-slate-300">Handoff Humano</option>
            <option value="not_interested" className="bg-[#070513] text-slate-300">Sem Interesse</option>
            <option value="possible_abandonment" className="bg-[#070513] text-slate-300">Possível Abandono</option>
            <option value="abandoned_during_booking" className="bg-[#070513] text-slate-300">Abandono no Agendamento</option>
            <option value="abandoned_during_qualification" className="bg-[#070513] text-slate-300">Abandono na Qualificação</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ESTADO DE ERRO */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchConversations}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* VISTA DESKTOP: TABELA */}
      <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-white/[0.04] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-white/[0.08]">
            <tr>
              <th className="py-3.5 px-4">Sessão / Lead</th>
              <th className="py-3.5 px-4">Etapa Comercial</th>
              <th className="py-3.5 px-4">Resultado</th>
              <th className="py-3.5 px-4">Mensagens</th>
              <th className="py-3.5 px-4">Última Atividade</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <p className="text-xs text-slate-400">A carregar conversas do servidor...</p>
                  </div>
                </td>
              </tr>
            ) : conversations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Nenhuma conversa encontrada</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {debouncedSearch || stageFilter || outcomeFilter
                        ? 'Não foram encontradas conversas que correspondam aos filtros selecionados.'
                        : 'Não existem registos de conversas ativas no sistema.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              conversations.map((conv) => {
                const outcomeBadge = formatOutcomeBadge(conv.primary_outcome);
                const leadName = conv.lead?.name || conv.lead?.company_name || null;
                const leadContact = conv.lead?.email || conv.lead?.phone || null;

                return (
                  <tr key={conv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      {leadName ? (
                        <div>
                          <div className="font-semibold text-white flex items-center space-x-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{leadName}</span>
                          </div>
                          {leadContact && <div className="text-[11px] text-slate-400 mt-0.5 ml-5">{leadContact}</div>}
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-400 flex items-center space-x-1.5">
                            <UserX className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>Visitante não identificado</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5 ml-5">
                            ID: {conv.id.substring(0, 8)}...
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {formatCommercialStage(conv.commercial_stage)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${outcomeBadge.className}`}>
                        {outcomeBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(conv.last_activity_at || conv.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/conversas/${conv.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Ver Conversa</span>
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VISTA MOBILE: CARDS VERTICAIS */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">A carregar conversas do servidor...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhuma conversa encontrada</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {debouncedSearch || stageFilter || outcomeFilter
                  ? 'Não foram encontradas conversas que correspondam aos filtros selecionados.'
                  : 'Não existem registos de conversas ativas no sistema.'}
              </p>
            </div>
          </div>
        ) : (
          conversations.map((conv) => {
            const outcomeBadge = formatOutcomeBadge(conv.primary_outcome);
            const leadName = conv.lead?.name || conv.lead?.company_name || null;
            const leadContact = conv.lead?.email || conv.lead?.phone || null;

            return (
              <div
                key={conv.id}
                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
                      {leadName ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{leadName}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-slate-400 font-normal">Visitante não identificado</span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {leadContact || `Sessão: ${conv.id.substring(0, 8)}...`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${outcomeBadge.className}`}>
                    {outcomeBadge.label}
                  </span>
                </div>

                {/* Grelha de Métricas da Conversa */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Etapa Comercial</span>
                    <span className="text-slate-300 font-medium">
                      {formatCommercialStage(conv.commercial_stage)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Mensagens</span>
                    <span className="text-slate-300 font-medium">{conv.messageCount} msgs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Resultado</span>
                    <span className="text-slate-300 font-medium">{formatPrimaryOutcome(conv.primary_outcome)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Última Atividade</span>
                    <span className="text-slate-400">{formatDate(conv.last_activity_at || conv.created_at)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                  <Link
                    to={`/admin/conversas/${conv.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Ver Conversa</span>
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONTROLO DE PAGINAÇÃO */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs">
          <div className="text-slate-400">
            Página <span className="font-medium text-slate-200">{pagination.page}</span> de{' '}
            <span className="font-medium text-slate-200">{pagination.totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Seguinte</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
