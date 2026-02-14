
import React, { useState } from 'react';
import { Database, Table, Key, Link as LinkIcon, Info, Copy, Check, Terminal } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const masterSQL = `-- 1. EXTENSÕES PARA UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Operador',
    access_level TEXT DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE ROTINAS
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'DIARIA',
    deadline TEXT DEFAULT '12:00',
    require_photo BOOLEAN DEFAULT true,
    require_geo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE PONTO
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL,
    status TEXT DEFAULT 'ORIGINAL',
    hash TEXT,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
    executed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    executed_by TEXT,
    status TEXT DEFAULT 'CONCLUIDO',
    evidence_url TEXT,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA DE INVENTÁRIO
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'UN',
    ideal_quantity NUMERIC DEFAULT 0,
    current_stock NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(masterSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="text-emerald-500" size={36} /> Arquitetura de Dados
        </h2>
        <p className="text-slate-500">Esquema unificado para sincronização em tempo real via Supabase.</p>
      </header>

      <section className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <Terminal className="text-emerald-400" size={20} />
            <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Master Schema SQL</span>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar SQL'}
          </button>
        </div>
        <div className="p-8">
          <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] text-emerald-400/70 overflow-x-auto custom-scrollbar whitespace-pre max-h-[400px]">
            {masterSQL}
          </div>
        </div>
      </section>

      <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-500 shrink-0">
          <Info size={28} />
        </div>
        <div>
          <h4 className="font-black text-amber-900 mb-2">Instruções de Resgate</h4>
          <p className="text-amber-800/80 text-sm leading-relaxed">
            Se encontrar erros de relação existente ou campos nulos, execute o script acima. O comando <code>IF NOT EXISTS</code> garante que tabelas com dados não sejam apagadas, enquanto <code>DEFAULT gen_random_uuid()</code> assegura que cada novo registro receba um ID único automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
