
import React, { useEffect, useState } from 'react';
import { UserPlus, MessageCircle, Loader2, User as UserIcon, X, Save, Shield } from 'lucide-react';
import { supabase } from '../services/supabase';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'Operador',
    access_level: 'OPERATOR'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) setEmployees(data);
    } catch (err) {
      console.error("Erro ao buscar colaboradores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Por favor, insira o nome do funcionário.');
    
    setIsSaving(true);
    try {
      // Gerando ID no frontend para evitar erro de not-null constraint
      const newId = crypto.randomUUID();
      
      const { error } = await supabase.from('profiles').insert([
        { 
          id: newId,
          name: formData.name, 
          role: formData.role
        }
      ]);

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ name: '', role: 'Operador', access_level: 'OPERATOR' });
      await fetchEmployees();
      alert('Funcionário cadastrado com sucesso!');
    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);
      alert(`Erro ao cadastrar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe & Colaboradores</h2>
          <p className="text-slate-500">Gerencie os acessos e perfis da sua operação.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          <UserPlus size={20} /> Novo Funcionário
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm group hover:shadow-md transition-all border-b-4 border-b-slate-100 hover:border-b-emerald-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-inner">
                  {emp.name ? emp.name.substring(0, 2) : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">{emp.name || 'Sem Nome'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{emp.role || 'Colaborador'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">Configurar Acesso</button>
                <div className="flex gap-2">
                   <MessageCircle size={18} className="text-slate-300 hover:text-emerald-500 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400">
              <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhum funcionário cadastrado.</p>
              <p className="text-sm">Clique em "Novo Funcionário" para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <UserPlus size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Adicionar Membro</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: João Silva" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="Ex: Gerente de Cozinha" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <div className="grid grid-cols-2 gap-3">
                  {['OPERATOR', 'SUPERVISOR'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({...formData, access_level: level})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                        formData.access_level === level 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Shield size={14} /> {level === 'OPERATOR' ? 'Operacional' : 'Supervisor'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Salvando...' : 'Cadastrar Funcionário'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
