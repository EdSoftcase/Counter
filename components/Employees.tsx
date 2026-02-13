import React, { useEffect, useState } from 'react';
import { UserPlus, MessageCircle, Loader2, User as UserIcon } from 'lucide-react';
import { supabase } from '../services/supabase';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) setEmployees(data);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Equipe</h2>
          <p className="text-slate-500">Gestão de acessos baseada no Supabase Auth.</p>
        </div>
        <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-600 transition-all">
          <UserPlus size={18} /> Novo Funcionário
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm group hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase">
                  {emp.name ? emp.name.substring(0, 2) : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{emp.name || 'Sem Nome'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{emp.role || 'Colaborador'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button className="text-emerald-600 font-bold text-sm hover:underline">Configurar Acesso</button>
                <MessageCircle size={18} className="text-slate-400 hover:text-emerald-500 cursor-pointer" />
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400">
              Nenhum funcionário cadastrado na tabela "profiles".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Employees;