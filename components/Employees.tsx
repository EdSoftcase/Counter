import React, { useEffect, useState } from 'react';
import { 
  UserPlus, Loader2, User as UserIcon, X, Save, 
  Shield, AlertCircle, Database, Calendar, DollarSign, Printer, FileText, Clock,
  CheckCircle2, Edit3, UserMinus, Trash2, Info, Utensils, Flame, UserCheck, Bike, Monitor, ShoppingBag, Mail, Lock, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { User, UserRole } from '../types';

const ROLES_LIST = [
  { id: 'Pizzaiolo', label: 'Pizzaiolo', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', defaultAccess: 'OPERATOR' },
  { id: 'Forneiro', label: 'Forneiro', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50', defaultAccess: 'OPERATOR' },
  { id: 'Gerente', label: 'Gerente', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', defaultAccess: 'SUPERVISOR' },
  { id: 'Garçom', label: 'Garçom', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-50', defaultAccess: 'OPERATOR' },
  { id: 'Caixa', label: 'Operadora de Caixa', icon: Monitor, color: 'text-emerald-600', bg: 'bg-emerald-50', defaultAccess: 'OPERATOR' },
  { id: 'Motoboy', label: 'Motoboy', icon: Bike, color: 'text-rose-500', bg: 'bg-rose-50', defaultAccess: 'OPERATOR' },
  { id: 'Auxiliar', label: 'Auxiliar/Limpeza', icon: ShoppingBag, color: 'text-slate-500', bg: 'bg-slate-50', defaultAccess: 'OPERATOR' },
];

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Pizzaiolo',
    access_level: 'OPERATOR',
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return alert('Preencha nome, e-mail e senha provisória.');
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_name: formData.role,
        access_level: formData.access_level,
        salary: formData.salary,
        hire_date: formData.hire_date,
        company_id: 'c1'
      };

      if (editingEmployeeId) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', editingEmployeeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingEmployeeId(null);
      await fetchEmployees();
      alert('Cadastro processado com sucesso! O funcionário já pode acessar o app.');
    } catch (err: any) {
      alert(`Erro no banco: ${err.message}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployeeId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email || '',
      password: emp.password || '',
      role: emp.role_name || 'Pizzaiolo',
      access_level: emp.access_level || 'OPERATOR',
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      salary: emp.salary || 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Enterprise</h2>
          <p className="text-slate-500 font-medium italic text-sm">Gerencie acessos e perfis de colaboradores.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEmployeeId(null);
            setFormData({ name: '', email: '', password: '', role: 'Pizzaiolo', access_level: 'OPERATOR', hire_date: new Date().toISOString().split('T')[0], salary: 0 });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          <UserPlus size={20} /> Nova Admissão
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp: any) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl transition-all border-b-8 border-b-slate-100 hover:border-b-emerald-400">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center font-black text-2xl uppercase shadow-2xl shrink-0">
                  {emp.name ? emp.name.substring(0, 2) : '??'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 text-xl leading-tight truncate">{emp.name}</h3>
                    <button onClick={() => handleOpenEdit(emp)} className="p-2 text-slate-300 hover:text-indigo-500"><Edit3 size={16}/></button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{emp.role_name}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">Login</span>
                  <span className="text-slate-800 truncate">{emp.email || '---'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 mb-8">Admissão de Funcionário</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail (Login)</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Provisória</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl uppercase shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                Salvar Funcionário
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;