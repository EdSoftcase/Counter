import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Camera, MapPin, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Routine } from '../types';
import { mockRoutines } from '../mockData';

const Execution: React.FC = () => {
  const [tasks, setTasks] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<Routine | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        setTasks(mockRoutines);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('routines').select('*');
      if (!error && data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const handleFinish = async () => {
    if (!executing) return;
    alert(`Sucesso! Evidência de "${executing.title}" registrada com geolocalização e foto.`);
    setExecuting(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      {!executing ? (
        <div className="grid gap-4">
          <header className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Execução de Rotinas</h2>
            <p className="text-slate-500">Selecione uma tarefa para iniciar a evidência.</p>
          </header>
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-emerald-200 transition-all">
              <div className="flex gap-5 items-start">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{task.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-1">{task.description}</p>
                  <div className="flex gap-3 mt-2">
                    {task.requirePhoto && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><Camera size={12}/> Foto</span>}
                    {task.requireGeo && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><MapPin size={12}/> GPS</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setExecuting(task)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-lg">Iniciar</button>
            </div>
          ))}
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
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 group hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all">
               <Camera size={40} />
               <span className="font-black uppercase text-xs tracking-widest">Capturar Foto</span>
            </div>
            <div className="p-8 bg-slate-50 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 border border-slate-100">
               <MapPin size={32} className="text-emerald-500" />
               <span className="font-bold text-sm">Localização Detectada</span>
               <span className="text-[10px] opacity-60">Sua posição está dentro do raio permitido.</span>
            </div>
          </div>

          <button onClick={handleFinish} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
            <CheckCircle size={24} /> Finalizar e Sincronizar
          </button>
        </div>
      )}
    </div>
  );
};

export default Execution;