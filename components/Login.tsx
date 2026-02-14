
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, User as UserIcon, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

export interface LoginProps {
  onLogin: (role: UserRole, name: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(selectedRole, selectedRole === UserRole.ADMIN ? 'Ricardo Santos' : 'João Pizzaiolo');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center font-black text-4xl text-white mx-auto mb-6 shadow-[0_20px_40px_rgba(16,185,129,0.3)]">
            C
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Counter Enterprise</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Gestão operacional inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4">
             <button 
               type="button"
               onClick={() => setSelectedRole(UserRole.ADMIN)}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedRole === UserRole.ADMIN ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
             >
               <ShieldCheck size={14} /> Admin
             </button>
             <button 
               type="button"
               onClick={() => setSelectedRole(UserRole.OPERATOR)}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedRole === UserRole.OPERATOR ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
             >
               <UserIcon size={14} /> Funcionário
             </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  defaultValue={selectedRole === UserRole.ADMIN ? "admin@empresa.com.br" : "joao@pizzaria.com.br"}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  defaultValue="password"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
          >
            {loading ? "Autenticando..." : `Entrar como ${selectedRole === UserRole.ADMIN ? 'Gestor' : 'Operacional'}`}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  );
}
