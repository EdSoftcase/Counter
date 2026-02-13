import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_logs')
        .select('*, routines(title), profiles(name)')
        .order('created_at', { ascending: false });
      
      if (!error && data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Log de Auditoria</h2>
        <p className="text-slate-500">Histórico real sincronizado com o Supabase.</p>
      </header>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase">Tarefa</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase">Executado por</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase">Data/Hora</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{log.routines?.title || 'Tarefa Removida'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{log.profiles?.name || 'Sistema'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={12} /> Concluído
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">
                    Nenhum registro de auditoria encontrado no banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Audit;