import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Calendar as CalendarIcon,
  List,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Search,
  UserCheck,
  FileText,
} from 'lucide-react';
import AdminBookingsListView from '../../components/admin/AdminBookingsListView';
import AdminBookingsCalendarView from '../../components/admin/AdminBookingsCalendarView';
import AdminBookingDetailDrawer from '../../components/admin/AdminBookingDetailDrawer';

export default function AdminBookingsPage() {
  const [activeView, setActiveView] = useState('calendar'); // 'calendar' | 'list'
  const [bookingsData, setBookingsData] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado do Modal de Criação Manual de Reunião
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [searchingLeads, setSearchingLeads] = useState(false);
  const [leadSearchResults, setLeadSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bookingNotes, setBookingNotes] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/bookings', {
        credentials: 'same-origin',
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar a listagem de agendamentos');
      }

      setBookingsData(data);
    } catch (err) {
      setError(err.message || 'Falha na ligação ao servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Pesquisa de leads para o Modal de Criação (Debounced 300ms)
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

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSelectedLead(null);
    setLeadSearchQuery('');
    setBookingDate('');
    setBookingTime('');
    setDurationMinutes(30);
    setBookingNotes('');
    setCreateError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedLead(null);
    setCreateError(null);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedLead || !bookingDate || !bookingTime || savingCreate) return;

    setSavingCreate(true);
    setCreateError(null);

    const startIso = `${bookingDate}T${bookingTime}:00`;

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          lead_id: selectedLead.id,
          start_time: startIso,
          duration_minutes: Number(durationMinutes) || 30,
          notes: bookingNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao criar reunião manual');
      }

      setShowCreateModal(false);
      await fetchBookings();
    } catch (err) {
      setCreateError(err.message || 'Erro ao criar reunião manual');
    } finally {
      setSavingCreate(false);
    }
  };

  const count = bookingsData?.count ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Reuniões</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {loading ? (
                <span className="animate-pulse">A carregar...</span>
              ) : (
                `${count} ${count === 1 ? 'reunião carregada' : 'reuniões carregadas'}`
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Agenda comercial e histórico de agendamentos do agente Lumyo.
          </p>
        </div>

        {/* BOTÕES DE AÇÃO DO CABEÇALHO */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar reunião</span>
          </button>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
            <span>Atualizar</span>
          </button>
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
            onClick={fetchBookings}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* 2. ALTERNADOR DE VISTAS (PÍLULAS VISUAIS) */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] p-1.5 rounded-2xl">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveView('calendar')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeView === 'calendar'
                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 ${activeView === 'calendar' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Calendário</span>
          </button>

          <button
            onClick={() => setActiveView('list')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeView === 'list'
                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <List className={`w-4 h-4 ${activeView === 'list' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Lista</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 px-3">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Fuso horário: Europe/Lisbon</span>
        </div>
      </div>

      {/* 3. ÁREA DAS VISTAS */}
      {activeView === 'calendar' ? (
        <AdminBookingsCalendarView
          bookings={bookingsData?.bookings || []}
          onSelectBooking={setSelectedBooking}
          selectedBooking={selectedBooking}
        />
      ) : (
        <AdminBookingsListView
          bookings={bookingsData?.bookings || []}
          onSelectBooking={setSelectedBooking}
        />
      )}

      {/* 4. DRAWER DE DETALHES DA REUNIÃO (FASE E) */}
      <AdminBookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      {/* MODAL DE CRIAÇÃO MANUAL DE REUNIÃO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f0b29] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Adicionar Reunião Manual</span>
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

            <form onSubmit={handleCreateBooking} className="space-y-4">
              {/* PESQUISA DE LEAD */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lead <span className="text-rose-400">*</span>
                </label>

                {selectedLead ? (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
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
                        className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
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

              {/* DATA E HORA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hora <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* DURAÇÃO */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duração
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#0f0b29] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1h)</option>
                  <option value={90}>90 minutos (1h 30m)</option>
                  <option value={120}>120 minutos (2h)</option>
                </select>
              </div>

              {/* NOTAS */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas / Observações <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Notas internas ou tópicos a discutir na reunião..."
                  className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              {/* AÇÕES DO MODAL */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={savingCreate}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!selectedLead || !bookingDate || !bookingTime || savingCreate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {savingCreate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Reunião</span>
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
