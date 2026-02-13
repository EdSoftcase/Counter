
import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, Clock, History, Edit3, CheckCircle2, XCircle, 
  AlertCircle, Save, Calendar, Loader2, ArrowRight
} from 'lucide-react';
import { TimeLog, AdjustmentStatus } from '../types';
import { supabase } from '../services/supabase';

const TimeClock: React.FC = () => {
  const [activeView, setActiveView] = useState<'punch' | 'history' | 'admin'>('punch');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para Modal de Ajuste
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  const [adjustmentTime, setAdjustmentTime] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchLogs();
    return () => clearInterval(timer);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (!error && data) setLogs(data);
    } catch (err) {
      console.error("Erro ao buscar logs:", err);
    }
    setLoading(false);
  };

  const handlePunch = async (type: TimeLog['type']) => {
    setLoading(true);
    const newLog = {
      user_id: 'u1', // Mock user
      user_name: 'Ricardo Santos',
      timestamp: new Date().toISOString(),
      type: type,
      status: 'ORIGINAL',
      hash: Math.random().toString(36).substring(7)
    };

    const { error } = await supabase.from('time_logs').insert([newLog]);
    
    if (!error) {
      alert(`Ponto de ${type} registrado com sucesso!`);
      fetchLogs();
    } else {
      alert("Erro ao registrar ponto no Supabase.");
    }
    setLoading(false);
  };

  const openAdjustModal = (log: TimeLog) => {
    setSelectedLog(log);
    const date = new Date(log.timestamp);
    setAdjustmentTime(date.toTimeString().slice(0, 5));
    setAdjustmentReason('');
    setIsAdjustModalOpen(true);
  };

  const submitAdjustment = async () => {
    if (!adjustmentReason || !adjustmentTime || !selectedLog) {
      return alert("Preencha o novo horário e a justificativa.");
    }

    // Cria o novo timestamp baseado na data original mas com hora nova
    const originalDate = new Date(selectedLog.timestamp);
    const [hours, minutes] = adjustmentTime.split(':');
    originalDate.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase
      .from('time_logs')
      .update({ 
        status: 'PENDENTE', 
        requested_timestamp: originalDate.toISOString(),
        reason: adjustmentReason 
      })
      .eq('id', selectedLog.id);

    if (!error) {
      alert("Solicitação de ajuste enviada para análise do administrador.");
      setIsAdjustModalOpen(false);
      fetchLogs();
    }
  };

  const handleReview = async (logId: string, approved: boolean) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const updates = approved 
      ? { status: 'APROVADO', timestamp: log.requestedTimestamp } 
      : { status: 'NEGADO' };

    const { error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', logId);

    if (!error) {
      alert(approved ? "Ajuste aprovado com sucesso!" : "Ajuste negado.");
      fetchLogs();
    }
  };

  const getStatusBadge = (status: AdjustmentStatus) => {
    switch (status) {
      case 'PENDENTE': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10}/> PENDENTE</span>;
      case 'APROVADO': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={10}/> AJUSTADO</span>;
      case 'NEGADO': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><XCircle size={10}/> NEGADO</span>;
      default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">ORIGINAL</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveView('punch')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'punch' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Fingerprint size={16} /> Registrar
          </button>
          <button 
            onClick={() => setActiveView('history')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={16} /> Espelho
          </button>
          <button 
            onClick={() => setActiveView('admin')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Edit3 size={16} /> Gestão
          </button>
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-3xl font-black text-slate-800 tracking-tighter">{currentTime.toLocaleTimeString()}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
      </header>

      {activeView === 'punch' && (
        <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Fingerprint size={200} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-6xl font-black mb-12 tracking-tighter">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { type: 'ENTRADA', label: 'Entrada', color: 'bg-emerald-500 hover:bg-emerald-400' },
                { type: 'SAIDA_INTERVALO', label: 'Intervalo', color: 'bg-blue-500 hover:bg-blue-400' },
                { type: 'RETORNO_INTERVALO', label: 'Retorno', color: 'bg-indigo-500 hover:bg-indigo-400' },
                { type: 'SAIDA', label: 'Saída', color: 'bg-rose-500 hover:bg-rose-400' },
              ].map((btn) => (
                <button 
                  key={btn.type}
                  onClick={() => handlePunch(btn.type as any)}
                  disabled={loading}
                  className={`${btn.color} p-6 rounded-[2rem] shadow-xl transition-all active:scale-95 flex flex-col items-center gap-3 group`}
                >
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    <Clock size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{btn.label}</span>
                </button>
              ))}
            </div>
            
            <p className="mt-12 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              Sincronizado com nuvem corporativa • Portaria 671
            </p>
          </div>
        </div>
      )}

      {(activeView === 'history' || activeView === 'admin') && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-black text-slate-800 text-xl tracking-tight">
               {activeView === 'history' ? 'Meu Espelho de Ponto' : 'Solicitações de Ajuste'}
             </h3>
             <button onClick={fetchLogs} className="text-slate-400 hover:text-emerald-500 transition-colors">
               <Loader2 className={loading ? 'animate-spin' : ''} size={20} />
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4">Evento</th>
                  <th className="px-8 py-4">Horário</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs
                  .filter(l => activeView === 'admin' ? l.status === 'PENDENTE' : true)
                  .map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-lg ${log.status === 'APROVADO' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.status === 'PENDENTE' && (
                          <div className="flex items-center gap-1 text-amber-500">
                             <ArrowRight size={14} />
                             <span className="font-black text-sm italic">
                               {new Date(log.requestedTimestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {activeView === 'history' ? (
                        <button 
                          disabled={log.status === 'PENDENTE' || log.status === 'APROVADO'}
                          onClick={() => openAdjustModal(log)}
                          className="p-2 text-slate-300 hover:text-emerald-500 transition-colors disabled:opacity-30"
                          title="Solicitar Ajuste"
                        >
                          <Edit3 size={18} />
                        </button>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleReview(log.id, true)}
                            className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleReview(log.id, false)}
                            className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"
                          >
                            Negar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      Nenhum registro encontrado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Ajuste */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdjustModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95">
             <header className="mb-8">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Solicitar Ajuste</h3>
               <p className="text-slate-500 text-sm mt-2">A alteração passará por aprovação do RH.</p>
             </header>

             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário Correto</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="time" 
                      value={adjustmentTime}
                      onChange={(e) => setAdjustmentTime(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo do Ajuste</label>
                  <textarea 
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ex: Esquecimento, Falha no aparelho, Erro de digitação..."
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px] text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAdjustModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={submitAdjustment}
                    className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Enviar
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeClock;
