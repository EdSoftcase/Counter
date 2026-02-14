
import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, MapPin, 
  Save, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Frequency, Routine } from '../types';

const RoutineManager: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routines').select('*').order('created_at', { ascending: false });
      if (!error && data) setRoutines(data);
    } catch (err) {
      console.error("Erro ao buscar rotinas:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formTitle) return alert('O título é obrigatório.');

    try {
      const { error } = await supabase.from('routines').insert([{
        title: formTitle,
        description: formDesc,
        frequency: Frequency.DAILY,
        deadline: '12:00',
        require_photo: true,
        require_geo: true
      }]);

      if (!error) {
        setIsModalOpen(false);
        setFormTitle('');
        setFormDesc('');
        fetchRoutines();
      } else {
        throw error;
      }
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Processos</h2>
          <p className="text-slate-500">Desenhe as rotinas da sua operação.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 transition-all"
        >
          <Plus size={20} /> Nova Rotina
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">{routine.title}</h3>
                    <p className="text-slate-500 text-sm mb-3 line-clamp-1 max-w-xl">{routine.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        <Calendar size={12} /> {routine.frequency}
                      </span>
                      {routine.require_geo && (
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold" title="Requer GPS">
                          <MapPin size={12} /> GPS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {routines.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
               Nenhuma rotina cadastrada ainda no Supabase.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Novo Processo</h3>
            <div className="space-y-6">
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Título da Rotina" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Instruções para o funcionário" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none min-h-[100px] focus:ring-2 focus:ring-emerald-500" />
              <button onClick={handleSave} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                <Save size={18} /> Salvar no Supabase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManager;
