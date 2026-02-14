
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, Clock, Sparkles, MapPin, Database, CheckCircle2, 
  DollarSign, Users, Package, ArrowUpRight, ArrowDownRight, Coffee, Star, Loader2
} from 'lucide-react';
import { getOperationalInsights } from '../services/gemini';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

export interface DashboardProps {
  userRole: UserRole;
  userName?: string;
}

export default function Dashboard({ userRole, userName = "Colaborador" }: DashboardProps) {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [stats, setStats] = useState({
    compliance: '0%',
    tasksDone: 0,
    tasksTotal: 0,
    activeEmployees: 0,
    criticalStock: 0,
    revenue: 0,
    expenses: 0,
    balance: 0,
    payroll: 0
  });

  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR;

  useEffect(() => {
    loadDashboardData();
  }, [userRole]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { data: routines },
        { data: logs },
        { data: employees },
        { data: stock },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('routines').select('id'),
        supabase.from('task_logs').select('id'),
        supabase.from('profiles').select('salary'),
        supabase.from('inventory_items').select('id, current_stock, ideal_quantity'),
        isAdmin ? supabase.from('financial_transactions').select('*') : Promise.resolve({ data: [] })
      ]);

      let revenue = 0;
      let expenses = 0;
      if (isAdmin && transactions) {
        revenue = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
        expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
      }

      const totalTasks = routines?.length || 0;
      const doneTasks = logs?.length || 0;
      const payrollTotal = employees?.reduce((acc, e) => acc + (e.salary || 0), 0) || 0;
      const stockAlerts = stock?.filter(i => i.current_stock < i.ideal_quantity).length || 0;
      const complianceVal = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

      setStats({
        compliance: `${complianceVal.toFixed(1)}%`,
        tasksDone: doneTasks,
        tasksTotal: totalTasks,
        activeEmployees: employees?.length || 0,
        criticalStock: stockAlerts,
        revenue,
        expenses,
        balance: revenue - expenses,
        payroll: payrollTotal
      });

      setLoading(false);

      if (isAdmin) {
        fetchAiInsight(complianceVal, stockAlerts, revenue - expenses);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
      setLoading(false);
    }
  };

  const fetchAiInsight = async (compliance: number, stockCritical: number, balance: number) => {
    setInsightLoading(true);
    try {
      const insight = await getOperationalInsights({
        compliance,
        stockCritical,
        balance
      });
      setAiInsight(insight || 'Sua operação está estável. IA pronta para análise.');
    } catch (err) {
      setAiInsight('Não foi possível gerar insights no momento.');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <div className="text-center">
        <p className="font-black text-slate-800 uppercase tracking-widest text-xs">Sincronizando Unidade</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Carregando dados operacionais...</p>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-500">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <Star size={24} fill="currentColor" />
             </div>
             <h2 className="text-4xl font-black text-slate-800 tracking-tight">Olá, {userName}!</h2>
          </div>
          <p className="text-slate-500 font-medium text-lg">Bom turno de trabalho na pizzaria. Aqui está seu resumo de hoje:</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-emerald-400 transition-all">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-6 group-hover:scale-110 transition-transform">
                 <CheckCircle2 size={40} />
              </div>
              <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Minhas Tarefas</h3>
              <p className="text-5xl font-black text-slate-800">{stats.tasksDone} / {stats.tasksTotal}</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Finalizadas hoje</p>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-indigo-400 transition-all">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] mb-6 group-hover:scale-110 transition-transform">
                 <Clock size={40} />
              </div>
              <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Status do Ponto</h3>
              <p className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Em Turno</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Registrado hoje</p>
           </div>

           <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Coffee size={80} className="text-white" />
              </div>
              <div className="p-5 bg-white/10 text-white rounded-[2rem] mb-6">
                 <MapPin size={40} />
              </div>
              <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Unidade Ativa</h3>
              <p className="text-3xl font-black text-white leading-tight">Sede Centro Enterprise</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Painel Executivo</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 font-medium">Gestão de performance e saúde financeira da unidade.</p>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
              <Database size={10} /> Live Data
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <TrendingUp size={80} />
          </div>
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Faturamento Bruto</h3>
          <p className="text-3xl font-black text-slate-800">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black mt-2 uppercase">
            <ArrowUpRight size={12}/> Vendas Liquidadas
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 text-rose-500/10 group-hover:text-rose-500/20 transition-colors">
            <TrendingDown size={80} />
          </div>
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Despesas Reais</h3>
          <p className="text-3xl font-black text-slate-800">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-rose-600 text-[10px] font-black mt-2 uppercase">
            <ArrowDownRight size={12}/> Saídas de Caixa
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DollarSign size={80} />
          </div>
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Saldo Líquido</h3>
          <p className="text-3xl font-black">R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black mt-2 uppercase tracking-widest">
            Resultado do Período
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Users size={80} />
          </div>
          <h3 className="opacity-60 font-black text-[10px] uppercase tracking-widest mb-1">Custo de Equipe</h3>
          <p className="text-3xl font-black">R$ {stats.payroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-indigo-200 text-[10px] font-black mt-2 uppercase tracking-widest">
            {stats.activeEmployees} Colaboradores
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[320px]">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sparkles size={24} className={insightLoading ? 'animate-pulse' : ''} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-800">IA Consultoria Operacional</h3>
            </div>
            
            {insightLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
              </div>
            ) : (
              <p className="text-slate-600 text-xl font-medium leading-relaxed italic animate-in fade-in duration-700">
                "{aiInsight || 'Análise em processamento...'}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
