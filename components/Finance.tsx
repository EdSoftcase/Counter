
import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, 
  Loader2, FileText, Landmark, Gavel, Droplets, Lightbulb, Hammer, Trash2, X, CheckCircle2, Clock, Percent, CreditCard, AlertCircle, Users
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { FinancialTransaction, PaymentMethod, User } from '../types';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flow' | 'methods'>('flow');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    category: 'UTILITY' as any,
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'PENDING' as 'PAID' | 'PENDING'
  });

  const [methodForm, setMethodForm] = useState({
    name: '',
    fee_percentage: 0,
    settlement_days: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: t, error: tError } = await supabase.from('financial_transactions').select('*').order('due_date', { ascending: false });
      if (tError) throw tError;
      setTransactions(t || []);
      
      const { data: m, error: mError } = await supabase.from('payment_methods').select('*').order('name');
      if (mError) throw mError;
      setPaymentMethods(m || []);
    } catch (err: any) { 
      console.error("Erro ao buscar dados:", err);
    } finally { setLoading(false); }
  };

  const handleProcessPayroll = async () => {
    const monthYear = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!confirm(`Deseja calcular e lançar a Folha de Pagamento de ${monthYear} no financeiro?`)) return;
    
    setIsSaving(true);
    try {
      // 1. Busca todos os funcionários e seus salários
      const { data: employees } = await supabase.from('profiles').select('salary');
      const totalPayroll = (employees || []).reduce((acc, emp) => acc + (emp.salary || 0), 0);
      
      if (totalPayroll <= 0) {
        alert("Nenhum salário cadastrado na equipe.");
        return;
      }

      // 2. Cria despesa de Folha
      const { error } = await supabase.from('financial_transactions').insert([{
        type: 'EXPENSE',
        category: 'LABOR',
        description: `FOLHA DE PAGAMENTO: Competência ${monthYear.toUpperCase()}`,
        amount: totalPayroll,
        due_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        status: 'PENDING'
      }]);

      if (error) throw error;
      
      alert(`Sucesso! Folha de R$ ${totalPayroll.toFixed(2)} provisionada para o dia 01.`);
      await fetchData();
    } catch (err: any) {
      alert("Erro na folha: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!form.description || form.amount <= 0) return alert("Preencha todos os campos.");
    setIsSaving(true);
    try {
      const { error } = await supabase.from('financial_transactions').insert([form]);
      if (error) throw error;
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) { alert("Erro ao salvar: " + err.message); }
    finally { setIsSaving(false); }
  };

  const handleLiquidate = async (id: string) => {
    if (!id) return;
    if (!confirm("Confirmar a liquidação deste valor? Isso atualizará o saldo real do caixa.")) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase.from('financial_transactions').update({
        status: 'PAID',
        due_date: new Date().toISOString().split('T')[0] 
      }).eq('id', id);
      
      if (error) throw error;
      
      await fetchData();
    } catch (err: any) { 
      alert("Falha na liquidação: " + err.message); 
    } finally { 
      setProcessingId(null); 
    }
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('payment_methods').insert([methodForm]);
      if (error) throw error;
      setIsMethodModalOpen(false);
      await fetchData();
    } catch (err: any) { alert("Erro ao salvar método: " + err.message); }
    finally { setIsSaving(false); }
  };

  const calculateTotals = () => {
    const incomes = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    
    const pendingToPay = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);
    const totalFees = transactions.filter(t => t.category === 'FEES').reduce((acc, t) => acc + t.amount, 0);
    
    return { incomes, expenses, pendingToPay, totalFees, balance: incomes - expenses };
  };

  const { incomes, expenses, pendingToPay, totalFees, balance } = calculateTotals();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'FEES': return <Percent size={18} />;
      case 'UTILITY': return <Droplets size={18} />;
      case 'INVENTORY': return <FileText size={18} />;
      case 'LABOR': return <Users size={18} />;
      default: return <DollarSign size={18} />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Financeiro Enterprise</h2>
          <p className="text-slate-500 font-medium">Controle total: Receitas, Taxas e Folha de Pagamento.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border shadow-sm">
           <button onClick={() => setActiveTab('flow')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'flow' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Fluxo de Caixa</button>
           <button onClick={() => setActiveTab('methods')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'methods' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Taxas & Prazos</button>
        </div>
      </header>

      {activeTab === 'flow' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3"><TrendingUp size={24}/></div>
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entradas Reais</h4>
              <p className="text-2xl font-black text-slate-800 mt-1">R$ {incomes.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit mb-3"><TrendingDown size={24}/></div>
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saídas Reais</h4>
              <p className="text-2xl font-black text-slate-800 mt-1">R$ {expenses.toFixed(2)}</p>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm">
              <div className="p-3 bg-white text-amber-600 rounded-xl w-fit mb-3 shadow-sm"><Percent size={24}/></div>
              <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Taxas de Cartão</h4>
              <p className="text-2xl font-black text-amber-800 mt-1">R$ {totalFees.toFixed(2)}</p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm">
              <div className="p-3 bg-white text-indigo-600 rounded-xl w-fit mb-3 shadow-sm"><Clock size={24}/></div>
              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Contas a Pagar</h4>
              <p className="text-2xl font-black text-indigo-800 mt-1">R$ {pendingToPay.toFixed(2)}</p>
            </div>

            <div className={`p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden ${balance >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-900 text-white'}`}>
              <div className="relative z-10">
                <h4 className="text-[9px] font-black opacity-60 uppercase tracking-widest">Saldo Atual</h4>
                <p className="text-2xl font-black mt-1">R$ {balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-center sm:text-left flex-col sm:flex-row gap-4">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Extrato Consolidado</h3>
              <div className="flex gap-3">
                <button onClick={handleProcessPayroll} disabled={isSaving} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
                  <Users size={18}/> Processar Folha
                </button>
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                  <Plus size={18}/> Novo Lançamento
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-6">Vencimento</th>
                    <th className="px-10 py-6">Detalhes</th>
                    <th className="px-10 py-6">Valor</th>
                    <th className="px-10 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(t => {
                    const isNF = t.description.includes('[NF RECEBIDA]');
                    const isLabor = t.category === 'LABOR';
                    const isProcessing = processingId === t.id;
                    
                    return (
                      <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'PENDING' ? 'bg-slate-50/20' : ''}`}>
                        <td className="px-10 py-7 text-slate-500 font-bold">{new Date(t.due_date).toLocaleDateString()}</td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-2xl ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : isLabor ? 'bg-indigo-50 text-indigo-600' : isNF ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                               {getCategoryIcon(t.category)}
                             </div>
                             <div>
                              <p className={`font-black text-base ${isLabor && t.status === 'PENDING' ? 'text-indigo-700' : 'text-slate-800'}`}>{t.description}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.category}</p>
                             </div>
                          </div>
                        </td>
                        <td className={`px-10 py-7 font-black text-lg ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </td>
                        <td className="px-10 py-7">
                          <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto w-fit ${t.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : isLabor ? 'bg-indigo-100 text-indigo-700 animate-pulse border border-indigo-200' : isNF ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-amber-100 text-amber-700'}`}>
                            {t.status === 'PAID' ? 'Liquidado' : isLabor ? 'Pagar Folha' : isNF ? 'NF Aguardando' : 'Previsão'}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end gap-2">
                            {t.status === 'PENDING' && (
                              <button 
                                onClick={() => handleLiquidate(t.id)}
                                disabled={isProcessing}
                                className={`p-3 rounded-xl shadow-lg transition-all active:scale-95 ${isProcessing ? 'bg-slate-100 text-slate-300 cursor-wait' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                              >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                              </button>
                            )}
                            <button onClick={async () => {
                              if(confirm("Excluir transação?")) {
                                await supabase.from('financial_transactions').delete().eq('id', t.id);
                                await fetchData();
                              }
                            }} className="text-slate-300 hover:text-rose-500 p-3 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button onClick={() => setIsMethodModalOpen(true)} className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all group">
                <Plus size={48} className="group-hover:scale-110 transition-transform"/>
                <span className="font-black text-xs uppercase tracking-widest">Configurar Taxas</span>
              </button>
              {paymentMethods.map(m => (
                <div key={m.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><CreditCard size={80}/></div>
                  <h3 className="font-black text-2xl text-slate-800 tracking-tight mb-6">{m.name}</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Taxa %</span>
                        <span className="font-black text-indigo-600 text-lg">{m.fee_percentage}%</span>
                     </div>
                     <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Prazo D+</span>
                        <span className="font-black text-slate-700 text-lg">{m.settlement_days}</span>
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Modal Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">Lançamento Financeiro</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
             </div>
             <div className="space-y-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setForm({...form, type: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${form.type === 'EXPENSE' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Saída (Despesa)</button>
                  <button onClick={() => setForm({...form, type: 'INCOME'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${form.type === 'INCOME' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Entrada (Receita)</button>
                </div>
                <input type="text" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black outline-none" />
                <div className="grid grid-cols-2 gap-4">
                   <input type="number" placeholder="Valor R$" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-xl" />
                   <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black" />
                </div>
                <div className="flex items-center gap-3 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <input type="checkbox" checked={form.status === 'PAID'} onChange={e => setForm({...form, status: e.target.checked ? 'PAID' : 'PENDING'})} className="w-6 h-6 accent-amber-500" />
                  <span className="text-xs font-bold text-amber-800">Valor já saiu/entrou no caixa hoje.</span>
                </div>
                <button onClick={handleSaveTransaction} disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
                  {isSaving && <Loader2 className="animate-spin" size={20} />} Confirmar Lançamento
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Modal Adquirente */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">Novo Método de Taxa</h3>
                <button onClick={() => setIsMethodModalOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
             </div>
             <div className="space-y-6">
                <input type="text" placeholder="Nome da Adquirente (Ex: Rede Crédito 1x)" value={methodForm.name} onChange={e => setMethodForm({...methodForm, name: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Taxa %</label>
                    <input type="number" step="0.01" value={methodForm.fee_percentage} onChange={e => setMethodForm({...methodForm, fee_percentage: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Recebimento (D+N)</label>
                    <input type="number" value={methodForm.settlement_days} onChange={e => setMethodForm({...methodForm, settlement_days: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-center" />
                  </div>
                </div>
                <button onClick={handleSaveMethod} disabled={isSaving} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">Salvar Configuração</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
