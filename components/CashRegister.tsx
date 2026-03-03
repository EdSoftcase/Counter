
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, ArrowRight, DollarSign,
  History, CheckCircle2, Lock, Banknote, Coins, Loader2,
  ArrowUpCircle, ArrowDownCircle, Camera, Printer, Wifi, WifiOff, 
  User, Store, Bike, ShoppingCart, TrendingUp, AlertTriangle, CreditCard, 
  Search, X, CheckSquare, Calculator, FileText, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { PaymentMethod, UserRole } from '../types';

interface CashRegisterProps {
  userRole?: UserRole;
  userId?: string;
  userName?: string;
}

const BILLS = [
  { label: 'R$ 200,00', value: 200 },
  { label: 'R$ 100,00', value: 100 },
  { label: 'R$ 50,00', value: 50 },
  { label: 'R$ 20,00', value: 20 },
  { label: 'R$ 10,00', value: 10 },
  { label: 'R$ 5,00', value: 5 },
  { label: 'R$ 2,00', value: 2 },
  { label: 'Moedas / Outros', value: 1 },
];

const CashRegister: React.FC<CashRegisterProps> = ({ userRole, userId, userName }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [step, setStep] = useState<'OPEN' | 'ACTIVE' | 'CLOSING' | 'FITA'>('OPEN');
  const [loading, setLoading] = useState(false);
  const [userAlreadyClosed, setUserAlreadyClosed] = useState(false);

  // Configuração do Terminal
  const [terminalNumber, setTerminalNumber] = useState('01');
  const [openingBalance, setOpeningBalance] = useState(0); 

  // Estados de Fechamento
  const [billCounts, setBillCounts] = useState<Record<number, number>>({});
  const [countedCash, setCountedCash] = useState(0);
  const [justification, setJustification] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Dados da Sessão
  const [sessionTransactions, setSessionTransactions] = useState<any[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  
  const SESSION_KEY = `RETRY_SESSION_V2_${userId || 'GENERIC'}`;

  useEffect(() => {
    if (!userId) return;
    recoverSession();
    checkIfClosedToday();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  useEffect(() => {
    if (step === 'ACTIVE' || step === 'CLOSING' || step === 'FITA') {
      fetchSessionData();
      const interval = setInterval(fetchSessionData, 15000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const recoverSession = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setStep(data.step);
      setOpeningBalance(data.openingBalance);
      setTerminalNumber(data.terminalNumber);
    }
  };

  const saveLocalSession = (currentStep: any) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      step: currentStep,
      openingBalance: openingBalance,
      terminalNumber: terminalNumber,
      timestamp: new Date().toISOString()
    }));
  };

  const checkIfClosedToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('cash_audits').select('id').eq('date', today).limit(1);
    if (data && data.length > 0) setUserAlreadyClosed(true);
  };

  const fetchSessionData = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('due_date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data && data.length > 0) {
        setSessionTransactions(data);
        generateSummary(data);
        setIsDemo(false);
      } else {
        // Se não houver dados reais, usamos dados de demonstração para não ficar em branco
        const demoData = [
          { id: 'd1', description: 'Venda PDV [DINE_IN]: Mesa 5 | Pagto: Dinheiro', amount: 145.50, type: 'INCOME', created_at: new Date().toISOString() },
          { id: 'd2', description: 'Venda PDV [DELIVERY]: João Silva | Pagto: PIX', amount: 89.90, type: 'INCOME', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
          { id: 'd3', description: 'Suprimento de Caixa: Troco moedas', amount: 50.00, type: 'INCOME', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
          { id: 'd4', description: 'Sangria: Pagamento fornecedor hortifruti', amount: 35.00, type: 'EXPENSE', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        ];
        setSessionTransactions(demoData);
        generateSummary(demoData);
        setIsDemo(true);
      }
    } catch (err) { 
      console.error(err);
      // Fallback para demo em caso de erro de conexão
      const demoData = [
        { id: 'd1', description: 'Venda PDV [DINE_IN]: Mesa 5 | Pagto: Dinheiro', amount: 145.50, type: 'INCOME', created_at: new Date().toISOString() },
      ];
      setSessionTransactions(demoData);
      generateSummary(demoData);
      setIsDemo(true);
    }
  };

  const generateSummary = (txs: any[]) => {
    const pdv = txs.filter(t => t.description.includes('Venda PDV'));
    
    // Categorização de Vendas
    const cash = pdv.filter(t => t.description.includes('Dinheiro')).reduce((acc, t) => acc + t.amount, 0);
    const pix = pdv.filter(t => t.description.includes('PIX')).reduce((acc, t) => acc + t.amount, 0);
    const cards = pdv.filter(t => t.description.includes('Cartão')).reduce((acc, t) => acc + t.amount, 0);
    
    // Contagem de Pizzas (Baseado no nome padrão do MOCK_MENU)
    const pizzaCount = pdv.reduce((acc, t) => {
      const matches = t.description.match(/Pizza (Grande|Individual)/g);
      return acc + (matches ? matches.length : 0);
    }, 0);

    // Taxas de Serviço (10%)
    const serviceCharges = pdv.reduce((acc, t) => {
      const match = t.description.match(/Taxa Serviço \(10%\): R\$ ([\d,.]+)/);
      return acc + (match ? parseFloat(match[1].replace(',', '.')) : 0);
    }, 0);

    // Motoboys
    const motoboyMap: Record<string, { count: number, fees: number }> = {};
    pdv.filter(t => t.description.includes('Entregador:')).forEach(t => {
      const name = t.description.split('Entregador: ')[1]?.split('|')[0]?.trim();
      const feeMatch = t.description.match(/TX: R\$ ([\d,.]+)/);
      const fee = feeMatch ? parseFloat(feeMatch[1].replace(',', '.')) : 0;
      if (name) {
        motoboyMap[name] = { 
          count: (motoboyMap[name]?.count || 0) + 1,
          fees: (motoboyMap[name]?.fees || 0) + fee
        };
      }
    });

    // Sangrias e Reforços
    const supplies = txs.filter(t => t.description.includes('Reforço')).reduce((acc, t) => acc + t.amount, 0);
    const expenses = txs.filter(t => t.description.includes('SANGUIA') || t.description.includes('CAIXA:')).reduce((acc, t) => acc + t.amount, 0);

    const expectedInDrawer = openingBalance + cash + supplies - expenses;

    setSummary({
      cash, pix, cards, pizzaCount, serviceCharges, motoboyMap, supplies, expenses, expectedInDrawer,
      totalSales: cash + pix + cards
    });
  };

  const updateBillCount = (val: number, qty: number) => {
    const newCounts = { ...billCounts, [val]: qty };
    setBillCounts(newCounts);
    const total = Object.entries(newCounts).reduce((acc, [v, q]) => acc + (Number(v) * q), 0);
    setCountedCash(total);
  };

  const handleOpenRegister = () => {
    if (openingBalance < 0) return alert("Troco inicial inválido.");
    setStep('ACTIVE');
    saveLocalSession('ACTIVE');
  };

  const handleFinalize = async () => {
    if (!summary) return;
    const diff = countedCash - summary.expectedInDrawer;
    
    if (Math.abs(diff) > 0.01 && !justification) {
      setShowDiagnostic(true);
      return alert(`Diferença de R$ ${diff.toFixed(2)} detectada. Por favor, identifique o motivo no campo de justificativa.`);
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('cash_audits').insert([{
        date: today,
        status: 'PENDING',
        difference_value: diff,
        audited_by: `${userName} (T-${terminalNumber})`,
        notes: `Fechamento Terminal ${terminalNumber}. Esperado: ${summary.expectedInDrawer.toFixed(2)}. Contado: ${countedCash.toFixed(2)}. Justificativa: ${justification || 'N/A'}`
      }]);

      localStorage.removeItem(SESSION_KEY);
      setStep('FITA');
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Abertura de Caixa</h2>
          <p className="text-slate-500 font-medium italic">Confirme os valores para iniciar o turno.</p>
        </div>
        
        {userAlreadyClosed ? (
           <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-200">
              <Lock size={32} className="mx-auto text-amber-500 mb-2" />
              <h3 className="font-black text-amber-800 text-lg uppercase">Caixa Encerrado</h3>
              <p className="text-xs text-amber-700 mt-2">O movimento de hoje já foi consolidado.</p>
           </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-6 rounded-[2rem] border">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Terminal</label>
                  <select value={terminalNumber} onChange={e => setTerminalNumber(e.target.value)} className="w-full bg-white text-2xl font-black text-center p-3 rounded-xl border">
                    <option value="01">PDV 01</option>
                    <option value="02">PDV 02</option>
                  </select>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem] border">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Troco Inicial</label>
                  <input type="number" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} className="w-full bg-white text-2xl font-black text-center p-3 rounded-xl border" />
               </div>
            </div>
            <button onClick={handleOpenRegister} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
              <CheckCircle2 size={24}/> Abrir Caixa
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActive = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120}/></div>
             <div>
                <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Terminal {terminalNumber} em Operação
                </div>
                <h3 className="text-slate-400 font-bold text-xs uppercase mb-1">Entradas em Dinheiro</h3>
                <p className="text-4xl font-black">R$ {summary?.cash.toFixed(2) || '0.00'}</p>
             </div>
             <div className="mt-10 pt-10 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Fundo Inicial</span><span>R$ {openingBalance.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase"><span>Vendas (Total)</span><span>R$ {summary?.totalSales.toFixed(2)}</span></div>
             </div>
          </div>

          <div className="lg:col-span-2 bg-white border rounded-[3rem] p-10 shadow-sm flex flex-col h-[450px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3"><History className="text-indigo-500"/> Atividade Recente</h3>
                <button onClick={fetchSessionData} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><RefreshCw size={18}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {sessionTransactions.length > 0 ? (
                  sessionTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {tx.type === 'INCOME' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-sm">{tx.description}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleTimeString()}</p>
                          </div>
                       </div>
                       <span className={`font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {tx.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <History size={40} />
                     </div>
                     <div>
                        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Nenhuma atividade</p>
                        <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">As vendas aparecerão aqui em tempo real</p>
                     </div>
                  </div>
                )}
             </div>
             {isDemo && (
               <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-500" />
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Modo Demonstração: Dados fictícios exibidos para visualização.</p>
               </div>
             )}
          </div>
       </div>

       <div className="flex justify-center pt-8">
          <button onClick={() => setStep('CLOSING')} className="px-20 py-8 bg-rose-600 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-rose-700 transition-all flex items-center gap-4 active:scale-95">
             <Lock size={28}/> Fechar Turno e Conferir
          </button>
       </div>
    </div>
  );

  const renderClosing = () => {
    const diff = countedCash - (summary?.expectedInDrawer || 0);
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
         <header className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Fechamento de Gaveta</h2>
            <p className="text-slate-500 font-medium">Conte as cédulas e moedas com atenção.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border rounded-[3rem] p-10 shadow-sm space-y-6">
               <h3 className="font-black text-slate-800 text-lg flex items-center gap-3 border-b pb-4">
                  <Banknote className="text-indigo-500" /> Contador de Cédulas
               </h3>
               <div className="grid grid-cols-1 gap-3">
                  {BILLS.map(bill => (
                    <div key={bill.value} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                       <span className="font-black text-slate-700 w-24">{bill.label}</span>
                       <div className="flex items-center gap-4">
                          <span className="text-slate-400 font-bold text-xs uppercase">Qtd:</span>
                          <input 
                            type="number" 
                            min="0"
                            value={billCounts[bill.value] || ''}
                            onChange={e => updateBillCount(bill.value, Number(e.target.value))}
                            className="w-20 p-2 rounded-xl border-2 border-indigo-100 text-center font-black text-indigo-600 focus:border-indigo-400 outline-none" 
                          />
                          <span className="w-24 text-right font-black text-slate-800">R$ {((billCounts[bill.value] || 0) * bill.value).toFixed(2)}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="pt-6 border-t flex justify-between items-center">
                  <span className="font-black text-slate-400 uppercase tracking-widest">Total Físico Contado</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {countedCash.toFixed(2)}</span>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl space-y-8">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-400 border-b border-white/10 pb-4">Consolidação do Sistema</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-sm uppercase">Fundo + Dinheiro + Reforço</span>
                        <span className="font-black text-xl text-emerald-400">+ R$ {(summary?.expectedInDrawer + summary?.expenses).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-sm uppercase">Sangrias / Despesas</span>
                        <span className="font-black text-xl text-rose-400">- R$ {summary?.expenses.toFixed(2)}</span>
                     </div>
                     <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                        <span className="font-black uppercase tracking-widest text-xs">Esperado em Gaveta</span>
                        <span className="text-3xl font-black">R$ {summary?.expectedInDrawer.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               <div className={`p-8 rounded-[2.5rem] border-4 transition-all ${Math.abs(diff) < 0.01 ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="font-black uppercase tracking-widest text-xs">Diferença de Caixa</h4>
                     <AlertCircle className={Math.abs(diff) < 0.01 ? 'text-emerald-500' : 'text-rose-500'} />
                  </div>
                  <p className={`text-4xl font-black ${Math.abs(diff) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {diff === 0 ? 'CAIXA PERFEITO' : `DIF: R$ ${diff.toFixed(2)}`}
                  </p>
                  
                  {Math.abs(diff) > 0.01 && showDiagnostic && (
                     <div className="mt-6 space-y-4 animate-in slide-in-from-top-2">
                        <div className="p-4 bg-white/50 rounded-2xl border border-rose-200">
                           <p className="text-[10px] font-black uppercase text-rose-700 mb-2">Diagnóstico de Falha Sugerido:</p>
                           <ul className="text-xs font-bold text-rose-900 list-disc pl-4 space-y-1">
                              <li>{diff < 0 ? "Faltou dinheiro: Confira se pagou algum fornecedor e esqueceu de lançar a Sangria." : "Sobrou dinheiro: Confira se alguma venda em CARTÃO foi lançada como DINHEIRO."}</li>
                              <li>Verifique se o Troco Inicial de R$ {openingBalance.toFixed(2)} estava correto.</li>
                              <li>Confira os 10% do garçom: foram retirados ou ficaram na gaveta?</li>
                           </ul>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-rose-600 ml-2">Justificativa Obrigatória</label>
                           <textarea 
                             value={justification}
                             onChange={e => setJustification(e.target.value)}
                             placeholder="Descreva aqui o que pode ter ocorrido para esta diferença..."
                             className="w-full p-4 bg-white rounded-2xl border-2 border-rose-100 outline-none focus:border-rose-400 font-bold text-sm h-24"
                           />
                        </div>
                     </div>
                  )}
               </div>

               <button onClick={handleFinalize} disabled={loading} className="w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4">
                  {loading ? <Loader2 className="animate-spin" /> : <CheckSquare size={24}/>} Confirmar e Gerar Fita
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderFita = () => (
    <div className="max-w-xl mx-auto py-12 animate-in zoom-in-95">
       <div id="printable-fita" className="bg-white p-12 shadow-2xl border-2 border-slate-100 relative overflow-hidden font-mono text-slate-800">
          {/* Thermal Paper Header Style */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-8 mb-8">
             <h2 className="text-2xl font-black tracking-widest uppercase">Counter Enterprise</h2>
             <p className="text-[10px] font-bold uppercase mt-1">Gestão Operacional de Pizzaria</p>
             <div className="mt-6 space-y-1 text-xs">
                <p>FECHAMENTO DE CAIXA: {new Date().toLocaleDateString()}</p>
                <p>TERMINAL: {terminalNumber} | OPERADOR: {userName?.toUpperCase()}</p>
                <p>HORÁRIO: {new Date().toLocaleTimeString()}</p>
             </div>
          </div>

          <div className="space-y-8">
             <section>
                <h4 className="font-black border-b border-slate-200 pb-1 mb-3 text-sm uppercase">1. Métricas de Produção</h4>
                <div className="flex justify-between text-sm">
                   <span>TOTAL DE PIZZAS VENDIDAS</span>
                   <span className="font-black">{summary?.pizzaCount} UN</span>
                </div>
             </section>

             <section>
                <h4 className="font-black border-b border-slate-200 pb-1 mb-3 text-sm uppercase">2. Logística (Motoboys)</h4>
                <table className="w-full text-xs">
                   <thead>
                      <tr className="text-left font-black opacity-60">
                         <th className="pb-2">ENTREGADOR</th>
                         <th className="pb-2 text-center">QTD</th>
                         <th className="pb-2 text-right">TAXAS R$</th>
                      </tr>
                   </thead>
                   <tbody>
                      {Object.entries(summary?.motoboyMap || {}).map(([name, stats]: any) => (
                        <tr key={name} className="border-b border-slate-50 last:border-0">
                           <td className="py-2 font-black uppercase">{name}</td>
                           <td className="py-2 text-center">{stats.count}</td>
                           <td className="py-2 text-right font-black">{stats.fees.toFixed(2)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </section>

             <section>
                <h4 className="font-black border-b border-slate-200 pb-1 mb-3 text-sm uppercase">3. Financeiro Detalhado</h4>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span>DINHEIRO (GAVETA)</span><span className="font-black">R$ {summary?.cash.toFixed(2)}</span></div>
                   <div className="flex justify-between"><span>PIX RECEBIDO</span><span className="font-black">R$ {summary?.pix.toFixed(2)}</span></div>
                   <div className="flex justify-between"><span>CARTÕES (DÉB/CRÉD)</span><span className="font-black">R$ {summary?.cards.toFixed(2)}</span></div>
                   <div className="flex justify-between pt-2 border-t font-black text-indigo-600"><span>TOTAL DE 10% GARÇOM</span><span>R$ {summary?.serviceCharges.toFixed(2)}</span></div>
                </div>
             </section>

             <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-black border-b border-slate-300 pb-1 mb-3 text-xs uppercase text-slate-500">Conferência de Caixa</h4>
                <div className="space-y-2 text-xs">
                   <div className="flex justify-between"><span>FUNDO ABERTURA</span><span className="font-black">R$ {openingBalance.toFixed(2)}</span></div>
                   <div className="flex justify-between"><span>ESPERADO EM GAVETA</span><span className="font-black">R$ {summary?.expectedInDrawer.toFixed(2)}</span></div>
                   <div className="flex justify-between pt-2 border-t font-black"><span>REAL CONTADO</span><span className="text-lg">R$ {countedCash.toFixed(2)}</span></div>
                   <div className="flex justify-between font-black text-rose-600">
                      <span>DIFERENÇA FINAL</span>
                      <span>R$ {(countedCash - summary?.expectedInDrawer).toFixed(2)}</span>
                   </div>
                </div>
             </section>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 text-center space-y-8">
             <div className="border-t border-slate-900 pt-2 inline-block px-10">
                <p className="text-[10px] font-black uppercase">Assinatura Operador</p>
             </div>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Relatório Auditado por Counter AI v10</p>
          </div>
       </div>

       <div className="flex gap-4 mt-8 no-print">
          <button onClick={() => window.print()} className="flex-1 py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 flex items-center justify-center gap-3">
             <Printer size={24}/> Imprimir Fita
          </button>
          <button onClick={() => { setStep('OPEN'); setUserAlreadyClosed(true); }} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
             <CheckCircle2 size={24}/> Finalizar Turno
          </button>
       </div>
    </div>
  );

  return (
    <div className="pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div className="no-print">
           <h2 className="text-4xl font-black text-slate-800 tracking-tight">Frente de Caixa</h2>
           <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 font-medium">Gestão de fechamento e auditoria de terminal.</p>
              {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500" />}
           </div>
        </div>
      </header>

      {step === 'OPEN' && renderOpen()}
      {step === 'ACTIVE' && renderActive()}
      {step === 'CLOSING' && renderClosing()}
      {step === 'FITA' && renderFita()}

      <style>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          #printable-fita, #printable-fita * { visibility: visible; }
          #printable-fita { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
            padding: 0; 
            box-shadow: none; 
            border: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CashRegister;
