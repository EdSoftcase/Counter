
import React, { useState } from 'react';
import { Database, Check, Terminal, RefreshCcw, Info, Wrench, ShieldCheck, UserCheck, AlertTriangle, Copy, TerminalSquare } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copiedRepair, setCopiedRepair] = useState(false);

  const repairSQL = `-- 🛡️ SCRIPT COMPLETO DE ESTRUTURA (v14 - NFC-e Ready + Fiscal)
-- RODE ESTE SCRIPT NO "SQL EDITOR" DO SUPABASE PARA ATUALIZAR O BANCO

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE CONFIGURAÇÃO FISCAL (EMPRESA)
CREATE TABLE IF NOT EXISTS public.company_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cnpj TEXT UNIQUE NOT NULL,
    ie TEXT, -- Inscrição Estadual
    im TEXT, -- Inscrição Municipal
    csc_token TEXT, -- Token CSC (SEFAZ)
    csc_id TEXT, -- ID do CSC (ex: 000001)
    environment TEXT DEFAULT 'homologation', -- homologation ou production
    cert_pfx_base64 TEXT, -- Armazenamento base64 do certificado (em prod usar Storage seguro)
    cert_password TEXT,
    company_name TEXT NOT NULL,
    address_json JSONB -- Rua, Número, Bairro, CEP, Cidade, UF
);

-- 3. TABELA DE CLIENTES (CRM ATUALIZADA)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    cpf_cnpj TEXT UNIQUE, -- Adicionado para Notas Fiscais
    address TEXT,
    region TEXT,
    notes TEXT
);

-- 4. TABELAS DE PRODUTOS E ESTOQUE (FISCAL READY)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS ncm TEXT DEFAULT '21069090';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS cfop TEXT DEFAULT '5102';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS tax_origin INTEGER DEFAULT 0;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS cest TEXT;

-- 5. TABELA DE USUÁRIOS E PERFIS
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
    hire_date DATE DEFAULT CURRENT_DATE,
    permitted_modules TEXT[]
);

-- 6. TABELAS FINANCEIRAS (FISCAL READY)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT, -- INCOME, EXPENSE
    category TEXT, 
    description TEXT,
    amount NUMERIC DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'PENDING', 
    supplier TEXT, 
    attachment_url TEXT,
    -- Campos NFC-e
    nf_key TEXT UNIQUE, -- Chave de 44 dígitos
    nf_status TEXT, -- AUTHORIZED, REJECTED, CANCELLED
    nf_pdf_url TEXT,
    nf_xml_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE, 
    status TEXT DEFAULT 'PENDING', 
    audited_by TEXT,
    notes TEXT,
    difference_value NUMERIC DEFAULT 0,
    deposit_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SEGURANÇA E POLÍTICAS
DO $$ 
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', t_name);
    END LOOP;
END $$;

ALTER TABLE public.company_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissao_configs_v14" ON public.company_configs FOR ALL USING (true);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissao_app_v14" ON public.profiles FOR ALL USING (true);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissao_crm_v14" ON public.customers FOR ALL USING (true);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissao_finance_v14" ON public.financial_transactions FOR ALL USING (true);

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
          <Database className="text-indigo-600" size={36} /> Engenharia de Dados
        </h2>
        <p className="text-slate-500 font-medium text-lg italic">Provisionamento do CRM e PDV com suporte Fiscal (NFC-e).</p>
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
              <h3 className="text-3xl font-black text-white tracking-tight">Script Full Stack v14</h3>
              <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">Inclui Tabelas e Colunas de NFC-e.</p>
            </div>
          </div>

          <p className="text-slate-400 mb-8 max-w-xl font-medium">Este script prepara seu ambiente para armazenar dados de tributação e chaves de acesso de notas fiscais de consumidor.</p>

          <button onClick={() => copyToClipboard(repairSQL, setCopiedRepair)} className={`flex items-center justify-center gap-3 px-10 py-6 rounded-[2.5rem] font-black uppercase text-xs transition-all shadow-2xl active:scale-95 ${copiedRepair ? 'bg-emerald-50 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {copiedRepair ? <Check size={20} /> : <Copy size={20} />}
            {copiedRepair ? 'Copiado! Cole no Supabase' : 'Copiar Script SQL'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[3rem] flex gap-6">
         <AlertTriangle size={32} className="text-amber-500 shrink-0" />
         <div className="space-y-2">
            <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest">Atenção para NFC-e</h4>
            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              Após rodar este script, você deverá cadastrar os dados da empresa (CNPJ, CSC e Certificado) na aba de Configurações para habilitar a mensageria fiscal com a SEFAZ.
            </p>
         </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
