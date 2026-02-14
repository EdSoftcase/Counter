
import React, { useState, useEffect } from 'react';
import { 
  Clock, Loader2, Camera, MapPin, CheckCircle, CheckCircle2, Database, Package, 
  ChevronRight, Save, Lock, User, Bell, AlertTriangle, CalendarCheck, Eye
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Routine, StockItem } from '../types';
import { mockRoutines } from '../mockData';

const Execution: React.FC = () => {
  const [tasks, setTasks] = useState<Routine[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para execução ou visualização
  const [selectedTask, setSelectedTask] = useState<Routine | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // Se existir log, é modo leitura
  
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Para tarefas de estoque
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  
  // Mock do cargo do usuário logado e horário
  const [userRole] = useState('Gerente'); 
  const [currentTime, setCurrentTime] = useState(new Date());

  // Verifica se já passou das 16:30 para disparar alertas visuais
  const isLateShift = currentTime.getHours() > 16 || (currentTime.getHours() === 16 && currentTime.getMinutes() >= 30);

  useEffect(() => {
    fetchData();
    // Atualiza relógio para checar alertas
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayEnd = new Date();
      todayEnd.setHours(23,59,59,999);

      // 1. Busca Rotinas
      const { data: routinesData, error: rError } = await supabase.from('routines').select('*');
      if (rError) throw rError;

      // 2. Busca Logs de Hoje (Para saber o que já foi feito)
      const { data: logsData, error: lError } = await supabase
        .from('task_logs')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (lError) throw lError;
      
      setDailyLogs(logsData || []);

      // Filtragem por Cargo e Dia da Semana
      const today = new Date().getDay();
      const filtered = (routinesData || []).filter(r => {
        const matchesRole = !r.target_roles || r.target_roles.length === 0 || r.target_roles.includes(userRole);
        const matchesDay = r.frequency !== 'SEMANAL' || r.day_of_week === today;
        return matchesRole && matchesDay;
      });

      setTasks(filtered);
    } catch (err) {
      console.error(err);
      setTasks(mockRoutines); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTask = async (task: Routine, existingLog: any = null) => {
    setSelectedTask(task);
    setSelectedLog(existingLog); // Se passar log, entra em modo somente leitura

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
    if (!selectedTask) return;
    setIsSyncing(true);

    try {
      // 1. Salva log da tarefa
      const logEntry = {
        routine_id: selectedTask.id,
        executed_by: 'Usuário Enterprise', // Em prod pegaria do AuthContext
        status: 'CONCLUIDO',
        evidence_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400',
        location: { lat: -23.5505, lng: -46.6333 },
        created_at: new Date().toISOString()
      };
      
      await supabase.from('task_logs').insert([logEntry]);

      // 2. Se for estoque, atualiza o inventário
      if (selectedTask.is_stock_control) {
        for (const [id, qty] of Object.entries(stockCounts)) {
          await supabase.from('inventory_items').update({ current_stock: qty }).eq('id', id);
        }
      }
      
      alert(`Tarefa "${selectedTask.title}" concluída com sucesso!`);
      setSelectedTask(null);
      setSelectedLog(null);
      fetchData(); // Recarrega para bloquear a tarefa
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      {!selectedTask ? (
        <div className="space-y-6">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Minhas Atividades</h2>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-500 font-medium">Logado como <span className="text-indigo-600 font-black">{userRole}</span>.</p>
              {isLateShift && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                  <Bell size={12} /> Alertas de atraso ativos (16:30)
                </span>
              )}
            </div>
          </header>

          {tasks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-black">Nenhuma tarefa pendente para agora.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const existingLog = dailyLogs.find(l => l.routine_id === task.id);
                const isCompleted = !!existingLog;
                const isLate = !isCompleted && isLateShift;

                return (
                  <div 
                    key={task.id} 
                    className={`
                      border rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all border-b-[6px]
                      ${isCompleted 
                        ? 'bg-emerald-50/50 border-emerald-200 border-b-emerald-400' 
                        : isLate 
                          ? 'bg-white border-amber-200 border-b-amber-400 shadow-amber-100' 
                          : 'bg-white border-slate-200 border-b-slate-200 hover:border-emerald-300'}
                    `}
                  >
                    <div className="flex gap-6 items-start">
                      <div className={`p-5 rounded-2xl transition-all shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : isLate ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isCompleted ? <CheckCircle size={32} /> : task.is_stock_control ? <Package size={32} /> : <Clock size={32} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-black text-xl tracking-tight ${isCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>{task.title}</h3>
                          {isCompleted && <Lock size={14} className="text-emerald-600" />}
                        </div>
                        <p className="text-slate-500 text-sm mb-4">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                           {isCompleted ? (
                             <span className="text-[9px] font-black bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                               <User size={10} /> Realizado por: {existingLog.executed_by}
                             </span>
                           ) : (
                             <>
                               {isLate && (
                                 <span className="text-[9px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                   <Bell size={10} /> Lembrete Enviado
                                 </span>
                               )}
                               <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">
                                 Prazo: {task.deadline}
                               </span>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenTask(task, existingLog)} 
                      className={`
                        px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2
                        ${isCompleted 
                          ? 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50' 
                          : 'bg-slate-900 text-white hover:bg-emerald-500'}
                      `}
                    >
                      {isCompleted ? <><Eye size={16}/> Visualizar</> : 'Iniciar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl animate-in slide-in-from-bottom-8 border border-slate-100 relative overflow-hidden">
          {selectedLog && (
            <div className="absolute top-0 right-0 left-0 bg-emerald-500 p-4 text-center text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Lock size={14} /> Tarefa Finalizada - Modo Leitura
            </div>
          )}
          
          <button onClick={() => { setSelectedTask(null); setSelectedLog(null); }} className="mb-10 mt-6 text-slate-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-slate-600 transition-colors">
            &larr; Voltar para Lista
          </button>
          
          <div className="mb-12 border-b-2 border-slate-50 pb-8">
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-3">{selectedTask.title}</h2>
            <p className="text-slate-500 font-medium text-lg">{selectedTask.description}</p>
            {selectedLog && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 inline-block">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Executado em</p>
                <p className="text-emerald-900 font-bold">{new Date(selectedLog.created_at).toLocaleString()}</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">Responsável</p>
                <p className="text-emerald-900 font-bold">{selectedLog.executed_by}</p>
              </div>
            )}
          </div>

          {selectedTask.is_stock_control ? (
            <div className="space-y-8 mb-12">
               <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em] mb-4">
                  <Package size={20} /> Levantamento de Insumos {selectedLog && '(Registrado)'}
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {inventoryItems.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${selectedLog ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-slate-50 border-slate-100 group hover:bg-white hover:border-indigo-200'}`}>
                       <div>
                          <p className="font-black text-slate-800 text-lg">{item.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.unit} | Sugestão: {item.ideal_quantity}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            disabled={!!selectedLog}
                            value={stockCounts[item.id] ?? 0}
                            onChange={e => setStockCounts({...stockCounts, [item.id]: Number(e.target.value)})}
                            className="w-24 p-4 bg-white border border-slate-200 rounded-2xl text-center font-black text-xl outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className={`p-16 border-2 border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 transition-all bg-slate-50/50 ${selectedLog ? 'opacity-100 bg-emerald-50/30 border-emerald-100' : 'border-dashed hover:border-emerald-500 hover:text-emerald-500 cursor-pointer'}`}>
                {selectedLog ? <CheckCircle2 size={64} className="text-emerald-500" /> : <Camera size={64} />}
                <span className="font-black uppercase text-xs tracking-widest">
                  {selectedLog ? 'Evidência Salva' : 'Anexar Evidência'}
                </span>
              </div>
              <div className="p-16 bg-slate-50 rounded-[3rem] flex flex-col items-center justify-center gap-3 text-slate-500 border border-slate-100">
                <MapPin size={40} className="text-emerald-500" />
                <span className="font-black uppercase text-xs tracking-widest text-center">Localização Validada</span>
                <span className="text-[10px] opacity-60 font-bold uppercase">Sede Centro Enterprise</span>
              </div>
            </div>
          )}

          {!selectedLog && (
            <button 
              disabled={isSyncing}
              onClick={handleFinish} 
              className="w-full py-8 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={28} /> : <CheckCircle size={28} />}
              Finalizar e Registrar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Execution;
