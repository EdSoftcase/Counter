
import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Camera, MapPin, CheckCircle, Database } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Routine } from '../types';
import { mockRoutines } from '../mockData';

const Execution: React.FC = () => {
  const [tasks, setTasks] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<Routine | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setTasks(mockRoutines);
        return;
      }
      const { data, error } = await supabase.from('routines').select('*');
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
      setTasks(mockRoutines); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!executing) return;
    setIsSyncing(true);

    try {
      const logEntry = {
        routine_id: executing.id,
        executed_by: 'Ricardo Santos',
        status: 'CONCLUIDO',
        evidence_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400',
        location: { lat: -23.5505, lng: -46.6333 }
      };

      const { error } = await supabase.from('task_logs').insert([logEntry]);
      
      if (error) throw error;

      alert(`Sucesso! Evidência da tarefa "${executing.title}" sincronizada.`);
      setExecuting(null);
      fetchTasks();
    } catch (err: any) {
      console.error("Erro ao sincronizar:", err);
      alert(`Erro ao salvar: ${err.message}. Verifique a tabela task_logs.`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      {!executing ? (
        <div className="grid gap-4">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Execução Operacional</h2>
              <p className="text-slate-500">Registre evidências das rotinas ativas.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
               <Database size={12} /> Sincronizado
            </div>
          </header>
          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold mb-4">Nenhuma tarefa para hoje.</p>
              <p className="text-slate-400 text-sm">Use "Modelos de Nicho" para adicionar rotinas padrão.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-emerald-200 transition-all">
                <div className="flex gap-5 items-start">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">{task.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-1">{task.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><Camera size={12}/> Foto Requerida</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><MapPin size={12}/> Validação GPS</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setExecuting(task)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-lg">Iniciar</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 border border-slate-100">
          <button onClick={() => setExecuting(null)} className="mb-8 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2">&larr; Voltar para Lista</button>
          
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-500 w-2 h-8 rounded-full"></span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{executing.title}</h2>
            </div>
            <p className="text-slate-500 font-medium text-lg ml-5">{executing.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 group hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all bg-slate-50/50">
               <Camera size={48} />
               <span className="font-black uppercase text-xs tracking-widest">Abrir Câmera</span>
            </div>
            <div className="p-12 bg-slate-50 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 border border-slate-100">
               <MapPin size={32} className="text-emerald-500" />
               <span className="font-bold text-sm">Localização OK</span>
               <span className="text-[10px] opacity-60">Dentro do perímetro da unidade.</span>
            </div>
          </div>

          <button 
            disabled={isSyncing}
            onClick={handleFinish} 
            className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />}
            {isSyncing ? "Sincronizando com Supabase..." : "Finalizar e Registrar"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Execution;
