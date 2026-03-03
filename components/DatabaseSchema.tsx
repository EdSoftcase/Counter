
import React, { useState } from 'react';
import { Database, Check, ShieldCheck, Copy, TerminalSquare, AlertTriangle } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const repairSQL = `-- 🛡️ SCRIPT DE ESTRUTURA ENTERPRISE (v15)
-- RODE ESTE SCRIPT NO "SQL EDITOR" DO SUPABASE PARA CORRIGIR COLUNAS AUSENTES

-- 1. TABELA FINANCEIRA (ADICIONAR COLUNAS FISCAIS SE NÃO EXISTIREM)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- INCOME, EXPENSE
    category TEXT, 
    description TEXT,
    amount NUMERIC DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'PENDING', 
    supplier TEXT, 
    attachment_url TEXT,
    -- Campos NFC-e (Correção do Erro nf_key)
    nf_key TEXT UNIQUE,
    nf_status TEXT, 
    nf_pdf_url TEXT,
    nf_xml_url TEXT
);

-- Garantir que as colunas existam caso a tabela já tenha sido criada anteriormente
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.financial_transactions ADD COLUMN nf_key TEXT UNIQUE;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.financial_transactions ADD COLUMN nf_status TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.financial_transactions ADD COLUMN nf_pdf_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.financial_transactions ADD COLUMN nf_xml_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 2. TABELA DE AUDITORIA DE CAIXA
CREATE TABLE IF NOT EXISTS public.cash_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE DEFAULT CURRENT_DATE, 
    status TEXT DEFAULT 'PENDING', 
    audited_by TEXT,
    notes TEXT,
    difference_value NUMERIC DEFAULT 0,
    deposit_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ITENS DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'UN',
    category TEXT DEFAULT 'PERECIVEIS',
    ideal_quantity NUMERIC DEFAULT 0,
    current_stock NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    is_ordered BOOLEAN DEFAULT FALSE,
    ncm TEXT,
    cfop TEXT,
    tax_origin INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POLÍTICAS DE ACESSO (RLS)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_finance" ON public.financial_transactions;
CREATE POLICY "permit_all_finance" ON public.financial_transactions FOR ALL USING (true);

ALTER TABLE public.cash_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_audits" ON public.cash_audits;
CREATE POLICY "permit_all_audits" ON public.cash_audits FOR ALL USING (true);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_inventory" ON public.inventory_items;
CREATE POLICY "permit_all_inventory" ON public.inventory_items FOR ALL USING (true);

NOTIFY pgrst, 'reload schema';`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(repairSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-24 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Database className="text-indigo-600" size={36} /> Engenharia de Dados
        </h2>
        <p className="text-slate-500 font-medium text-lg italic">Correção de schema e provisionamento de tabelas críticas.</p>
      </header>

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
              <h3 className="text-3xl font-black text-white tracking-tight">Script de Correção v15</h3>
              <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">Cria as colunas nf_key e tabelas de estoque/caixa.</p>
            </div>
          </div>

          <button onClick={copyToClipboard} className={`flex items-center justify-center gap-3 px-10 py-6 rounded-[2.5rem] font-black uppercase text-xs transition-all shadow-2xl active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? 'Copiado! Cole no SQL Editor do Supabase' : 'Copiar Script SQL de Correção'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[3rem] flex gap-6">
         <AlertTriangle size={32} className="text-amber-500 shrink-0" />
         <div className="space-y-2">
            <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest">Resolução do Erro nf_key</h4>
            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              O erro "Could not find the nf_key column" ocorre porque sua tabela no banco de dados ainda não possui este campo. Execute o script acima para adicionar os campos necessários para a emissão de notas e registros financeiros.
            </p>
         </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
