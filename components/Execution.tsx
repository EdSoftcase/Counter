
import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Camera, MapPin, CheckCircle, Database, Package, ChevronRight, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Routine, StockItem } from '../types';
import { mockRoutines } from '../mockData';

const Execution: React.FC = () => {
  const [tasks, setTasks] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<Routine | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Para tarefas de estoque
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  
  // Mock do cargo do usuário logado (Em um app real, viria do contexto/auth)
  const [userRole] = useState('Gerente'); 

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routines').select('*');
      if (error) throw error;
      
      // Filtragem por Cargo e Dia da Semana (Simplificada)
      const today = new Date().getDay();
      const filtered = (data || []).filter(r => {
        const matchesRole = !r.target_roles || r.target_roles.length === 0 || r.target_roles.includes(userRole);
        const matchesDay = r.frequency !== 'SEMANAL' || r.day_of_week === today;
        return matchesRole && matchesDay;
      });

      setTasks(filtered);
    } catch (err) {
      setTasks(mockRoutines);
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (task: Routine) => {
    setExecuting(task);
    if (task.is_stock_control && task.target_categories) {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .in('category', task.target_categories);
      setInventoryItems(data || []);
      
      const initialCounts: Record<string, number> = {};
      (data || []).forEach(item => { initialCounts[item.id] = item.current_stock; });
      setStockCounts(initialCounts);
    }
  };

  const handleFinish = async () => {
    if (!executing) return;
    setIsSyncing(true);

    try {
      // 1. Salva log da tarefa
      const logEntry = {
        routine_id: executing.id,
        executed_by: 'Usuário Enterprise',
        status: 'CONCLUIDO',
        evidence_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400',
        location: { lat: -23.5505, lng: -46.6333 }
      };
      await supabase.from('task_logs').insert([logEntry]);

      // 2. Se for estoque, atualiza o inventário
      if (executing.is_stock_control) {
        for (const [id, qty] of Object.entries(stockCounts)) {
          await supabase.from('inventory_items').update({ current_stock: qty }).eq('id', id);
        }
      }
      
      alert(`Tarefa "${executing.title}" concluída com sucesso!`);
      setExecuting(null);
      fetchTasks();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      {!executing ? (
        <div className="space-y-6">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Minhas Atividades</h2>
            <p className="text-slate-500 font-medium">Tarefas disponíveis para seu cargo de <span className="text-indigo-600 font-black">{userRole}</span>.</p>
          </header>

          {tasks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-black">Nenhuma tarefa pendente para agora.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-emerald-300 transition-all border-b-8 border-b-slate-100">
                <div className="flex gap-6 items-start">
                  <div className={`p-5 rounded-2xl ${task.is_stock_control ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'} transition-all`}>
                    {task.is_stock_control ? <Package size={32} /> : <Clock size={32} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight">{task.title}</h3>
                    <p className="text-slate-500 text-sm mb-4">{task.description}</p>
                    <div className="flex gap-2">
                       {task.is_stock_control && <span className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Estoque</span>}
                       <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{task.deadline}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => startTask(task)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95">Iniciar</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl animate-in slide-in-from-bottom-8 border border-slate-100">
          <button onClick={() => setExecuting(null)} className="mb-10 text-slate-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-slate-600 transition-colors">&larr; Cancelar Execução</button>
          
          <div className="mb-12 border-b-2 border-slate-50 pb-8">
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-3">{executing.title}</h2>
            <p className="text-slate-500 font-medium text-lg">{executing.description}</p>
          </div>

          {executing.is_stock_control ? (
            <div className="space-y-8 mb-12">
               <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em] mb-4">
                  <Package size={20} /> Levantamento de Insumos
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {inventoryItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all">
                       <div>
                          <p className="font-black text-slate-800 text-lg">{item.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.unit} | Sugestão: {item.ideal_quantity}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            value={stockCounts[item.id] ?? 0}
                            onChange={e => setStockCounts({...stockCounts, [item.id]: Number(e.target.value)})}
                            className="w-24 p-4 bg-white border border-slate-200 rounded-2xl text-center font-black text-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 group hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all bg-slate-50/50">
                <Camera size={64} />
                <span className="font-black uppercase text-xs tracking-widest">Anexar Evidência</span>
              </div>
              <div className="p-16 bg-slate-50 rounded-[3rem] flex flex-col items-center justify-center gap-3 text-slate-500 border border-slate-100">
                <MapPin size={40} className="text-emerald-500" />
                <span className="font-black uppercase text-xs tracking-widest text-center">Localização Validada</span>
                <span className="text-[10px] opacity-60 font-bold uppercase">Sede Centro Enterprise</span>
              </div>
            </div>
          )}

          <button 
            disabled={isSyncing}
            onClick={handleFinish} 
            className="w-full py-8 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={28} /> : <CheckCircle size={28} />}
            Finalizar e Registrar
          </button>
        </div>
      )}
    </div>
  );
};

export default Execution;
