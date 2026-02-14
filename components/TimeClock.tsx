
import React, { useState, useEffect } from 'react';
import { 
  Clock, Edit3, Loader2, CheckCircle2, AlertCircle, Fingerprint, DatabaseZap, UserPlus
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (isSupabaseConfigured) {
      initializeApp();
    }
    return () => clearInterval(timer);
  }, []);

  const initializeApp = async () => {
    setIsCheckingUser(true);
    await Promise.all([
      fetchValidUser(),
      fetchLogs()
    ]);
    setIsCheckingUser(false);
  };

  const fetchValidUser = async () => {
    try {
      // Tenta buscar o primeiro usuário na tabela profiles para garantir uma FK válida
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      
      if (data) {
        setValidUserId(data.id);
      } else {
        console.warn("Nenhum perfil encontrado na tabela 'profiles'. O registro de ponto falhará sem um usuário válido.");
      }
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
        if (error.message.includes('API key')) {
          setErrorStatus('invalid_key');
        }
        throw error;
      }
      setLogs(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar logs de ponto:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async (type: string) => {
    if (!isSupabaseConfigured) {
      alert("Configuração do Supabase não encontrada.");
      return;
    }

    if (!validUserId) {
      alert("Erro: Nenhum funcionário encontrado no banco. Vá em 'Equipe' e crie um perfil primeiro para vincular o ponto.");
      return;
    }

    if (loading) return;
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
      
      if (error) {
        if (error.message.includes('foreign key')) {
          alert("Erro de Banco: O usuário vinculado não existe mais. Recarregue a página.");
        } else {
          alert(`Erro ao registrar: ${error.message}`);
        }
        throw error;
      }
      
      alert(`Ponto de ${type.replace('_', ' ')} registrado com sucesso!`);
      await fetchLogs();
    } catch (err: any) {
      console.error("Erro ao registrar ponto:", err);
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 'invalid_key') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-[3rem] border-2 border-dashed border-amber-200 text-center space-y-4">
        <div className="p-4 bg-amber-50 text-amber-500 rounded-full">
          <DatabaseZap size={48} />
        </div>
        <h3 className="text-xl font-black text-slate-800">Erro de Autenticação</h3>
        <p className="text-slate-500 max-w-md">A chave de API do Supabase é inválida.</p>
        <button onClick={fetchLogs} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest">Tentar Novamente</button>
      </div>
    );
  }

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
        <div className="text-right hidden sm:block">
          <p className="text-3xl font-black text-slate-800 tracking-tighter">{currentTime.toLocaleTimeString()}</p>
        </div>
      </header>

      {activeView === 'punch' && (
        <div className="space-y-6">
          {!validUserId && !isCheckingUser && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4 text-amber-800 animate-in fade-in">
              <AlertCircle className="shrink-0" size={24} />
              <div className="flex-1">
                <p className="font-bold text-sm">Nenhum funcionário encontrado!</p>
                <p className="text-xs opacity-80">Para registrar ponto, você precisa primeiro cadastrar um perfil na aba de Equipe/Funcionários.</p>
              </div>
              <button className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                 <UserPlus size={14} /> Criar Agora
              </button>
            </div>
          )}

          <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <Fingerprint size={200} />
            </div>
            <div className="relative z-10">
              <h2 className="text-6xl font-black mb-12 tracking-tighter">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { type: 'ENTRADA', color: 'bg-emerald-500 hover:bg-emerald-400' },
                  { type: 'SAIDA_INTERVALO', color: 'bg-amber-500 hover:bg-amber-400' },
                  { type: 'RETORNO_INTERVALO', color: 'bg-blue-500 hover:bg-blue-400' },
                  { type: 'SAIDA', color: 'bg-rose-500 hover:bg-rose-400' }
                ].map((btn) => (
                  <button 
                    key={btn.type}
                    onClick={() => handlePunch(btn.type)}
                    disabled={loading || isCheckingUser || !validUserId}
                    className={`${btn.color} p-6 rounded-[2rem] shadow-xl transition-all active:scale-95 flex flex-col items-center gap-3 disabled:opacity-30 disabled:grayscale group border border-white/10`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Clock size={24} className="group-hover:rotate-12 transition-transform" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{btn.type.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
              {isCheckingUser && (
                <p className="mt-8 text-slate-400 text-xs animate-pulse">Validando autenticação com Supabase...</p>
              )}
            </div>
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
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600">{log.type}</span>
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
