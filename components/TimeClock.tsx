
import React, { useState, useEffect } from 'react';
import { 
  Clock, Edit3, Loader2, CheckCircle2, AlertCircle, Fingerprint, DatabaseZap, UserPlus, AlertTriangle, Moon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const TimeClock: React.FC = () => {
  const [activeView, setActiveView] = useState<'punch' | 'history' | 'admin'>('punch');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [validUserId, setValidUserId] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [lastPunch, setLastPunch] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (isSupabaseConfigured) {
      initializeApp();
    }
    return () => clearInterval(timer);
  }, []);

  const initializeApp = async () => {
    setIsCheckingUser(true);
    await fetchValidUser();
    await fetchLogs();
    setIsCheckingUser(false);
  };

  const fetchValidUser = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id').limit(1).single();
      if (data) setValidUserId(data.id);
    } catch (err) {
      console.error("Erro ao validar usuário:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        if (error.message.includes('API key')) setErrorStatus('invalid_key');
        throw error;
      }
      
      setLogs(data || []);
      
      // Define o último tipo de ponto para controlar os botões
      if (data && data.length > 0) {
        // Pegamos apenas o último do dia atual (ou o último absoluto para simplificar a trava)
        setLastPunch(data[0].type);
      } else {
        setLastPunch(null);
      }
    } catch (err: any) {
      console.error("Erro ao buscar logs de ponto:", err);
    } finally {
      setLoading(false);
    }
  };

  const validatePunchIntelligence = (type: string): boolean => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeVal = hour + minutes / 60;

    // Lógica para Pizzaria (17h às 00h)
    
    // 1. Alerta de Saída Premocce (Perto da abertura)
    if ((type === 'SAIDA' || type === 'SAIDA_INTERVALO') && (timeVal >= 16 && timeVal <= 18.5)) {
      return confirm(`⚠️ AVISO OPERACIONAL:\n\nSão ${currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. A pizzaria acabou de abrir ou está em preparação.\n\nTem certeza que deseja registrar uma SAÍDA agora?`);
    }

    // 2. Alerta de Entrada Tardia (Perto do fechamento)
    if ((type === 'ENTRADA' || type === 'RETORNO_INTERVALO') && (timeVal >= 23 || timeVal <= 2)) {
      return confirm(`⚠️ AVISO OPERACIONAL:\n\nSão ${currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Estamos próximos ao fechamento (00h).\n\nTem certeza que deseja registrar uma ENTRADA a esta hora?`);
    }

    return true;
  };

  const handlePunch = async (type: string) => {
    if (!isSupabaseConfigured) return;
    if (!validUserId) {
      alert("Erro: Perfil não encontrado. Cadastre-se na aba Equipe.");
      return;
    }

    // Inteligência de Horário
    if (!validatePunchIntelligence(type)) return;

    setLoading(true);
    const punchData = {
      user_id: validUserId, 
      timestamp: new Date().toISOString(),
      type: type,
      status: 'ORIGINAL',
      hash: Math.random().toString(36).substring(2, 15)
    };

    try {
      const { error } = await supabase.from('time_logs').insert([punchData]);
      if (error) throw error;
      
      alert(`Ponto de ${type.replace('_', ' ')} registrado!`);
      await fetchLogs();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Desativação de Botões (Máquina de Estados)
  const isButtonDisabled = (type: string): boolean => {
    if (loading || isCheckingUser || !validUserId) return true;

    switch (type) {
      case 'ENTRADA':
        // Desativa se o último ponto foi entrada ou retorno (já está trabalhando)
        return lastPunch === 'ENTRADA' || lastPunch === 'RETORNO_INTERVALO' || lastPunch === 'SAIDA_INTERVALO';
      case 'SAIDA_INTERVALO':
        // Só permite se o último foi entrada
        return lastPunch !== 'ENTRADA';
      case 'RETORNO_INTERVALO':
        // Só permite se o último foi saída intervalo
        return lastPunch !== 'SAIDA_INTERVALO';
      case 'SAIDA':
        // Só permite se estiver trabalhando (entrada ou retorno)
        return lastPunch !== 'ENTRADA' && lastPunch !== 'RETORNO_INTERVALO';
      default:
        return false;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDENTE': 'bg-amber-100 text-amber-700',
      'APROVADO': 'bg-emerald-100 text-emerald-700',
      'NEGADO': 'bg-rose-100 text-rose-700',
      'ORIGINAL': 'bg-slate-100 text-slate-500'
    };
    return <span className={`${styles[status] || styles.ORIGINAL} px-2 py-1 rounded-md text-[10px] font-bold`}>{status}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm">
          {[
            { id: 'punch', label: 'Registrar' },
            { id: 'history', label: 'Espelho' },
            { id: 'admin', label: 'Gestão' }
          ].map(view => (
            <button 
              key={view.id}
              onClick={() => setActiveView(view.id as any)} 
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === view.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {view.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pizzaria Aberta</p>
            <p className="text-xl font-black text-slate-800 tracking-tighter">{currentTime.toLocaleTimeString()}</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Moon size={20} />
          </div>
        </div>
      </header>

      {activeView === 'punch' && (
        <div className="space-y-6">
          {!validUserId && !isCheckingUser && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4 text-amber-800 animate-in fade-in">
              <AlertCircle className="shrink-0" size={24} />
              <div className="flex-1">
                <p className="font-bold text-sm">Nenhum funcionário encontrado!</p>
                <p className="text-xs opacity-80">Cadastre um perfil na aba de Equipe para habilitar o ponto.</p>
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <Fingerprint size={200} />
            </div>
            
            <div className="relative z-10">
              <div className="mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">
                  <AlertTriangle size={12} className="text-amber-400" /> Inteligência Operacional Ativa
                </span>
                <h2 className="text-7xl font-black tracking-tighter">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </h2>
                <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-[0.3em]">Horário de Brasília</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {[
                  { type: 'ENTRADA', label: 'Entrada', color: 'bg-emerald-500 hover:bg-emerald-400' },
                  { type: 'SAIDA_INTERVALO', label: 'Saída Intervalo', color: 'bg-amber-500 hover:bg-amber-400' },
                  { type: 'RETORNO_INTERVALO', label: 'Retorno Intervalo', color: 'bg-blue-500 hover:bg-blue-400' },
                  { type: 'SAIDA', label: 'Saída Turno', color: 'bg-rose-500 hover:bg-rose-400' }
                ].map((btn) => {
                  const disabled = isButtonDisabled(btn.type);
                  return (
                    <button 
                      key={btn.type}
                      onClick={() => handlePunch(btn.type)}
                      disabled={disabled}
                      className={`${disabled ? 'bg-slate-700 opacity-40 grayscale cursor-not-allowed' : btn.color} p-8 rounded-[2.5rem] shadow-xl transition-all active:scale-95 flex flex-col items-center gap-4 group border border-white/10`}
                    >
                      {loading && btn.type === lastPunch ? (
                        <Loader2 className="animate-spin" size={32} />
                      ) : (
                        <div className={`p-3 rounded-2xl ${disabled ? 'bg-slate-800 text-slate-500' : 'bg-white/20 text-white'} transition-transform group-hover:scale-110`}>
                          <Clock size={28} />
                        </div>
                      )}
                      <span className="text-[11px] font-black uppercase tracking-widest">{btn.label}</span>
                      {lastPunch === btn.type && !disabled && (
                        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-[8px] font-black px-2 py-1 rounded-full shadow-lg border border-slate-200">ÚLTIMO</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {isCheckingUser && (
                <p className="mt-8 text-slate-400 text-xs animate-pulse">Sincronizando estado do ponto...</p>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-center gap-4 text-indigo-700">
             <AlertTriangle size={20} className="shrink-0" />
             <p className="text-[11px] font-bold leading-relaxed uppercase tracking-tight">
               <span className="font-black">REGRAS DA PIZZARIA:</span> Abertura às 17:00 | Fechamento às 00:00. 
               O sistema monitora registros fora de conformidade com o turno noturno.
             </p>
          </div>
        </div>
      )}

      {activeView !== 'punch' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Data/Hora</th>
                    <th className="px-8 py-4">Evento</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.filter(l => activeView === 'admin' ? l.status === 'PENDENTE' : true).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-bold text-slate-700">{new Date(log.timestamp).toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600">{log.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-8 py-5">{getStatusBadge(log.status)}</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-400 hover:text-emerald-500 transition-colors"><Edit3 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">Nenhum registro encontrado no banco.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeClock;
