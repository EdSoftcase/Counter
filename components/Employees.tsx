
import React, { useEffect, useState } from 'react';
import { 
  UserPlus, Loader2, User as UserIcon, X, Save, 
  Shield, AlertCircle, Database, Calendar, DollarSign, Printer, FileText, Clock,
  CheckCircle2, Edit3, Trash2, Mail, Lock, Eye, EyeOff, LayoutGrid, MapPin, 
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { User, UserRole, AppModule } from '../types';

const ROLES_LIST = [
  { id: 'Pizzaiolo', label: 'Pizzaiolo', defaultAccess: 'OPERATOR' },
  { id: 'Forneiro', label: 'Forneiro', defaultAccess: 'OPERATOR' },
  { id: 'Gerente', label: 'Gerente', defaultAccess: 'SUPERVISOR' },
  { id: 'Garçom', label: 'Garçom', defaultAccess: 'OPERATOR' },
  { id: 'Caixa', label: 'Operadora de Caixa', defaultAccess: 'OPERATOR' },
  { id: 'Motoboy', label: 'Motoboy', defaultAccess: 'OPERATOR' },
  { id: 'Auxiliar', label: 'Auxiliar/Limpeza', defaultAccess: 'OPERATOR' },
];

const MODULES: { id: AppModule; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'timeclock', label: 'Ponto Eletrônico' },
  { id: 'execution', label: 'Execução de Tarefas' },
  { id: 'inventory', label: 'Controle de Estoque' },
  { id: 'finance', label: 'Gestão Financeira' },
  { id: 'compliance', label: 'RH & Conformidade' },
  { id: 'routines', label: 'Gestão de Rotinas' },
];

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmpForReport, setSelectedEmpForReport] = useState<any>(null);
  const [empLogs, setEmpLogs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_name: 'Pizzaiolo',
    access_level: 'OPERATOR',
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0,
    permitted_modules: ['timeclock', 'execution'] as string[]
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

  const handleOpenReport = async (emp: any) => {
    setSelectedEmpForReport(emp);
    setLoading(true);
    try {
      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', emp.id)
        .order('timestamp', { ascending: false });
      setEmpLogs(data || []);
      setIsReportOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return alert('Preencha os campos obrigatórios.');
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_name: formData.role_name,
        access_level: formData.access_level,
        salary: formData.salary,
        hire_date: formData.hire_date,
        permitted_modules: formData.permitted_modules,
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
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
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
      role_name: emp.role_name || 'Pizzaiolo',
      access_level: emp.access_level || 'OPERATOR',
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      salary: emp.salary || 0,
      permitted_modules: emp.permitted_modules || ['timeclock', 'execution']
    });
    setIsModalOpen(true);
  };

  const toggleModule = (moduleId: string) => {
    const current = [...formData.permitted_modules];
    const index = current.indexOf(moduleId);
    if (index > -1) current.splice(index, 1);
    else current.push(moduleId);
    setFormData({ ...formData, permitted_modules: current });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Equipe Enterprise</h2>
          <p className="text-slate-500 font-medium italic">Gestão de talentos, salários e espelho de ponto.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEmployeeId(null);
            setFormData({ name: '', email: '', password: '', role_name: 'Pizzaiolo', access_level: 'OPERATOR', hire_date: new Date().toISOString().split('T')[0], salary: 0, permitted_modules: ['timeclock', 'execution'] });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          <UserPlus size={20} /> Nova Admissão
        </button>
      </header>

      {loading && !isReportOpen ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp: any) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl transition-all border-b-8 border-b-slate-100 hover:border-b-emerald-400 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center font-black text-2xl uppercase shadow-2xl shrink-0">
                    {emp.name ? emp.name.substring(0, 2) : '??'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-800 text-xl leading-tight truncate">{emp.name}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEdit(emp)} className="p-2 text-slate-300 hover:text-indigo-500"><Edit3 size={18}/></button>
                        <button onClick={async () => { if(confirm('Remover?')) { await supabase.from('profiles').delete().eq('id', emp.id); fetchEmployees(); } }} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{emp.role_name}</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Salário</span>
                    <span className="text-slate-800">R$ {emp.salary?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Admissão</span>
                    <span className="text-slate-800">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : '---'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {emp.permitted_modules?.map((m: string) => (
                      <span key={m} className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded uppercase">{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleOpenReport(emp)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group"
              >
                <Printer size={16} className="group-hover:scale-110 transition-transform" />
                Espelho de Ponto
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X size={32} /></button>
            
            <h3 className="text-3xl font-black text-slate-800 mb-10 flex items-center gap-4">
              <UserIcon className="text-emerald-500" size={32} />
              {editingEmployeeId ? 'Perfil do Colaborador' : 'Nova Admissão'}
            </h3>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nome Completo</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Senha Provisória</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Salário Base (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Data Admissão</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cargo Operacional</label>
                    <select value={formData.role_name} onChange={e => setFormData({...formData, role_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black">
                      {ROLES_LIST.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nível de Acesso</label>
                    <select value={formData.access_level} onChange={e => setFormData({...formData, access_level: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black">
                      <option value="OPERATOR">Operacional</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="text-indigo-600" size={24} />
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Atividades Autorizadas</h4>
                </div>
                
                <div className="space-y-3">
                  {MODULES.map(module => (
                    <label key={module.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.permitted_modules.includes(module.id) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}>
                          {formData.permitted_modules.includes(module.id) ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-tight transition-colors ${formData.permitted_modules.includes(module.id) ? 'text-slate-800' : 'text-slate-400'}`}>{module.label}</span>
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.permitted_modules.includes(module.id)} onChange={() => toggleModule(module.id)} />
                    </label>
                  ))}
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  {editingEmployeeId ? 'Salvar Perfil' : 'Contratar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Espelho de Ponto (Imprimível) */}
      {isReportOpen && selectedEmpForReport && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col p-0 lg:p-8 animate-in fade-in">
          <header className="no-print bg-slate-900 text-white p-6 flex justify-between items-center lg:rounded-[2.5rem] shadow-2xl mb-8">
            <button onClick={() => setIsReportOpen(false)} className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"><ArrowLeft size={20}/> Voltar</button>
            <div className="text-center">
              <h4 className="font-black text-xl leading-none">{selectedEmpForReport.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Espelho de Ponto Eletrônico</p>
            </div>
            <button onClick={() => window.print()} className="bg-emerald-500 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer size={18}/> Imprimir / PDF</button>
          </header>

          <div className="max-w-4xl mx-auto w-full bg-white p-12 border-2 border-slate-100 rounded-[3rem] shadow-sm print:border-none print:shadow-none print:p-0">
            <div className="flex justify-between items-start mb-12 border-b-2 border-slate-50 pb-8">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">COUNTER ENTERPRISE</h2>
                <p className="text-slate-500 font-bold text-sm">Relatório de Frequência Individual</p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-black text-slate-800 text-sm uppercase">Período: {new Date().toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</p>
                <p className="text-xs text-slate-400">Gerado em: {new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-50 p-8 rounded-[2rem]">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</p>
                 <p className="font-black text-slate-800 text-lg uppercase">{selectedEmpForReport.name}</p>
                 <p className="text-xs text-slate-600 font-medium">{selectedEmpForReport.email}</p>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Função</p>
                 <p className="font-black text-slate-800 text-lg uppercase">{selectedEmpForReport.role_name}</p>
                 <p className="text-xs text-slate-600 font-medium">Admissão: {new Date(selectedEmpForReport.hire_date).toLocaleDateString()}</p>
               </div>
            </div>

            <table className="w-full text-left mb-12">
               <thead>
                 <tr className="border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400">
                   <th className="py-4 px-2">Data</th>
                   <th className="py-4 px-2">Tipo de Batida</th>
                   <th className="py-4 px-2">Horário</th>
                   <th className="py-4 px-2">Assinatura Digital (Hash)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {empLogs.map(log => (
                   <tr key={log.id} className="text-sm">
                     <td className="py-4 px-2 font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</td>
                     <td className="py-4 px-2">
                       <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-500">{log.type.replace('_', ' ')}</span>
                     </td>
                     <td className="py-4 px-2 font-black text-slate-800">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                     <td className="py-4 px-2 font-mono text-[9px] text-slate-400">{log.hash}</td>
                   </tr>
                 ))}
                 {empLogs.length === 0 && (
                   <tr><td colSpan={4} className="py-20 text-center font-black text-slate-300 uppercase">Nenhum registro encontrado para este período.</td></tr>
                 )}
               </tbody>
            </table>

            <div className="mt-24 grid grid-cols-2 gap-20">
               <div className="border-t-2 border-slate-900 pt-4 text-center">
                 <p className="text-xs font-black uppercase tracking-widest">Assinatura do Colaborador</p>
                 <p className="text-[10px] text-slate-400 mt-1">Concordo com os horários acima descritos</p>
               </div>
               <div className="border-t-2 border-slate-900 pt-4 text-center">
                 <p className="text-xs font-black uppercase tracking-widest">Gestor Responsável</p>
                 <p className="text-[10px] text-slate-400 mt-1">Assinatura e Carimbo da Unidade</p>
               </div>
            </div>
            
            <footer className="mt-20 pt-8 border-t border-slate-100 text-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">
              Relatório Gerado por Counter Enterprise - Compliance Operacional v7
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
