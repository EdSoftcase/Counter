
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Calendar, Users, Plus, Loader2, 
  AlertTriangle, CheckCircle2, Clock, DollarSign, Hammer, Trash2, X, Save
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { ComplianceService, VacationRecord } from '../types';

const Compliance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'vacations'>('services');
  const [services, setServices] = useState<ComplianceService[]>([]);
  const [vacations, setVacations] = useState<VacationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    last_performed: new Date().toISOString().split('T')[0],
    validity_months: 12,
    cost: 0
  });

  const [vacationForm, setVacationForm] = useState({
    user_id: '',
    user_name: '',
    hire_date: new Date().toISOString().split('T')[0],
    planned_date: new Date().toISOString().split('T')[0],
    cost_estimated: 0
  });

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [activeTab]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('profiles').select('id, name');
    setEmployees(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const { data } = await supabase.from('compliance_services').select('*').order('name');
        setServices(data || []);
      } else {
        const { data } = await supabase.from('employee_vacations').select('*').order('planned_date');
        setVacations(data || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSaveService = async () => {
    setIsSaving(true);
    try {
      await supabase.from('compliance_services').insert([serviceForm]);
      await supabase.from('financial_transactions').insert([{
        type: 'EXPENSE',
        category: 'SERVICE',
        description: `Serviço: ${serviceForm.name}`,
        amount: serviceForm.cost,
        due_date: serviceForm.last_performed,
        status: 'PAID'
      }]);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleSaveVacation = async () => {
    if (!vacationForm.user_id || vacationForm.cost_estimated <= 0) return alert("Preencha todos os campos.");
    setIsSaving(true);
    try {
      const selectedEmp = employees.find(e => e.id === vacationForm.user_id);
      const finalForm = { ...vacationForm, user_name: selectedEmp?.name || 'Funcionário' };
      
      await supabase.from('employee_vacations').insert([finalForm]);
      
      // Lança no financeiro como provisão pendente
      await supabase.from('financial_transactions').insert([{
        type: 'EXPENSE',
        category: 'LABOR',
        description: `Provisão de Férias: ${finalForm.user_name}`,
        amount: vacationForm.cost_estimated,
        due_date: vacationForm.planned_date,
        status: 'PENDING'
      }]);

      setIsModalOpen(false);
      fetchData();
      alert("Férias registradas e provisionadas no financeiro!");
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const getStatus = (lastDate: string, months: number) => {
    const last = new Date(lastDate);
    const next = new Date(last.setMonth(last.getMonth() + months));
    const now = new Date();
    const diff = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'Vencido', color: 'text-rose-600 bg-rose-50', icon: AlertTriangle };
    if (diff < 30) return { label: 'Vencendo', color: 'text-amber-600 bg-amber-50', icon: Clock };
    return { label: 'Em Dia', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Conformidade & RH</h2>
          <p className="text-slate-500 font-medium">Controle de prazos e ciclos de equipe.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border">
           <button onClick={() => setActiveTab('services')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'services' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Serviços</button>
           <button onClick={() => setActiveTab('vacations')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'vacations' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Férias</button>
        </div>
      </header>

      {loading ? <Loader2 className="animate-spin mx-auto mt-20" /> : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
              <Plus size={20} /> Novo {activeTab === 'services' ? 'Serviço' : 'Alerta Férias'}
            </button>
          </div>

          {activeTab === 'services' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map(s => {
                const st = getStatus(s.last_performed, s.validity_months);
                return (
                  <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${st.color}`}>{st.label}</span>
                    <h3 className="font-black text-xl mt-4">{s.name}</h3>
                    <p className="text-xs text-slate-400 mt-2">Validade: {s.validity_months} meses</p>
                    <p className="text-xs font-bold text-indigo-600 mt-1">Custo: R$ {s.cost.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                   <tr>
                     <th className="px-8 py-4">Nome</th>
                     <th className="px-8 py-4">Admissão</th>
                     <th className="px-8 py-4">Saída Programada</th>
                     <th className="px-8 py-4">Custo Férias</th>
                     <th className="px-8 py-4">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {vacations.map(v => (
                     <tr key={v.id}>
                       <td className="px-8 py-4 font-bold">{v.user_name}</td>
                       <td className="px-8 py-4">{new Date(v.hire_date).toLocaleDateString()}</td>
                       <td className="px-8 py-4 font-black text-indigo-600">{new Date(v.planned_date).toLocaleDateString()}</td>
                       <td className="px-8 py-4 font-bold">R$ {v.cost_estimated.toFixed(2)}</td>
                       <td className="px-8 py-4">
                         <span className="text-[9px] font-black px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">PROVISIONADO</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black">Adicionar {activeTab === 'services' ? 'Serviço' : 'Férias'}</h3>
               <button onClick={() => setIsModalOpen(false)}><X/></button>
             </div>
             
             <div className="space-y-6">
                {activeTab === 'services' ? (
                  <>
                    <input type="text" placeholder="Nome do Serviço" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={serviceForm.last_performed} onChange={e => setServiceForm({...serviceForm, last_performed: e.target.value})} className="p-4 bg-slate-50 border rounded-2xl" />
                      <input type="number" placeholder="Meses Validade" value={serviceForm.validity_months} onChange={e => setServiceForm({...serviceForm, validity_months: Number(e.target.value)})} className="p-4 bg-slate-50 border rounded-2xl" />
                    </div>
                    <input type="number" placeholder="Custo R$" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm, cost: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                    <button onClick={handleSaveService} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black">Salvar e Lançar Financeiro</button>
                  </>
                ) : (
                  <>
                    <select value={vacationForm.user_id} onChange={e => setVacationForm({...vacationForm, user_id: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl">
                      <option value="">Selecione o Funcionário</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400">Admissão</label>
                        <input type="date" value={vacationForm.hire_date} onChange={e => setVacationForm({...vacationForm, hire_date: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400">Saída Programada</label>
                        <input type="date" value={vacationForm.planned_date} onChange={e => setVacationForm({...vacationForm, planned_date: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                      </div>
                    </div>
                    <input type="number" placeholder="Custo Estimado R$" value={vacationForm.cost_estimated} onChange={e => setVacationForm({...vacationForm, cost_estimated: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                    <button onClick={handleSaveVacation} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Registrar Alerta e Provisionar</button>
                  </>
                )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Compliance;
