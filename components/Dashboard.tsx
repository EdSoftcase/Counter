
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertCircle, Clock, Sparkles, MapPin, Database, CheckCircle2 
} from 'lucide-react';
import { getOperationalInsights } from '../services/gemini';
import { supabase } from '../services/supabase';

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('Analisando tendências operacionais...');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ compliance: '0%', tasks: '0/0', alerts: '0', units: '0' });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { data: routines } = await supabase.from('routines').select('id');
        const { data: units } = await supabase.from('units').select('id');
        const { data: logs } = await supabase.from('task_logs').select('id');

        const totalRoutines = routines?.length || 0;
        const totalLogs = logs?.length || 0;
        const complianceRate = totalRoutines > 0 ? ((totalLogs / totalRoutines) * 100).toFixed(1) : 0;

        setStats({
          compliance: `${complianceRate}%`,
          tasks: `${totalLogs}/${totalRoutines}`,
          alerts: '0',
          units: String(units?.length || 1) // Fallback para 1 unidade
        });
        
        const insight = await getOperationalInsights({
          totalRoutines: totalRoutines,
          totalExecution: totalLogs,
          compliance: complianceRate
        });
        setAiInsight(insight || 'Dados sincronizados. IA pronta para análise.');
      } catch (e) {
        setAiInsight("Conectado ao Supabase. Aguardando execução de tarefas.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel Executivo</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Gestão de performance em tempo real.</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase border border-emerald-100">
              <Database size={10} /> Supabase Live
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Conformidade Real', value: stats.compliance, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Execuções Totais', value: stats.tasks, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Alertas', value: stats.alerts, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Unidades Ativas', value: stats.units, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl w-fit mb-4`}><stat.icon size={24} /></div>
            <h3 className="text-slate-400 font-bold text-[10px] uppercase">{stat.label}</h3>
            <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={20} className="text-emerald-400" />
          <h3 className="font-black text-sm uppercase tracking-widest">Consultoria IA Gemini</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed font-medium italic">"{aiInsight}"</p>
      </div>
    </div>
  );
};

export default Dashboard;
