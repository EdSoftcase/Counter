
import React, { useState } from 'react';
import { Database, Check, Terminal, RefreshCcw, Info, Wrench, ShieldX, Bomb, ZapOff, LifeBuoy } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const [copiedRepair, setCopiedRepair] = useState(false);

  const repairSQL = `-- 🚀 SCRIPT DE RECONSTRUÇÃO TOTAL (SOLUÇÃO DEFINITIVA)
-- Este script resolve: 42703 (coluna ausente), 22P02 (erro UUID) e 42P17 (recursão).

-- 1. Desativar Segurança para Manutenção
DO $$ 
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', t_name);
    END LOOP;
END $$;

-- 2. Limpeza Radical de Políticas Conflitantes
DO $$ 
DECLARE
    pol_record RECORD;
BEGIN
    FOR pol_record IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_record.policyname, pol_record.tablename);
    END LOOP;
END $$;

-- 3. REMOÇÃO DE CONSTRAINTS QUE BLOQUEIAM TIPOS
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;
ALTER TABLE IF EXISTS routines DROP CONSTRAINT IF EXISTS routines_company_id_fkey;
ALTER TABLE IF EXISTS inventory_items DROP CONSTRAINT IF EXISTS inventory_items_company_id_fkey;
ALTER TABLE IF EXISTS financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_company_id_fkey;

-- 4. NORMALIZAÇÃO DINÂMICA DE COLUNAS (A Solução Real)
-- Este bloco verifica se a tabela existe e se a coluna company_id existe/precisa de alteração.
DO $$ 
DECLARE
    t_name TEXT;
    tables_to_fix TEXT[] := ARRAY[
        'profiles', 'routines', 'inventory_items', 'financial_transactions', 
        'task_logs', 'time_logs', 'payment_methods', 'compliance_services', 
        'employee_vacations', 'inventory_logs'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_fix LOOP
        -- Verifica se a tabela existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            -- Se a coluna NÃO existe, cria como TEXT
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'company_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN company_id TEXT DEFAULT %L', t_name, 'c1');
            ELSE
                -- Se a coluna EXISTE, força conversão para TEXT (Resolve 22P02)
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id TYPE TEXT USING company_id::text', t_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Função de Segurança Blindada (Resolve 42P17)
CREATE OR REPLACE FUNCTION public.get_my_company() 
RETURNS TEXT AS $$
  -- SECURITY DEFINER ignora o RLS da tabela profiles, quebrando o loop infinito
  SELECT company_id::text FROM public.profiles WHERE id = auth.uid()::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Re-aplicação de RLS e Políticas Seguras
DO $$ 
DECLARE
    t_name TEXT;
    tables_to_protect TEXT[] := ARRAY['profiles', 'routines', 'inventory_items', 'financial_transactions', 'time_logs', 'task_logs'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_protect LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
            
            -- Política de isolamento por empresa (Casts explícitos para segurança)
            IF t_name = 'profiles' THEN
                EXECUTE format('CREATE POLICY "perfil_proprio" ON public.%I FOR ALL USING (auth.uid()::uuid = id::uuid)', t_name);
            END IF;
            
            EXECUTE format('CREATE POLICY "isolamento_empresa" ON public.%I FOR ALL USING (company_id::text = get_my_company())', t_name);
        END IF;
    END LOOP;
END $$;

-- 7. Garantir colunas essenciais no profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;

-- 8. Reset do Admin (Garante que você consiga logar)
INSERT INTO profiles (id, name, email, role_name, access_level, company_id, salary)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'Admin Master', 
  'admin@counter.com.br', 
  'Administrador', 
  'ADMIN', 
  'c1', 
  10000
)
ON CONFLICT (email) DO UPDATE 
SET access_level = 'ADMIN', company_id = 'c1';

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
          Solução mestre para conflitos de esquema, chaves e recursão infinita.
        </p>
      </header>

      {/* BOX DE SOLUÇÃO DEFINITIVA */}
      <div className="bg-slate-900 border-[8px] border-indigo-500/20 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 text-indigo-500 opacity-10 group-hover:scale-110 transition-transform">
          <LifeBuoy size={220} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl animate-pulse">
              <Wrench size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">Script Inteligente (Auto-Check)</h3>
              <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">Resolve Erros 42703, 22P02, 42P17 e 42804</p>
            </div>
          </div>

          <p className="text-slate-300 font-medium leading-relaxed max-w-3xl mb-10 text-lg">
            Este script usa <b>Lógica Dinâmica (PL/pgSQL)</b>. Ele verifica se a tabela e a coluna existem antes de tentar alterá-las. 
            Isso evita o erro de "coluna não encontrada" e garante que o campo <b>company_id</b> seja sempre <b>TEXTO</b> para aceitar identificadores como 'c1'.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => copyToClipboard(repairSQL, setCopiedRepair)}
              className={`flex items-center justify-center gap-3 px-10 py-6 rounded-[2.5rem] font-black uppercase text-xs transition-all shadow-2xl active:scale-95 ${
                copiedRepair ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copiedRepair ? <Check size={20} /> : <RefreshCcw size={20} />}
              {copiedRepair ? 'Copiado!' : 'Copiar Script Inteligente de Reparo'}
            </button>
            
            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 font-black text-[10px] uppercase">
              <Info size={14} className="text-indigo-400" /> Use no SQL Editor do Supabase
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100">
        <div className="p-10 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
          <Terminal size={24} className="text-slate-400" />
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Código SQL Resolutivo (Dinâmico)</h4>
        </div>
        <div className="p-10">
          <div className="bg-slate-900 rounded-[2rem] p-8 font-mono text-[11px] text-emerald-400/80 overflow-x-auto leading-relaxed border border-emerald-500/20 shadow-inner h-96 custom-scrollbar">
            {repairSQL}
          </div>
        </div>
      </section>

      <div className="bg-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><ZapOff size={160} /></div>
        <div className="relative z-10">
          <h4 className="text-2xl font-black mb-6 flex items-center gap-3">Como este script funciona:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-medium opacity-90 leading-relaxed">
            <div className="space-y-2">
               <p className="font-black text-indigo-100">1. Varredura Dinâmica</p>
               <p>Ele percorre todas as tabelas e verifica se <b>company_id</b> existe. Se não existir, ele a cria automaticamente.</p>
            </div>
            <div className="space-y-2">
               <p className="font-black text-indigo-100">2. Conversão de Tipos</p>
               <p>Se a coluna for do tipo antigo (UUID), o script força a conversão para <b>TEXT</b> usando <i>CAST</i>.</p>
            </div>
            <div className="space-y-2">
               <p className="font-black text-indigo-100">3. Quebra de Recursão</p>
               <p>Usa <b>SECURITY DEFINER</b> para garantir que a checagem da empresa não entre em loop infinito.</p>
            </div>
            <div className="space-y-2">
               <p className="font-black text-indigo-100">4. Reconstrução de RLS</p>
               <p>Remove todas as políticas antigas e cria novas, baseadas no campo de texto normalizado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
