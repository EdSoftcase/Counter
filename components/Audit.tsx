
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabase';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Nota: Para joins funcionarem (routines(title)), as FKs devem estar configuradas no Supabase
      const { data, error } = await supabase
        .from('task_logs')
        .select('*, routines(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Erro na auditoria:", err);
      // Fallback sem join se falhar
      const { data } = await supabase.from('task_logs').select('*').order('created_at', { ascending: false });
      setLogs(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Log de Auditoria</h2>
          <p className="text-slate-500">Rastreabilidade imutável de todas as execuções.</p>
        </div>
        <button onClick={fetchLogs} className="text-xs font-bold text-emerald-600 hover:underline">Atualizar Logs</button>
      </header>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarefa</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Executado por</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidências</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{log.routines?.title || 'Tarefa Direta'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{log.id.substring(0,8)}</p>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">{log.executed_by || 'Ricardo Santos'}</td>
                  <td className="px-8 py-5">
                     <p className="text-xs font-bold text-slate-600">{new Date(log.created_at).toLocaleDateString()}</p>
                     <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <ImageIcon size={14} className="text-emerald-500" />
                      <MapPin size={14} className="text-blue-500" />
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={12} /> {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                    Aguardando sincronização de evidências...
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
