import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  MessageSquare,
  CalendarCheck,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Briefcase,
  ShieldCheck,
  DollarSign,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  formatPrimaryService,
  formatLeadClassification,
  formatFinancialAlignment,
  formatCommercialStage,
  formatPrimaryOutcome,
  formatDate,
} from '../../utils/adminFormatters';

/**
 * Badge visual para resultado de conversa no Dashboard.
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
    default:
      return { label, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dashboard?period=${period}`, {
        credentials: 'same-origin',
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar o dashboard');
      }

      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Falha na ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = dashboardData?.kpis || {
    totalLeads: 0,
    qualifiedLeads: 0,
    totalConversations: 0,
    meetingsBooked: 0,
  };

  const distributions = dashboardData?.distributions || {
    leadsByClassification: [],
    leadsByService: [],
    financialAlignment: [],
  };

  const recentLeads = dashboardData?.recentLeads || [];
  const recentConversations = dashboardData?.recentConversations || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visão geral da atividade comercial do agente Lumyo.
          </p>
        </div>

        {/* SELETOR TEMPORAL */}
        <div className="relative inline-block w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={loading}
            className="w-full sm:w-auto bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-3 pr-8 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="7d" className="bg-[#070513] text-slate-300">Últimos 7 dias</option>
            <option value="30d" className="bg-[#070513] text-slate-300">Últimos 30 dias</option>
            <option value="90d" className="bg-[#070513] text-slate-300">Últimos 90 dias</option>
            <option value="all" className="bg-[#070513] text-slate-300">Todo o período</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
            onClick={fetchDashboardData}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* 2. KPIS PRINCIPAIS (CARDS EM GRELHA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD LEADS */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? <span className="animate-pulse text-slate-600">...</span> : kpis.totalLeads}
          </div>
          <p className="text-[11px] text-slate-400">Total de leads captadas no período</p>
        </div>

        {/* CARD LEADS QUALIFICADAS */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Qualificadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? <span className="animate-pulse text-slate-600">...</span> : kpis.qualifiedLeads}
          </div>
          <p className="text-[11px] text-slate-400">Classificadas como Qualified ou Priority</p>
        </div>

        {/* CARD CONVERSAS */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? <span className="animate-pulse text-slate-600">...</span> : kpis.totalConversations}
          </div>
          <p className="text-[11px] text-slate-400">Sessões ativas com atividade no período</p>
        </div>

        {/* CARD REUNIÕES AGENDADAS */}
        <Link
          to="/admin/reunioes"
          className="group block bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-xl space-y-3 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition-colors uppercase tracking-wider">
              Reuniões Agendadas
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? <span className="animate-pulse text-slate-600">...</span> : kpis.meetingsBooked}
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
            Reuniões confirmadas com o cliente
          </p>
        </Link>
      </div>

      {/* 3. DISTRIBUIÇÕES COMERCIAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEADS POR CLASSIFICAÇÃO */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.08]">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Leads por Classificação</h2>
          </div>

          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">A carregar métricas...</div>
            ) : distributions.leadsByClassification.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Sem dados no período</div>
            ) : (
              distributions.leadsByClassification.map((item) => (
                <div key={item.key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">{formatLeadClassification(item.key)}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LEADS POR SERVIÇO */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.08]">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Leads por Serviço</h2>
          </div>

          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">A carregar métricas...</div>
            ) : distributions.leadsByService.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Sem dados no período</div>
            ) : (
              distributions.leadsByService.map((item) => (
                <div key={item.key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">{formatPrimaryService(item.key)}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ALINHAMENTO FINANCEIRO */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.08]">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Alinhamento Financeiro</h2>
          </div>

          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">A carregar métricas...</div>
            ) : distributions.financialAlignment.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Sem dados no período</div>
            ) : (
              distributions.financialAlignment.map((item) => (
                <div key={item.key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">{formatFinancialAlignment(item.key)}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. ATIVIDADE RECENTE (LEADS RECENTES & CONVERSAS RECENTES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEADS RECENTES */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Leads Recentes</h2>
            </div>
            <Link
              to="/admin/leads"
              className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">A carregar leads recentes...</div>
            ) : recentLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Nenhuma lead registada no período</div>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                >
                  <div className="space-y-0.5 max-w-[200px] sm:max-w-xs truncate">
                    <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {formatPrimaryService(lead.primary_service)} • {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20">
                      {formatLeadClassification(lead.lead_classification)}
                    </span>
                    <Link
                      to={`/admin/leads/${lead.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="Ver detalhe da lead"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CONVERSAS RECENTES */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Conversas Recentes</h2>
            </div>
            <Link
              to="/admin/conversas"
              className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">A carregar conversas recentes...</div>
            ) : recentConversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Nenhuma conversa registada no período</div>
            ) : (
              recentConversations.map((conv) => {
                const badge = formatOutcomeBadge(conv.primary_outcome);

                return (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                  >
                    <div className="space-y-0.5 max-w-[200px] sm:max-w-xs truncate">
                      <p className="text-xs font-semibold text-white truncate">{conv.visitor_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {formatCommercialStage(conv.commercial_stage)} • {formatDate(conv.last_activity_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <Link
                        to={`/admin/conversas/${conv.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Ver transcrição da conversa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
