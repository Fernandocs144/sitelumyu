import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ShieldCheck, LogOut, User } from 'lucide-react';

export default function AdminDashboardPlaceholder() {
  const { user, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#070513] text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between py-4 border-b border-white/[0.08] mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Consola Administrativa LUMYO</h1>
              <p className="text-xs text-slate-400">Passo 1A — Fundação de Autenticação & Autorização</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-300 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.08]">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user?.email}</span>
              <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                {user?.role || 'admin'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-2">Sessão Administrativa Ativa com Sucesso</h2>
          <p className="text-sm text-slate-400 mb-6">
            A fundação de autenticação Supabase Auth e autorização explícita server-side via <code className="text-indigo-300 bg-white/[0.06] px-1.5 py-0.5 rounded">public.admin_users</code> está operacional.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
              <span className="text-slate-400 block mb-1">ID de Utilizador</span>
              <span className="font-mono text-slate-200 break-all">{user?.id}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
              <span className="text-slate-400 block mb-1">Email Registado</span>
              <span className="font-mono text-slate-200">{user?.email}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
              <span className="text-slate-400 block mb-1">Papel Administrativo</span>
              <span className="font-mono text-emerald-400 uppercase font-semibold">{user?.role || 'admin'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
