import React, { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  MessageSquare,
  CalendarCheck,
  ListTodo,
  Sparkles,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAdminAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      to: '/admin',
      exact: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/pipeline',
      label: 'Pipeline',
      icon: KanbanSquare,
    },
    {
      to: '/admin/leads',
      label: 'Leads',
      icon: Users,
    },
    {
      to: '/admin/tarefas',
      label: 'Tarefas',
      icon: ListTodo,
    },
    {
      to: '/admin/follow-ups',
      label: 'Acompanhamento',
      icon: Sparkles,
    },
    {
      to: '/admin/conversas',
      label: 'Conversas',
      icon: MessageSquare,
    },
    {
      to: '/admin/reunioes',
      label: 'Reuniões',
      icon: CalendarCheck,
    },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-[#070513] text-slate-100 font-sans flex flex-col md:flex-row">
      {/* HEADER MOBILE */}
      <header className="flex md:hidden items-center justify-between p-4 border-b border-white/[0.08] bg-[#070513]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">LUMYO Console</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* DRAWER MENU MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#070513]/98 backdrop-blur-xl pt-20 px-6 pb-6 flex flex-col justify-between">
          <nav className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3">
              Navegação Principal
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    active
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.08] pt-4 space-y-3">
            <div className="flex items-center space-x-3 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
                <span className="inline-block text-[10px] text-indigo-300 font-semibold uppercase">
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 py-2.5 rounded-xl border border-rose-500/20 transition-all font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.08] bg-[#070513]/90 min-h-screen p-5 sticky top-0 shrink-0 justify-between">
        <div className="space-y-8">
          {/* BRAND LOGO */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">LUMYO Admin</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-semibold">
                Console
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
              Painel Geral
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    active
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* FOOTER USER BADGE & LOGOUT */}
        <div className="border-t border-white/[0.08] pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
              <span className="inline-block text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 py-2 rounded-xl border border-rose-500/20 transition-all font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">
        {children ? children : <Outlet />}
      </main>
    </div>
  );
}
