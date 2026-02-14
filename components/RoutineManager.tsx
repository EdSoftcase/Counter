
import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, MapPin, 
  Save, CheckCircle2, Loader2, Edit3, Trash2, X, AlertCircle, Camera, Package, Users
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Frequency, Routine } from '../types';

const ROLES_OPTIONS = ['Pizzaiolo', 'Forneiro', 'Gerente', 'Garçom', 'Caixa', 'Motoboy', 'Auxiliar'];
const CATEGORIES_OPTIONS = [
  { id: 'PERECIVEIS', label: 'Perecíveis' },
  { id: 'BEBIDAS', label: 'Bebidas' },
  { id: 'EQUIPAMENTOS', label: 'Equipamentos' }
];

const RoutineManager: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: Frequency.DAILY,
    deadline: '12:00',
    require_photo: true,
    require_geo: true,
    is_stock_control: false,
    target_categories: [] as string[],
    target_roles: [] as string[],
    day_of_week: 1 // Padrão Segunda
  });

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

  const handleOpenModal = (routine?: Routine) => {
    if (routine) {
      setEditingId(routine.id);
      setFormData({
        title: routine.title,
        description: routine.description,
        frequency: routine.frequency,
        deadline: routine.deadline,
        require_photo: routine.require_photo,
        require_geo: routine.require_geo,
        is_stock_control: routine.is_stock_control || false,
        target_categories: routine.target_categories || [],
        target_roles: routine.target_roles || [],
        day_of_week: routine.day_of_week ?? 1
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        frequency: Frequency.DAILY,
        deadline: '12:00',
        require_photo: true,
        require_geo: true,
        is_stock_control: false,
        target_categories: [],
        target_roles: [],
        day_of_week: 1
      });
    }
    setIsModalOpen(true);
  };

  const toggleSelection = (field: 'target_categories' | 'target_roles', value: string) => {
    const current = [...formData[field]];
    const index = current.indexOf(value);
    if (index > -1) current.splice(index, 1);
    else current.push(value);
    setFormData({ ...formData, [field]: current });
  };

  const handleSave = async () => {
    if (!formData.title) return alert('O título é obrigatório.');
    setIsSaving(true);
    try {
      const payload = { ...formData, updated_at: new Date().toISOString() };
      let error;
      if (editingId) error = (await supabase.from('routines').update(payload).eq('id', editingId)).error;
      else error = (await supabase.from('routines').insert([payload])).error;

      if (!error) {
        setIsModalOpen(false);
        fetchRoutines();
      } else throw error;
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await supabase.from('routines').delete().eq('id', id);
      fetchRoutines();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Processos</h2>
          <p className="text-slate-500">Desenhe e gerencie as rotinas da sua operação.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
          <Plus size={20} /> Nova Rotina
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all border-b-4 border-b-slate-100 hover:border-b-emerald-400">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${routine.is_stock_control ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'}`}>
                    {routine.is_stock_control ? <Package size={32} /> : <CheckCircle2 size={32} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight">{routine.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-1">{routine.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{routine.frequency}</span>
                      {routine.frequency === Frequency.WEEKLY && <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Segunda-feira</span>}
                      {routine.target_roles?.map(r => <span key={r} className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{r}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleOpenModal(routine)} className="p-3 text-slate-400 hover:text-emerald-500 bg-slate-50 rounded-xl transition-all"><Edit3 size={20} /></button>
                  <button onClick={() => handleDelete(routine.id, routine.title)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-3xl font-black text-slate-800 mb-8">{editingId ? 'Editar Processo' : 'Novo Processo'}</h3>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-emerald-500" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequência</label>
                <div className="flex gap-3">
                  {Object.values(Frequency).map(f => (
                    <button key={f} onClick={() => setFormData({...formData, frequency: f})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.frequency === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{f}</button>
                  ))}
                </div>
              </div>

              {formData.frequency === Frequency.WEEKLY && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia da Semana</label>
                  <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atribuir a Cargos Específicos</label>
                   <Users size={16} className="text-slate-300" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES_OPTIONS.map(role => (
                    <button key={role} onClick={() => toggleSelection('target_roles', role)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 transition-all ${formData.target_roles.includes(role) ? 'bg-emerald-50 text-emerald-600 border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>{role}</button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Package size={20} className={formData.is_stock_control ? 'text-indigo-500' : 'text-slate-300'} />
                       <div>
                          <p className="text-sm font-black text-slate-800">Controle de Estoque Ativo</p>
                          <p className="text-[10px] text-slate-500">Exibir lista de produtos para conferência.</p>
                       </div>
                    </div>
                    <input type="checkbox" checked={formData.is_stock_control} onChange={e => setFormData({...formData, is_stock_control: e.target.checked})} className="w-6 h-6 accent-indigo-500" />
                 </div>

                 {formData.is_stock_control && (
                    <div className="space-y-3 animate-in fade-in">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias Vinculadas</p>
                       <div className="flex gap-2">
                         {CATEGORIES_OPTIONS.map(cat => (
                           <button key={cat.id} onClick={() => toggleSelection('target_categories', cat.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.target_categories.includes(cat.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>{cat.label}</button>
                         ))}
                       </div>
                    </div>
                 )}
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2.5rem] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManager;
