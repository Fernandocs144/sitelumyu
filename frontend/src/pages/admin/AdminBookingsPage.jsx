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

        {/* BOTÃO ATUALIZAR */}
        <div className="flex items-center space-x-3">
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
    </div>
  );
}
