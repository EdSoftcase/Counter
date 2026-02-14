
import React, { useEffect, useState } from 'react';
import { 
  UserPlus, MessageCircle, Loader2, User as UserIcon, X, Save, 
  Shield, AlertCircle, Database, Calendar, DollarSign, Printer, FileText, Clock,
  CheckCircle2, Edit3, UserMinus, Trash2, Info, Utensils, Flame, UserCheck, Bike, Monitor, ShoppingBag
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { User, TimeLog } from '../types';

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
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeLogs, setEmployeeLogs] = useState<TimeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Pizzaiolo',
    access_level: 'OPERATOR',
    hire_date: new Date().toISOString().split('T')[0],
    salary: 0
  });

  const [dismissData, setDismissData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0]
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

  const fetchEmployeeLogs = async (userId: string) => {
    setLoadingLogs(true);
    try {
      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
      setEmployeeLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenProfile = (emp: User) => {
    setSelectedEmployee(emp);
    fetchEmployeeLogs(emp.id);
  };

  const handleOpenEdit = (emp: User) => {
    setEditingEmployeeId(emp.id);
    setFormData({
      name: emp.name,
      role: (emp.role as string) || 'Pizzaiolo',
      access_level: (emp.access_level as string) || 'OPERATOR',
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      salary: emp.salary || 0
    });
    setIsModalOpen(true);
  };

  const handleRoleSelect = (roleId: string) => {
    const roleConfig = ROLES_LIST.find(r => r.id === roleId);
    setFormData({
      ...formData,
      role: roleId,
      access_level: roleConfig?.defaultAccess || 'OPERATOR'
    });
  };

  const handleOpenDismiss = (emp: User) => {
    setSelectedEmployee(emp);
    setDismissData({ amount: 0, date: new Date().toISOString().split('T')[0] });
    setIsDismissModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!formData.name || formData.salary <= 0) return alert('Por favor, insira o nome e o salário.');
    
    setIsSaving(true);
    try {
      if (editingEmployeeId) {
        const { error: profileError } = await supabase.from('profiles').update({ 
          name: formData.name, 
          role: formData.role, 
          access_level: formData.access_level,
          salary: formData.salary,
          hire_date: formData.hire_date
        }).eq('id', editingEmployeeId);

        if (profileError) throw profileError;

        const vacationCost = formData.salary * 1.3333;
        await supabase.from('employee_vacations').update({
          cost_estimated: vacationCost
        }).eq('user_id', editingEmployeeId);

      } else {
        const { data: profileData, error: profileError } = await supabase.from('profiles').insert([
          { 
            name: formData.name, 
            role: formData.role, 
            access_level: formData.access_level,
            salary: formData.salary,
            hire_date: formData.hire_date
          }
        ]).select();

        if (profileError) throw profileError;
        const newUserId = profileData[0].id;

        const hireDate = new Date(formData.hire_date);
        const vacationDate = new Date(hireDate);
        vacationDate.setFullYear(vacationDate.getFullYear() + 1);
        const vacationCost = formData.salary * 1.3333;

        await supabase.from('employee_vacations').insert([{
          user_id: newUserId,
          user_name: formData.name,
          hire_date: formData.hire_date,
          planned_date: vacationDate.toISOString().split('T')[0],
          cost_estimated: vacationCost
        }]);

        await supabase.from('financial_transactions').insert([{
          type: 'EXPENSE',
          category: 'LABOR',
          description: `PROVISÃO CLT: Férias de ${formData.name}`,
          amount: vacationCost,
          due_date: vacationDate.toISOString().split('T')[0],
          status: 'PENDING'
        }]);
      }

      setIsModalOpen(false);
      setEditingEmployeeId(null);
      await fetchEmployees();
      alert(editingEmployeeId ? 'Dados atualizados!' : 'Admissão concluída!');
    } catch (err: any) {
      setErrorMessage(`Erro ao processar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDismissal = async () => {
    if (!selectedEmployee) return;
    if (!confirm(`Confirmar desligamento de ${selectedEmployee.name}?`)) return;
    setIsSaving(true);
    try {
      await supabase.from('financial_transactions').insert([{
        type: 'EXPENSE', category: 'LABOR',
        description: `DEMISSÃO/RECISÃO: ${selectedEmployee.name}`,
        amount: dismissData.amount, due_date: dismissData.date, status: 'PAID'
      }]);
      await supabase.from('profiles').delete().eq('id', selectedEmployee.id);
      setIsDismissModalOpen(false);
      setSelectedEmployee(null);
      await fetchEmployees();
      alert('Desligamento concluído e rescisão lançada.');
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const getRoleIcon = (roleName: string) => {
    const role = ROLES_LIST.find(r => r.id === roleName);
    const Icon = role?.icon || UserIcon;
    return <Icon size={18} className={role?.color || 'text-slate-400'} />;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Enterprise</h2>
          <p className="text-slate-500">Gestão de funções operacionais da pizzaria.</p>
        </div>
        <button 
          onClick={() => {
            setErrorMessage(null); setEditingEmployeeId(null);
            setFormData({ name: '', role: 'Pizzaiolo', access_level: 'OPERATOR', hire_date: new Date().toISOString().split('T')[0], salary: 0 });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          <UserPlus size={20} /> Nova Admissão
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 print:hidden"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl transition-all border-b-8 border-b-slate-100 hover:border-b-emerald-400 relative">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center font-black text-2xl uppercase shadow-2xl shrink-0">
                  {emp.name ? emp.name.substring(0, 2) : '??'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 text-xl leading-tight truncate pr-2">{emp.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(emp)} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 rounded-lg"><Edit3 size={16}/></button>
                      <button onClick={() => handleOpenDismiss(emp)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-lg"><UserMinus size={16}/></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(emp.role as string)}
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{emp.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">Salário</span>
                  <span className="text-slate-800">R$ {emp.salary?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">Acesso App</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${emp.access_level === 'SUPERVISOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {emp.access_level}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleOpenProfile(emp)}
                className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                Perfil & Espelho de Ponto
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Demissão */}
      {isDismissModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4 text-rose-500">
                   <UserMinus size={32} />
                   <h3 className="text-3xl font-black tracking-tight">Desligamento</h3>
                 </div>
                 <button onClick={() => setIsDismissModalOpen(false)} className="text-slate-400 p-2"><X size={28}/></button>
              </div>

              <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 mb-8">
                 <p className="text-sm font-bold text-rose-800">Você está desligando <span className="font-black">{selectedEmployee.name}</span>. Esta ação excluirá o perfil e lançará a rescisão no financeiro.</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor da Rescisão (Pago)</label>
                   <div className="relative">
                     <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input type="number" value={dismissData.amount} onChange={e => setDismissData({...dismissData, amount: Number(e.target.value)})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl" placeholder="Total Pago R$" />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data do Desligamento</label>
                   <input type="date" value={dismissData.date} onChange={e => setDismissData({...dismissData, date: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                 </div>
                 <button 
                  onClick={handleConfirmDismissal} 
                  disabled={isSaving}
                  className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                   {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Trash2 size={24} />}
                   Confirmar Demissão
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Perfil e Espelho de Ponto */}
      {selectedEmployee && !isDismissModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0 print:relative print:z-0">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md print:hidden" onClick={() => setSelectedEmployee(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
               <div className="flex items-center gap-4">
                 <FileText className="text-emerald-500" size={32} />
                 <h3 className="text-2xl font-black tracking-tight">Espelho de Ponto</h3>
               </div>
               <div className="flex gap-4">
                 <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Printer size={18} /> Imprimir A4
                 </button>
                 <button onClick={() => setSelectedEmployee(null)} className="p-3 bg-white border rounded-2xl text-slate-400 hover:text-slate-600">
                   <X size={24} />
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar print:p-0 print:overflow-visible">
               <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Counter Enterprise</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Documento de Registro de Jornada</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-lg uppercase">{selectedEmployee.name}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedEmployee.role}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cargo</p>
                    <p className="font-black text-slate-700">{selectedEmployee.role}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Salário</p>
                    <p className="font-black text-slate-700">R$ {selectedEmployee.salary?.toFixed(2)}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Admissão</p>
                    <p className="font-black text-slate-700">{selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Unidade</p>
                    <p className="font-black text-slate-700">Sede Enterprise</p>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                      <Clock size={18} className="text-emerald-500" /> Histórico de Registros
                    </h4>
                  </div>
                  
                  <div className="border border-slate-200 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Horário</th>
                          <th className="px-6 py-4">Evento</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingLogs ? (
                          <tr><td colSpan={4} className="p-10 text-center animate-pulse font-bold text-slate-400">Carregando histórico...</td></tr>
                        ) : employeeLogs.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold uppercase text-[10px]">Nenhum registro encontrado.</td></tr>
                        ) : employeeLogs.map(log => (
                          <tr key={log.id} className="text-sm">
                            <td className="px-6 py-4 font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black text-slate-900">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{log.type.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-tighter"><CheckCircle2 size={10}/> {log.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               <div className="mt-20 flex flex-col items-center justify-center gap-16 print:mt-12">
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-64 h-px bg-slate-900"></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assinatura do Colaborador</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-64 h-px bg-slate-900"></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assinatura do Empregador</p>
                  </div>
               </div>

               <footer className="mt-12 text-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                 Documento gerado pelo sistema Counter Enterprise em {new Date().toLocaleString()}
               </footer>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição com Seleção de Função */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><X size={28} /></button>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                {editingEmployeeId ? <Edit3 size={32}/> : <UserPlus size={32} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingEmployeeId ? 'Editar Colaborador' : 'Admissão Enterprise'}</h3>
                <p className="text-slate-500 text-sm font-medium italic">Configure a função e o acesso ao sistema.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-emerald-500" autoFocus />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Selecione a Função</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ROLES_LIST.map((role) => {
                    const RoleIcon = role.icon;
                    const isActive = formData.role === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleSelect(role.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${isActive ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                      >
                        <RoleIcon size={24} className={isActive ? role.color : 'text-slate-300'} />
                        <span className={`text-[9px] font-black uppercase text-center ${isActive ? 'text-emerald-700' : ''}`}>{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Salário Base (R$)</label>
                  <input type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nível de Acesso</label>
                  <select 
                    value={formData.access_level} 
                    onChange={(e) => setFormData({...formData, access_level: e.target.value})}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none"
                  >
                    <option value="OPERATOR">Operacional</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data de Admissão</label>
                <input type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                {editingEmployeeId ? 'Atualizar Cadastro' : 'Confirmar Admissão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
