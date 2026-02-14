
import React, { useState } from 'react';
import { Database, Check, Terminal, RefreshCcw, Info, Wrench, ShieldCheck, UserCheck, AlertTriangle, Copy, TerminalSquare } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copiedRepair, setCopiedRepair] = useState(false);

  const repairSQL = `-- 🛡️ SCRIPT DE INFRAESTRUTURA ENTERPRISE (v7)
-- COPIE APENAS DAQUI PARA BAIXO

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. LIMPEZA DE SEGURANÇA (Para permitir o primeiro acesso)
DO $$ 
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', t_name);
    END LOOP;
END $$;

-- 3. ESTRUTURA DA TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role_name TEXT,
    access_level TEXT,
    company_id TEXT DEFAULT 'c1',
    salary NUMERIC DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE
);

-- 4. PROVISIONAMENTO DO ADMINISTRADOR GERAL (654321)
INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    password, 
    role_name, 
    access_level, 
    company_id, 
    salary
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'Administrador Geral', 
  'admin@counter.com.br', 
  '654321',
  'Gestor Master', 
  'ADMIN', 
  'c1', 
  20000
)
ON CONFLICT (email) DO UPDATE 
SET 
    password = '654321',
    access_level = 'ADMIN',
    name = 'Administrador Geral';

-- 5. REATIVAR SEGURANÇA COM POLÍTICA ABERTA PARA O APP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissao_app_v7" ON public.profiles;
CREATE POLICY "permissao_app_v7" ON public.profiles FOR ALL USING (true);

-- Notificar recarregamento
NOTIFY pgrst, 'reload schema';`;

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-10 pb-24 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="text-indigo-600" size={36} /> Engenharia de Resgate
        </h2>
        <p className="text-slate-500 font-medium text-lg italic">
          Provisionamento do Admin Master e correção de login.
        </p>
      </header>

      <div className="bg-rose-50 border-4 border-rose-200 p-8 rounded-[3rem] flex items-start gap-6 shadow-sm">
        <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg animate-pulse">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-rose-800">ERRO DETECTADO: VOCÊ COPIOU O CÓDIGO ERRADO!</h4>
          <p className="text-rose-700 font-medium leading-relaxed">
            O Supabase não entende comandos como <b>"import React"</b> ou <b>"const"</b>. <br/>
            Você deve copiar <b>APENAS</b> o texto com fundo verde abaixo. Ele contém os comandos SQL que o banco de dados entende.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border-[8px] border-indigo-500/20 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 text-indigo-500 opacity-10 group-hover:scale-110 transition-transform">
          <ShieldCheck size={220} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl">
              <TerminalSquare size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">Script de Acesso Unificado</h3>
              <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                Admin: admin@counter.com.br | Senha: 654321
              </p>
            </div>
          </div>

          <p className="text-slate-300 font-medium leading-relaxed max-w-3xl mb-10 text-lg">
            Clique no botão abaixo para copiar o script correto. Depois, cole no <b>SQL Editor</b> do Supabase e clique em <b>RUN</b>.
          </p>

          <button 
            onClick={() => copyToClipboard(repairSQL, setCopiedRepair)}
            className={`flex items-center justify-center gap-3 px-10 py-6 rounded-[2.5rem] font-black uppercase text-xs transition-all shadow-2xl active:scale-95 ${
              copiedRepair ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copiedRepair ? <Check size={20} /> : <Copy size={20} />}
            {copiedRepair ? 'Copiado! Agora cole no Supabase' : 'Copiar Apenas o SQL (Correto)'}
          </button>
        </div>
      </div>

      <section className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100">
        <div className="p-10 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
          <Terminal size={24} className="text-slate-400" />
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Texto que deve ser colado no Supabase:</h4>
        </div>
        <div className="p-10">
          <div className="bg-emerald-900/10 rounded-[2rem] p-8 font-mono text-[11px] text-emerald-700 leading-relaxed border border-emerald-500/20 shadow-inner h-96 overflow-auto custom-scrollbar">
            <pre>{repairSQL}</pre>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DatabaseSchema;
