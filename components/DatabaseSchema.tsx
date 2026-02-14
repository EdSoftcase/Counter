
import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, AlertTriangle, ShieldCheck } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copiedRepair, setCopiedRepair] = useState(false);

  const repairSQL = `-- SCRIPT DE ATUALIZAÇÃO ENTERPRISE V12: ESTOQUE E ROTINAS POR SETOR
-- Execute este script no SQL Editor do seu Supabase para corrigir erros de esquema.

-- 1. Atualização da Tabela de Rotinas (Routines)
-- Adiciona suporte a controle de estoque e filtragem por cargo/dia
ALTER TABLE routines ADD COLUMN IF NOT EXISTS is_stock_control BOOLEAN DEFAULT false;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS target_categories TEXT[];
ALTER TABLE routines ADD COLUMN IF NOT EXISTS target_roles TEXT[];
ALTER TABLE routines ADD COLUMN IF NOT EXISTS day_of_week INTEGER DEFAULT 1;

-- 2. Atualização da Tabela de Inventário (Inventory Items)
-- Garante colunas para categorização e alertas
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'PERECIVEIS';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS ideal_quantity NUMERIC DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_ordered BOOLEAN DEFAULT false;

-- 3. Tabela de Logs de Auditoria de Estoque
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    item_name TEXT,
    old_stock NUMERIC,
    new_stock NUMERIC,
    change_type TEXT,
    executed_by TEXT,
    evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Atualização da Tabela de Perfis (Profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 5. Tabela de Controle de Férias
CREATE TABLE IF NOT EXISTS employee_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    hire_date DATE NOT NULL,
    planned_date DATE NOT NULL,
    cost_estimated NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'PROVISIONADO',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela Financeira e Métodos de Pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fee_percentage NUMERIC DEFAULT 0,
    settlement_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT CHECK (category IN ('INVENTORY', 'SERVICE', 'UTILITY', 'LABOR', 'LOAN', 'LEGAL', 'MAINTENANCE', 'FEES', 'OTHER')),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('PAID', 'PENDING')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RECARREGAR CACHE DO POSTGREST PARA RECONHECER NOVAS COLUNAS
NOTIFY pgrst, 'reload schema';`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRepair(true);
    setTimeout(() => setCopiedRepair(false), 2000);
  };

  return (
    <div className="space-y-10 pb-24 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="text-emerald-500" size={36} /> Painel do Engenheiro
        </h2>
        <p className="text-slate-500">Configuração de Banco de Dados e Esquema SQL V12.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50 border-2 border-rose-200 p-8 rounded-[2.5rem] flex items-start gap-5 text-rose-800 shadow-sm">
          <AlertTriangle className="shrink-0 mt-1" size={32} />
          <div>
            <p className="font-black text-lg uppercase tracking-tight">Correção de Erros de Coluna</p>
            <p className="text-sm font-bold opacity-80 mt-1 leading-relaxed">
              O erro "Could not find column day_of_week" ocorre porque o banco de dados ainda não tem as colunas para rotinas inteligentes. 
              <strong> Copie o script abaixo e execute no SQL Editor do Supabase.</strong>
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 p-8 rounded-[2.5rem] flex items-start gap-5 text-emerald-800 shadow-sm">
          <ShieldCheck className="shrink-0 mt-1" size={32} />
          <div>
            <p className="font-black text-lg uppercase tracking-tight">Integridade Enterprise</p>
            <p className="text-sm font-bold opacity-80 mt-1 leading-relaxed">
              Este script V12 habilita o levantamento de estoque por setor e a automação de segundas-feiras.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 transition-all hover:border-emerald-500/30">
        <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Terminal className="text-emerald-400" size={24} />
            <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em]">Full Database Setup V12 (Enterprise)</span>
          </div>
          <button 
            onClick={() => copyToClipboard(repairSQL)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-6 py-3 rounded-2xl text-white text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
          >
            {copiedRepair ? <Check size={14} /> : <Copy size={14} />}
            {copiedRepair ? 'Copiado!' : 'Copiar Script de Reparo'}
          </button>
        </div>
        <div className="p-8">
          <div className="bg-black/40 rounded-3xl p-8 font-mono text-[12px] text-emerald-400/80 overflow-x-auto whitespace-pre leading-relaxed border border-white/5 custom-scrollbar h-[500px]">
            {repairSQL}
          </div>
        </div>
      </section>

      <footer className="text-center p-8 bg-white border border-slate-200 rounded-[2rem] text-slate-400 text-xs font-bold uppercase tracking-widest">
        Dica: Após rodar o SQL, atualize a página para que o Supabase limpe o cache do esquema e reconheça as novas colunas.
      </footer>
    </div>
  );
};

export default DatabaseSchema;
