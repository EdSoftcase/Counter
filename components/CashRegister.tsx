
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, ArrowRight, DollarSign,
  History, CheckCircle2, Lock, Banknote, Coins, Loader2,
  ArrowUpCircle, ArrowDownCircle, Camera, EyeOff, Wifi, WifiOff, CloudSync, RefreshCw,
  User, Store, Bike, ShoppingCart, TrendingUp, AlertTriangle, CreditCard, QrCode, Landmark, HelpCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { PaymentMethod, UserRole } from '../types';

interface CashRegisterProps {
  userRole?: UserRole;
  userId?: string;
  userName?: string;
}

const CashRegister: React.FC<CashRegisterProps> = ({ userRole, userId, userName }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [step, setStep] = useState<'OPEN' | 'ACTIVE' | 'CLOSING' | 'HISTORY'>('OPEN');
  const [loading, setLoading] = useState(false);
  const [userAlreadyClosed, setUserAlreadyClosed] = useState(false);

  const [openingBalance, setOpeningBalance] = useState(0); 
  const [systemCalculatedTotal, setSystemCalculatedTotal] = useState(0); 
  const [closingReserve, setClosingReserve] = useState(0); 
  const [countedCash, setCountedCash] = useState(0); 
  const [isCountConfirmed, setIsCountConfirmed] = useState(false);
  
  const [sessionTransactions, setSessionTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const [modalMode, setModalMode] = useState<'EXPENSE' | 'SUPPLY' | null>(null);
  const [formData, setFormData] = useState({ desc: '', val: 0, evidence: '' });

  const SESSION_KEY = `RETRY_SESSION_${userId || 'GENERIC'}`;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchPaymentMethods();
    checkIfClosedToday();
    recoverSession();
  }, [userId]);

  useEffect(() => {
    if (step === 'ACTIVE' || step === 'CLOSING') {
      const interval = setInterval(fetchSessionTransactions, 10000);
      fetchSessionTransactions();
      return () => clearInterval(interval);
    }
  }, [step]);

  const recoverSession = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setStep(data.step);
      setOpeningBalance(data.openingBalance);
    } else {
      const lastReserve = localStorage.getItem(`ENTERPRISE_NEXT_OPENING_${userId || 'GENERIC'}`);
      if (lastReserve) setOpeningBalance(Number(lastReserve));
    }
  };

  const saveLocalSession = (currentStep: any, balance: number) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      step: currentStep,
      openingBalance: balance,
      timestamp: new Date().toISOString()
    }));
  };

  const checkIfClosedToday = async () => {
    if (!isOnline) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('cash_audits').select('id').eq('date', today).limit(1);
    if (data && data.length > 0) setUserAlreadyClosed(true);
  };

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*').order('name');
    if (data) setPaymentMethods(data);
  };

  const fetchSessionTransactions = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('due_date', today)
        .order('created_at', { ascending: false });
      
      if (data) {
        setSessionTransactions(data);
        const salesTotal = data.filter(t => t.type === 'INCOME' && t.description.includes('PDV')).reduce((acc, t) => acc + t.amount, 0);
        setSystemCalculatedTotal(salesTotal);
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenRegister = () => {
    if (userAlreadyClosed) return alert("O caixa de hoje já foi encerrado.");
    setStep('ACTIVE');
    saveLocalSession('ACTIVE', openingBalance);
  };

  const handleAddTransaction = async () => {
    if (formData.val <= 0) return alert("Valor inválido.");
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const finalDesc = modalMode === 'SUPPLY' ? 'Reforço de Caixa' : `SANGUIA: ${formData.desc || 'Despesa Rápida'}`;
      
      await supabase.from('financial_transactions').insert([{
        type: modalMode === 'SUPPLY' ? 'INCOME' : 'EXPENSE',
        category: 'OTHER',
        description: `CAIXA: ${finalDesc}`,
        amount: formData.val,
        due_date: today,
        status: 'PAID',
        attachment_url: formData.evidence
      }]);
      
      setFormData({ desc: '', val: 0, evidence: '' });
      setModalMode(null);
      await fetchSessionTransactions();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const calculateAudit = () => {
    const pdvTransactions = sessionTransactions.filter(t => t.type === 'INCOME' && t.description.includes('PDV'));

    const supplies = sessionTransactions
      .filter(t => t.type === 'INCOME' && t.description.includes('Reforço'))
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = sessionTransactions
      .filter(t => t.type === 'EXPENSE' && (t.description.includes('CAIXA:') || t.description.includes('SANGUIA')))
      .reduce((acc, t) => acc + t.amount, 0);

    // Soma detalhada com busca insensível
    const getSum = (tags: string[]) => pdvTransactions
      .filter(t => tags.some(tag => t.description.toLowerCase().includes(tag.toLowerCase())))
      .reduce((acc, t) => acc + t.amount, 0);

    const cashSales = getSum(['CASH', 'Dinheiro']);
    const pixSales = getSum(['PIX']);
    const creditSales = getSum(['CREDIT', 'Crédito']);
    const debitSales = getSum(['DEBIT', 'Débito']);
    
    // Identifica vendas que caíram no "Total Geral" mas não em nenhuma categoria específica
    const sumCategorized = cashSales + pixSales + creditSales + debitSales;
    const uncategorizedSales = Math.max(0, systemCalculatedTotal - sumCategorized);

    const expectedCash = openingBalance + cashSales + supplies - expenses;
    const diff = countedCash - expectedCash;
    
    return { expectedCash, diff, cashSales, pixSales, creditSales, debitSales, supplies, expenses, uncategorizedSales };
  };

  const handleFinishClosing = async () => {
    setLoading(true);
    try {
      const { diff } = calculateAudit();
      const today = new Date().toISOString().split('T')[0];
      
      await supabase.from('cash_audits').insert([{
        date: today,
        status: 'PENDING',
        difference_value: diff,
        audited_by: userName || 'Operador',
        notes: `Fechamento Terminal. Físico: R$ ${countedCash.toFixed(2)}. Diferença: R$ ${diff.toFixed(2)}`
      }]);

      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(`ENTERPRISE_NEXT_OPENING_${userId || 'GENERIC'}`, closingReserve.toString());
      
      alert("Caixa encerrado com sucesso e enviado para auditoria!");
      setStep('OPEN');
      setUserAlreadyClosed(true);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const renderOpen = () => (
    <div className="max-w-xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 text-center space-y-8 relative overflow-hidden">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet size={48} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Abertura de Caixa</h2>
          <p className="text-slate-500 font-medium italic">Confirme o troco disponível para o terminal.</p>
        </div>
        
        {userAlreadyClosed ? (
           <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-200">
              <Lock size={32} className="mx-auto text-amber-500 mb-2" />
              <h3 className="font-black text-amber-800 text-lg uppercase">Turno Encerrado</h3>
              <p className="text-xs text-amber-700 mt-2 font-medium">Este terminal já foi fechado hoje.</p>
           </div>
        ) : (
          <>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Troco Inicial (Dinheiro)</label>
              <input 
                type="number" 
                value={openingBalance}
                onChange={e => setOpeningBalance(Number(e.target.value))}
                className="w-full bg-white text-4xl font-black text-slate-800 text-center p-4 rounded-xl outline-none focus:ring-4 ring-emerald-100"
              />
            </div>
            <button onClick={handleOpenRegister} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95">
              <CheckCircle2 /> Abrir Terminal
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderActive = () => {
    const { expenses } = calculateAudit();
    const salesCount = sessionTransactions.filter(t => t.type === 'INCOME' && t.description.includes('PDV')).length;

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="flex flex-col xl:flex-row gap-6">
           <div className="xl:w-1/3 space-y-6">
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Banknote size={120}/></div>
                  <div className="flex justify-between items-center mb-1 relative z-10">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Caixa Ativo</p>
                    <div className="flex items-center gap-2">
                       {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500 animate-pulse" />}
                       <span className="text-[9px] font-black uppercase">{userName}</span>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="text-xs text-slate-400 font-black uppercase">Fundo Inicial</span>
                       <span className="text-2xl font-black">R$ {openingBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="text-xs text-emerald-400 font-black uppercase">Vendas Totais ({salesCount})</span>
                       <span className="text-2xl font-black text-emerald-400">R$ {systemCalculatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-xs text-rose-400 font-black uppercase">Saídas (Sangrias)</span>
                       <span className="text-2xl font-black text-rose-400">R$ {expenses.toFixed(2)}</span>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalMode('SUPPLY')} className="bg-indigo-50 text-indigo-600 p-8 rounded-[2.5rem] border-2 border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center gap-2 group shadow-sm">
                    <ArrowUpCircle size={32} className="group-hover:scale-110 transition-transform" /> <span className="font-black uppercase text-[10px] tracking-widest">Reforço</span>
                  </button>
                  <button onClick={() => setModalMode('EXPENSE')} className="bg-rose-50 text-rose-600 p-8 rounded-[2.5rem] border-2 border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex flex-col items-center gap-2 group shadow-sm">
                    <ArrowDownCircle size={32} className="group-hover:scale-110 transition-transform" /> <span className="font-black uppercase text-[10px] tracking-widest">Sangria</span>
                  </button>
              </div>

              <button onClick={() => { setIsCountConfirmed(false); setStep('CLOSING'); }} className="w-full bg-emerald-500 text-white p-8 rounded-[3rem] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl active:scale-95">
                <Lock size={24}/> <span className="font-black uppercase tracking-[0.2em] text-sm">Fechar Turno</span>
              </button>
           </div>

           <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="font-black text-slate-800 text-xl flex items-center gap-4"><History size={24} className="text-indigo-500"/> Registro do Turno</h3>
                 <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-full border">Tempo Real</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 max-h-[600px] pr-2">
                 {sessionTransactions.map(tx => (
                   <div key={tx.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all group">
                      <div className="flex items-center gap-6">
                         <div className={`p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                           {tx.type === 'INCOME' ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                         </div>
                         <div>
                           <p className="font-black text-slate-800 text-lg tracking-tight">{tx.description}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleTimeString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'EXPENSE' ? '-' : '+'} R$ {tx.amount.toFixed(2)}
                        </p>
                      </div>
                   </div>
                 ))}
                 {sessionTransactions.length === 0 && (
                   <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                      <RefreshCw size={48} className="animate-spin-slow" />
                      <p className="font-black uppercase text-xs tracking-widest">Aguardando transações...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {modalMode && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">{modalMode === 'SUPPLY' ? 'Reforço' : 'Sangria'}</h3>
                </div>
                <div className="space-y-6">
                  <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">R$</span>
                     <input type="number" autoFocus placeholder="0.00" value={formData.val === 0 ? '' : formData.val} onChange={e => setFormData({...formData, val: Number(e.target.value)})} className="w-full pl-20 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-black outline-none text-4xl text-slate-800" />
                  </div>
                  <input type="text" placeholder="Motivo/Descrição" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-center" />
                  <div className="flex gap-4 pt-6">
                    <button onClick={() => setModalMode(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-xs">Voltar</button>
                    <button onClick={handleAddTransaction} disabled={loading} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2">
                       {loading ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderClosing = () => {
    const { expectedCash, diff, cashSales, pixSales, creditSales, debitSales, supplies, expenses, uncategorizedSales } = calculateAudit();
    const isCorrect = Math.abs(diff) < 0.01;
    const salesCount = sessionTransactions.filter(t => t.type === 'INCOME' && t.description.includes('PDV')).length;
    const ticketMedio = salesCount > 0 ? (systemCalculatedTotal / salesCount) : 0;

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8">
        {!isCountConfirmed ? (
           <div className="bg-white p-12 rounded-[4rem] border-4 border-slate-900 text-center shadow-2xl">
              <Coins size={64} className="mx-auto text-indigo-500 mb-6" />
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Contagem de Gaveta</h3>
              <p className="text-slate-500 font-medium mb-10 italic">Conte todo o dinheiro físico na gaveta do terminal agora.</p>
              
              <div className="max-w-xs mx-auto mb-10">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block">Dinheiro Contado (R$)</label>
                 <input 
                   type="number" 
                   value={countedCash || ''} 
                   onChange={e => setCountedCash(Number(e.target.value))}
                   className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] text-center font-black text-4xl outline-none focus:border-indigo-500" 
                   placeholder="0.00"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setStep('ACTIVE')} className="py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs">Voltar</button>
                 <button onClick={() => setIsCountConfirmed(true)} className="py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs shadow-xl hover:bg-indigo-600 transition-all">Confirmar Contagem</button>
              </div>
           </div>
        ) : (
           <div className="bg-white p-12 rounded-[4rem] shadow-2xl space-y-10 animate-in zoom-in-95">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Relatório de Fechamento</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Terminal: {userName}</p>
                 </div>
                 <div className="text-right">
                    <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       {isCorrect ? 'Caixa Batido' : 'Divergência Detectada'}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Ticket Médio</p>
                    <p className="text-2xl font-black text-indigo-600">R$ {ticketMedio.toFixed(2)}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Vendas Totais (Sistema)</p>
                    <p className="text-2xl font-black text-emerald-600">R$ {systemCalculatedTotal.toFixed(2)}</p>
                 </div>
                 <div className={`p-6 rounded-[2.5rem] border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Diferença Furo Dinheiro</p>
                    <p className={`text-2xl font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>R$ {diff.toFixed(2)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="border-t border-slate-100 pt-10">
                    <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Composição em Dinheiro</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Fundo Inicial (+)</span> <span className="text-slate-700">R$ {openingBalance.toFixed(2)}</span></div>
                       <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Vendas Dinheiro (+)</span> <span className="text-emerald-600 font-black">R$ {cashSales.toFixed(2)}</span></div>
                       <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Reforços (+)</span> <span className="text-slate-700">R$ {supplies.toFixed(2)}</span></div>
                       <div className="flex justify-between text-sm font-bold border-b border-slate-100 pb-3"><span className="text-slate-400">Sangrias (-)</span> <span className="text-rose-500">R$ {expenses.toFixed(2)}</span></div>
                       <div className="flex justify-between text-lg font-black pt-2"><span className="text-slate-800 uppercase tracking-tighter">Esperado em Caixa</span> <span className="text-indigo-600">R$ {expectedCash.toFixed(2)}</span></div>
                       <div className="bg-slate-900 text-white p-6 rounded-[2rem] mt-4 flex justify-between items-center">
                          <span className="text-xs font-black uppercase opacity-60">Informado Físico</span>
                          <span className="text-3xl font-black">R$ {countedCash.toFixed(2)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-10">
                    <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><CreditCard size={20} className="text-indigo-500"/> Outros Recebimentos</h4>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><QrCode size={16}/></div><span className="font-black text-slate-600 text-[10px] uppercase tracking-widest">PIX</span></div>
                          <span className="font-black text-slate-800">R$ {pixSales.toFixed(2)}</span>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><CreditCard size={16}/></div><span className="font-black text-slate-600 text-[10px] uppercase tracking-widest">Crédito</span></div>
                          <span className="font-black text-slate-800">R$ {creditSales.toFixed(2)}</span>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Landmark size={16}/></div><span className="font-black text-slate-600 text-[10px] uppercase tracking-widest">Débito</span></div>
                          <span className="font-black text-slate-800">R$ {debitSales.toFixed(2)}</span>
                       </div>

                       {uncategorizedSales > 0 && (
                         <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
                            <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-rose-600 shadow-sm"><HelpCircle size={16}/></div><span className="font-black text-rose-600 text-[10px] uppercase tracking-widest">Não Categorizadas</span></div>
                            <span className="font-black text-rose-800">R$ {uncategorizedSales.toFixed(2)}</span>
                         </div>
                       )}
                       
                       <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] text-indigo-800 font-bold leading-tight">
                            <span className="font-black uppercase">Nota Auditoria:</span> A soma de todos os campos (Incluindo Não Categorizadas) totaliza os R$ {systemCalculatedTotal.toFixed(2)} registrados hoje.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t border-slate-100 space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Reserva para Próxima Abertura (Gaveta)</label>
                    <input type="number" value={closingReserve} onChange={e => setClosingReserve(Number(e.target.value))} className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-center text-indigo-700 mt-2 outline-none" />
                </div>

                {!isCorrect && (
                  <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex gap-4 animate-pulse">
                     <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                     <p className="text-xs font-bold text-rose-800 leading-relaxed">
                       <span className="font-black uppercase">Atenção Auditor:</span> Foi detectada uma divergência entre o sistema e o físico. Este fechamento será marcado como "Crítico" no painel administrativo para averiguação de quebra de caixa.
                     </p>
                  </div>
                )}

                <button onClick={handleFinishClosing} disabled={loading} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : <CloudSync />} Finalizar Turno e Sincronizar
                </button>
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
           <h2 className="text-4xl font-black text-slate-800 tracking-tight">Frente de Caixa</h2>
           <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 font-medium">Gestão de gaveta e sangria por terminal.</p>
              {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500" />}
           </div>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border">
           <button onClick={() => setStep('OPEN')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${step === 'OPEN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Caixa</button>
           <button onClick={() => setStep('HISTORY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${step === 'HISTORY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Histórico</button>
        </div>
      </header>

      {step === 'OPEN' && renderOpen()}
      {step === 'ACTIVE' && renderActive()}
      {step === 'CLOSING' && renderClosing()}
      {step === 'HISTORY' && (
        <div className="text-center py-32 opacity-30 flex flex-col items-center gap-4 bg-white rounded-[4rem] border border-dashed">
           <History size={64}/>
           <p className="font-black uppercase tracking-widest text-xs">Relatórios consolidados disponíveis apenas no módulo Administrativo.</p>
        </div>
      )}
    </div>
  );
};

export default CashRegister;
