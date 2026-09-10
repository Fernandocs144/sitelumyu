import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

/**
 * Formata o nome do serviço e respetiva variante comercial.
 */
function formatService(primaryService, serviceVariant) {
  const serviceMap = {
    websites: 'Websites',
    automation: 'Automação',
    ai: 'Inteligência Artificial',
    digital_growth: 'Crescimento Digital',
  };
  const base = serviceMap[primaryService] || primaryService || '—';
  if (primaryService === 'websites' && serviceVariant) {
    const variantMap = {
      landing_page: 'Landing Page',
      institutional_website: 'Institucional',
      custom_website: 'À Medida',
      ecommerce: 'E-commerce',
    };
    return `${base} (${variantMap[serviceVariant] || serviceVariant})`;
  }
  return base;
}

/**
 * Formata os limites orçamentais.
 */
function formatBudget(lead) {
  const min = lead.stated_budget_min;
  const max = lead.stated_budget_max;
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${Number(min).toLocaleString('pt-PT')}€ - ${Number(max).toLocaleString('pt-PT')}€`;
  }
  if (min !== null && min !== undefined) {
    return `>= ${Number(min).toLocaleString('pt-PT')}€`;
  }
  if (max !== null && max !== undefined) {
    return `<= ${Number(max).toLocaleString('pt-PT')}€`;
  }
  if (lead.stated_budget_raw) {
    return lead.stated_budget_raw;
  }
  return '—';
}

/**
 * Formata a badge visual de Alinhamento Financeiro.
 */
function formatAlignmentBadge(status) {
  switch (status) {
    case 'aligned':
      return { label: 'Elevado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'possibly_low':
      return { label: 'Moderado', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'low_alignment':
      return { label: 'Baixo', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: 'Não avaliado', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

/**
 * Formata a badge visual de Classificação Comercial.
 */
function formatClassificationBadge(classification) {
  switch (classification) {
    case 'priority':
      return { label: 'Priority', className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    case 'qualified':
      return { label: 'Qualified', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'potential':
      return { label: 'Potential', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'informational':
      return { label: 'Informational', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'disqualified':
      return { label: 'Disqualified', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: classification || 'Informational', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

/**
 * Formata data de atividade/criação.
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce de 300ms para o campo de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset da página para 1 quando os filtros/pesquisa mudam
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, serviceFilter, classificationFilter]);

  // Obter dados da API real GET /api/admin/leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (serviceFilter) params.set('service', serviceFilter);
      if (classificationFilter) params.set('classification', classificationFilter);

      const response = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar a listagem de leads');
      }

      setLeads(data.leads || []);
      setPagination(data.pagination || { page, pageSize: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Falha na ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, serviceFilter, classificationFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão e acompanhamento das leads qualificadas pelo agente comercial
          </p>
        </div>
        {!loading && (
          <div className="text-xs text-slate-400">
            Total: <span className="font-semibold text-slate-200">{pagination.total}</span> leads
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
            placeholder="Pesquisar por nome, email ou empresa..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="relative">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer"
          >
            <option value="" className="bg-[#070513] text-slate-300">Todos os Serviços</option>
            <option value="websites" className="bg-[#070513] text-slate-300">Websites</option>
            <option value="automation" className="bg-[#070513] text-slate-300">Automação</option>
            <option value="ai" className="bg-[#070513] text-slate-300">Inteligência Artificial</option>
            <option value="digital_growth" className="bg-[#070513] text-slate-300">Crescimento Digital</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none pr-8 cursor-pointer"
          >
            <option value="" className="bg-[#070513] text-slate-300">Todas as Classificações</option>
            <option value="priority" className="bg-[#070513] text-slate-300">Priority</option>
            <option value="qualified" className="bg-[#070513] text-slate-300">Qualified</option>
            <option value="potential" className="bg-[#070513] text-slate-300">Potential</option>
            <option value="informational" className="bg-[#070513] text-slate-300">Informational</option>
            <option value="disqualified" className="bg-[#070513] text-slate-300">Disqualified</option>
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
            onClick={fetchLeads}
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
              <th className="py-3.5 px-4">Lead / Contacto</th>
              <th className="py-3.5 px-4">Serviço Principal</th>
              <th className="py-3.5 px-4">Orçamento</th>
              <th className="py-3.5 px-4">Alinhamento</th>
              <th className="py-3.5 px-4">Classificação</th>
              <th className="py-3.5 px-4">Última Atividade</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <p className="text-xs text-slate-400">A carregar leads do servidor...</p>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Nenhuma lead encontrada</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {debouncedSearch || serviceFilter || classificationFilter
                        ? 'Não foram encontradas leads que correspondam aos filtros selecionados.'
                        : 'Não existem registos de leads comerciais no sistema.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const alignBadge = formatAlignmentBadge(lead.financial_alignment_status);
                const classBadge = formatClassificationBadge(lead.lead_classification);
                return (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {lead.name || lead.company_name || 'Lead sem nome'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {lead.email || lead.phone || 'Sem contacto'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {formatService(lead.primary_service, lead.service_variant)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatBudget(lead)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${alignBadge.className}`}>
                        {alignBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${classBadge.className}`}>
                        {classBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(lead.last_interaction_at || lead.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Ver Detalhe</span>
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
              <p className="text-xs text-slate-400">A carregar leads do servidor...</p>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhuma lead encontrada</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {debouncedSearch || serviceFilter || classificationFilter
                  ? 'Não foram encontradas leads que correspondam aos filtros selecionados.'
                  : 'Não existem registos de leads comerciais no sistema.'}
              </p>
            </div>
          </div>
        ) : (
          leads.map((lead) => {
            const alignBadge = formatAlignmentBadge(lead.financial_alignment_status);
            const classBadge = formatClassificationBadge(lead.lead_classification);
            return (
              <div
                key={lead.id}
                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 backdrop-blur-xl"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {lead.name || lead.company_name || 'Lead sem nome'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lead.email || lead.phone || 'Sem contacto'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${classBadge.className}`}>
                    {classBadge.label}
                  </span>
                </div>

                {/* Grelha de Métricas */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Serviço</span>
                    <span className="text-slate-300 font-medium">
                      {formatService(lead.primary_service, lead.service_variant)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Orçamento</span>
                    <span className="text-slate-300 font-medium">{formatBudget(lead)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Alinhamento</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${alignBadge.className}`}>
                      {alignBadge.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Última Atividade</span>
                    <span className="text-slate-400">{formatDate(lead.last_interaction_at || lead.created_at)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                  <Link
                    to={`/admin/leads/${lead.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Ver Detalhe</span>
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
