
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FileDown, FileSpreadsheet, Calendar, Search } from 'lucide-react';

const productivityData = [
  { hour: '08:00', total: 12 },
  { hour: '10:00', total: 45 },
  { hour: '12:00', total: 32 },
  { hour: '14:00', total: 67 },
  { hour: '16:00', total: 89 },
  { hour: '18:00', total: 41 },
];

const Reports: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Relatórios e Exportação</h2>
          <p className="text-slate-500">Extraia dados brutos e insights para tomada de decisão.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white border border-slate-200 px-6 py-2.5 rounded-2xl text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <FileDown size={18} className="text-red-500" /> Gerar PDF
          </button>
          <button className="flex-1 sm:flex-none bg-white border border-slate-200 px-6 py-2.5 rounded-2xl text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <FileSpreadsheet size={18} className="text-emerald-500" /> Excel (.xlsx)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-4">
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Filtro de Período</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs uppercase">Últimos 7 dias</button>
                  <button className="w-full text-left px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase">Últimos 30 dias</button>
                  <button className="w-full text-left px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase">Personalizado</button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Unidades</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500" defaultChecked /> SP Matriz
                  </label>
                  <label className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500" defaultChecked /> RJ Barra
                  </label>
                </div>
              </div>
           </div>
        </aside>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[450px] flex flex-col">
            <h3 className="font-black text-slate-800 mb-10 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" /> Picos de Execução Operacional
            </h3>
            <div className="flex-1 w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <BarChart data={productivityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} barSize={48} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Total de Evidências</p>
              <p className="text-5xl font-black text-white tracking-tighter">1.248</p>
              <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 12.4GB em storage S3 Seguro
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Média de Conformidade</p>
              <p className="text-5xl font-black text-slate-800 tracking-tighter">94.2%</p>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
