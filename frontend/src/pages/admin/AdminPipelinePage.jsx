import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  AlertCircle,
  Users,
  ChevronRight,
  Sparkles,
  Calendar,
  Building2,
  Tag,
  Loader2,
  CheckCircle2,
  XCircle,
  GripVertical,
} from 'lucide-react';

/**
 * Formata o nome do serviço e variante comercial.
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
 * Formata a badge visual da Classificação Comercial (lead_classification).
 */
function formatClassificationBadge(classification) {
  switch (classification) {
    case 'priority':
      return { label: 'Priority', className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    case 'qualified':
      return { label: 'Qualificado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'potential':
      return { label: 'Potencial', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'informational':
      return { label: 'Informativo', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'disqualified':
      return { label: 'Desqualificado', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: classification || 'Informativo', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

/**
 * Formata data de atividade/criação em formato legível PT.
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Determina o fallback do nome do lead.
 */
function getLeadDisplayName(lead) {
  if (lead.name && typeof lead.name === 'string' && lead.name.trim().length > 0) {
    return lead.name.trim();
  }
  if (lead.email && typeof lead.email === 'string' && lead.email.trim().length > 0) {
    return lead.email.trim();
  }
  return 'Lead sem nome';
}

/**
 * Configuração de acentos de cor por coluna do Kanban.
 */
const STAGE_CONFIG = {
  new: {
    borderColor: 'border-slate-500/40',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    headerBg: 'bg-slate-500/5',
    activeDropBg: 'bg-slate-500/10 ring-2 ring-slate-500/50',
  },
  qualified: {
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    headerBg: 'bg-emerald-500/5',
    activeDropBg: 'bg-emerald-500/10 ring-2 ring-emerald-500/50',
  },
  meeting_scheduled: {
    borderColor: 'border-amber-500/40',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    headerBg: 'bg-amber-500/5',
    activeDropBg: 'bg-amber-500/10 ring-2 ring-amber-500/50',
  },
  meeting_completed: {
    borderColor: 'border-indigo-500/40',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    headerBg: 'bg-indigo-500/5',
    activeDropBg: 'bg-indigo-500/10 ring-2 ring-indigo-500/50',
  },
  proposal: {
    borderColor: 'border-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    headerBg: 'bg-purple-500/5',
    activeDropBg: 'bg-purple-500/10 ring-2 ring-purple-500/50',
  },
  negotiation: {
    borderColor: 'border-cyan-500/40',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    headerBg: 'bg-cyan-500/5',
    activeDropBg: 'bg-cyan-500/10 ring-2 ring-cyan-500/50',
  },
  won: {
    borderColor: 'border-green-500/40',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    headerBg: 'bg-green-500/5',
    activeDropBg: 'bg-green-500/10 ring-2 ring-green-500/50',
  },
  lost: {
    borderColor: 'border-rose-500/40',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    headerBg: 'bg-rose-500/5',
    activeDropBg: 'bg-rose-500/10 ring-2 ring-rose-500/50',
  },
};

export default function AdminPipelinePage() {
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados do Drag & Drop
  const [draggingLead, setDraggingLead] = useState(null); // { id, sourceStage }
  const [dropTargetStage, setDropTargetStage] = useState(null); // stage.key
  const [pendingLeadIds, setPendingLeadIds] = useState({}); // { [leadId]: boolean }
  const [toastMessage, setToastMessage] = useState(null); // { text, type: 'error' | 'success' }

  // Auto-dismiss do Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/pipeline', {
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }

      setPipelineData(data);
    } catch (err) {
      console.error('Failed to fetch admin pipeline:', err);
      setError(err.message || 'Não foi possível carregar os dados do Pipeline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // DRAG HANDLERS
  const handleDragStart = (e, lead, sourceStageKey) => {
    if (pendingLeadIds[lead.id]) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLead({ id: lead.id, sourceStage: sourceStageKey, lead });
  };

  const handleDragEnd = () => {
    setDraggingLead(null);
    setDropTargetStage(null);
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dropTargetStage !== stageKey) {
      setDropTargetStage(stageKey);
    }
  };

  const handleDragLeave = (e, stageKey) => {
    e.preventDefault();
    if (dropTargetStage === stageKey) {
      setDropTargetStage(null);
    }
  };

  const handleDrop = async (e, targetStageKey) => {
    e.preventDefault();
    setDropTargetStage(null);

    if (!draggingLead) return;

    const { id: leadId, sourceStage, lead: targetLead } = draggingLead;

    // NO-OP DETECTADO: largado na mesma coluna original
    if (sourceStage === targetStageKey) {
      setDraggingLead(null);
      return;
    }

    // Lead já em processamento pendente
    if (pendingLeadIds[leadId]) {
      setDraggingLead(null);
      return;
    }

    // Guardar snapshot para rollback em caso de falha da API
    const prevPipelineData = pipelineData;

    // 1. ATUALIZAÇÃO OTIMISTA DO ESTADO LOCAL
    let foundLead = targetLead;
    if (!foundLead && prevPipelineData) {
      const sourceCol = prevPipelineData.stages.find((s) => s.key === sourceStage);
      foundLead = sourceCol?.leads.find((l) => l.id === leadId);
    }

    if (!foundLead) {
      setDraggingLead(null);
      return;
    }

    const updatedLead = {
      ...foundLead,
      pipeline_stage: targetStageKey,
      updated_at: new Date().toISOString(),
    };

    setPipelineData((currentData) => {
      if (!currentData) return currentData;

      return {
        ...currentData,
        stages: currentData.stages.map((stage) => {
          if (stage.key === sourceStage) {
            return {
              ...stage,
              count: Math.max(0, stage.count - 1),
              leads: stage.leads.filter((l) => l.id !== leadId),
            };
          }
          if (stage.key === targetStageKey) {
            return {
              ...stage,
              count: stage.count + 1,
              leads: [updatedLead, ...stage.leads],
            };
          }
          return stage;
        }),
      };
    });

    // Bloquear novas operações de drag para este lead enquanto o PATCH estiver em voo
    setPendingLeadIds((prev) => ({ ...prev, [leadId]: true }));
    setDraggingLead(null);

    // 2. DISPARAR PATCH /api/admin/leads/:id/pipeline
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/pipeline`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ pipeline_stage: targetStageKey }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }

      // SUCESSO! AUTORIDADE DO SERVIDOR: atualizar o lead no estado local com a resposta do DB
      if (data.lead) {
        setPipelineData((currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            stages: currentData.stages.map((stage) => {
              if (stage.key === targetStageKey) {
                return {
                  ...stage,
                  leads: stage.leads.map((l) => (l.id === leadId ? { ...l, ...data.lead } : l)),
                };
              }
              return stage;
            }),
          };
        });
      }
    } catch (err) {
      console.error('Failed to update lead pipeline stage:', err);

      // ROLLBACK OTIMISTA
      setPipelineData(prevPipelineData);
      setToastMessage({
        text: `Não foi possível mover o lead: ${err.message || 'Erro de comunicação com o servidor.'}`,
        type: 'error',
      });
    } finally {
      setPendingLeadIds((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* TOAST DE NOTIFICAÇÃO PONTUAL */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center space-x-3 text-xs max-w-md transition-all animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight text-white">Pipeline CRM</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Drag & Drop
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão visual de leads. Arraste e solte os cards entre as etapas para atualizar o Pipeline.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {pipelineData && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total: <strong className="text-white font-semibold">{pipelineData.total || 0}</strong> leads</span>
            </div>
          )}

          <button
            onClick={fetchPipeline}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all disabled:opacity-50"
            title="Atualizar Pipeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* ERRO DE CARREGAMENTO INICIAL */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPipeline}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-medium transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {loading && !pipelineData && (
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((colIndex) => (
              <div
                key={colIndex}
                className="w-[290px] shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 space-y-3"
              >
                <div className="h-6 bg-white/[0.05] rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-28 bg-white/[0.04] rounded-xl animate-pulse" />
                  <div className="h-28 bg-white/[0.04] rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABULEIRO KANBAN (8 COLUNAS DRAG & DROP) */}
      {!loading && pipelineData && (
        <div className="overflow-x-auto pb-6 max-w-full custom-scrollbar">
          <div className="flex space-x-4 min-w-max">
            {pipelineData.stages.map((stage) => {
              const config = STAGE_CONFIG[stage.key] || STAGE_CONFIG.new;
              const isDropTarget = dropTargetStage === stage.key;

              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={(e) => handleDragLeave(e, stage.key)}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className={`w-[290px] shrink-0 bg-[#0c091f]/80 border ${
                    isDropTarget ? config.activeDropBg : config.borderColor
                  } rounded-2xl flex flex-col max-h-[calc(100vh-220px)] shadow-lg backdrop-blur-sm transition-all duration-150`}
                >
                  {/* HEADER DA COLUNA */}
                  <div className={`p-3.5 border-b border-white/[0.08] ${config.headerBg} rounded-t-2xl flex items-center justify-between shrink-0`}>
                    <div className="flex items-center space-x-2 min-w-0">
                      <h3 className="font-semibold text-xs tracking-tight text-slate-100 truncate">
                        {stage.label}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeColor}`}>
                      {stage.count}
                    </span>
                  </div>

                  {/* CORPO DA COLUNA / LISTA DE CARDS */}
                  <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar min-h-[120px]">
                    {stage.leads.length === 0 ? (
                      <div className="h-28 flex items-center justify-center border border-dashed border-white/[0.08] rounded-xl bg-white/[0.01]">
                        <p className="text-[11px] text-slate-500">Sem leads nesta etapa</p>
                      </div>
                    ) : (
                      stage.leads.map((lead) => {
                        const displayName = getLeadDisplayName(lead);
                        const classBadge = formatClassificationBadge(lead.lead_classification);
                        const serviceText = formatService(lead.primary_service, lead.service_variant);
                        const isPending = !!pendingLeadIds[lead.id];
                        const isBeingDragged = draggingLead?.id === lead.id;

                        return (
                          <div
                            key={lead.id}
                            draggable={!isPending}
                            onDragStart={(e) => handleDragStart(e, lead, stage.key)}
                            onDragEnd={handleDragEnd}
                            className={`group relative p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-sm ${
                              isBeingDragged ? 'opacity-30 border-dashed border-indigo-400 scale-[0.98]' : ''
                            } ${isPending ? 'opacity-60 pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
                          >
                            {/* SPINNER SE ESTIVER PENDENTE DE PATCH */}
                            {isPending && (
                              <div className="absolute inset-0 bg-[#0c091f]/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 space-x-2">
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span className="text-[10px] text-indigo-200 font-medium">A atualizar...</span>
                              </div>
                            )}

                            {/* CABEÇALHO DO CARD / NOME E LINKS */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                                <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                  {displayName}
                                </h4>
                              </div>

                              <Link
                                to={`/admin/leads/${lead.id}`}
                                className="p-1 rounded-lg hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                                title="Ver Detalhes do Lead"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            {/* EMPRESA (SE EXISTIR) */}
                            {lead.company_name && (
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-2 truncate">
                                <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{lead.company_name}</span>
                              </div>
                            )}

                            {/* SERVIÇO */}
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-300 mb-2.5">
                              <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="font-medium truncate">{serviceText}</span>
                            </div>

                            {/* RODAPÉ DO CARD: CLASSIFICAÇÃO E DATA */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md font-medium border ${classBadge.className}`}>
                                {classBadge.label}
                              </span>

                              <div className="flex items-center space-x-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{formatDate(lead.updated_at || lead.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

