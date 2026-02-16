
import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, 
  Loader2, FileText, Landmark, Gavel, Droplets, Lightbulb, Hammer, Trash2, X, CheckCircle2, Clock, Percent, CreditCard, AlertCircle, Users, Calendar, Repeat, CalendarRange, Home, Zap, BarChart3, LineChart as LineChartIcon, Edit3, Paperclip, Upload, Truck, ShieldCheck, FileCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar 
} from 'recharts';
import { supabase } from '../services/supabase';
import { FinancialTransaction, PaymentMethod, User } from '../types';

interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  day_of_month: number;
  category: string;
  active: boolean;
}

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flow' | 'dre' | 'projection' | 'recurring' | 'methods' | 'conciliation' | 'audit'>('flow');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  
  // Auditoria
  const [audits, setAudits] = useState<any[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [auditDetails, setAuditDetails] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewAttachment, setViewAttachment] = useState<string | null>(null);

  // Form Transação
  const [form, setForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    category: 'UTILITY' as any,
    description: '',
    supplier: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'PENDING' as 'PAID' | 'PENDING',
    attachment_url: ''
  });

  // Form Método Pagamento
  const [methodForm, setMethodForm] = useState({
    name: '',
    fee_percentage: 0,
    settlement_days: 0
  });
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

  // Form Conta Recorrente
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: 0,
    day_of_month: 5,
    category: 'UTILITY'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: t } = await supabase.from('financial_transactions').select('*').order('due_date', { ascending: true });
      setTransactions(t || []);
      
      const { data: m } = await supabase.from('payment_methods').select('*').order('name');
      setPaymentMethods(m || []);

      const { data: r } = await supabase.from('recurring_bills').select('*').order('day_of_month');
      setRecurringBills(r || []);

      if (activeTab === 'audit') {
        const { data: a } = await supabase.from('cash_audits').select('*').order('date', { ascending: false });
        setAudits(a || []);
      }

    } catch (err: any) { 
      console.error("Erro ao buscar dados:", err);
    } finally { setLoading(false); }
  };

  const handleOpenAudit = async (audit: any) => {
    // Calcula detalhes baseados nas transações do dia
    const dayTransactions = transactions.filter(t => t.due_date === audit.date);
    
    // Vendas Totais (Inclui o que entra em Cartão e Dinheiro)
    const sales = dayTransactions
      .filter(t => t.type === 'INCOME' && t.description.includes('VENDA'))
      .reduce((acc, t) => acc + t.amount, 0);

    // Sangrias
    const expenses = dayTransactions
      .filter(t => t.type === 'EXPENSE' && t.description.includes('CAIXA:'))
      .reduce((acc, t) => acc + t.amount, 0);

    // Diferença/Quebra
    const diff = dayTransactions
      .filter(t => t.description.includes('AJUSTE DE CAIXA'))
      .reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0);

    setAuditDetails({
      ...audit,
      totalSales: sales,
      totalExpenses: expenses,
      finalDifference: diff,
      rawTransactions: dayTransactions
    });
    setProofUrl(audit.deposit_proof_url);
    setSelectedAudit(audit);
  };

  const handleApproveAudit = async () => {
    if(!selectedAudit) return;
    if(!confirm("Aprovar o fechamento deste caixa? Isso valida os números para a contabilidade.")) return;
    
    setIsSaving(true);
    try {
      await supabase.from('cash_audits').update({
        status: 'APPROVED',
        deposit_proof_url: proofUrl
      }).eq('id', selectedAudit.id);
      
      alert("Caixa Aprovado e Auditado!");
      setSelectedAudit(null);
      await fetchData();
    } catch(err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, attachment_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessPayroll = async () => {
    const monthYear = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!confirm(`Deseja calcular e lançar a Folha de Pagamento de ${monthYear} no financeiro?`)) return;
    
    setIsSaving(true);
    try {
      const { data: employees } = await supabase.from('profiles').select('salary');
      const totalPayroll = (employees || []).reduce((acc, emp) => acc + (emp.salary || 0), 0);
      
      if (totalPayroll <= 0) {
        alert("Nenhum salário cadastrado na equipe.");
        return;
      }

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

  const handleGenerateMonthlyBills = async () => {
    const activeBills = recurringBills.filter(b => b.active);
    if (activeBills.length === 0) return alert("Nenhuma conta recorrente ativa.");
    
    if(!confirm(`Deseja gerar ${activeBills.length} contas para o mês atual?`)) return;

    setIsSaving(true);
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const newTransactions = activeBills.map(bill => {
        const dueDate = new Date(currentYear, currentMonth, bill.day_of_month);
        return {
          type: 'EXPENSE',
          category: bill.category,
          description: `[FIXO] ${bill.title}`,
          amount: bill.amount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'PENDING'
        };
      });

      const { error } = await supabase.from('financial_transactions').insert(newTransactions);
      if (error) throw error;

      alert("Contas geradas com sucesso! Verifique na aba Fluxo.");
      setActiveTab('flow');
      await fetchData();
    } catch (err: any) {
      alert("Erro ao gerar contas: " + err.message);
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
      setForm({ ...form, supplier: '', attachment_url: '', description: '', amount: 0 }); // Reset parcial
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

  const handleOpenMethodModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethodId(method.id);
      setMethodForm({
        name: method.name,
        fee_percentage: method.fee_percentage,
        settlement_days: method.settlement_days
      });
    } else {
      setEditingMethodId(null);
      setMethodForm({ name: '', fee_percentage: 0, settlement_days: 0 });
    }
    setIsMethodModalOpen(true);
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name) return;
    setIsSaving(true);
    try {
      if (editingMethodId) {
        // Update existente
        const { error } = await supabase.from('payment_methods')
          .update(methodForm)
          .eq('id', editingMethodId);
        if (error) throw error;
      } else {
        // Insert novo
        const { error } = await supabase.from('payment_methods').insert([methodForm]);
        if (error) throw error;
      }
      setIsMethodModalOpen(false);
      await fetchData();
    } catch (err: any) { alert("Erro ao salvar método: " + err.message); }
    finally { setIsSaving(false); }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta forma de pagamento?")) return;
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch(err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleSaveRecurring = async () => {
    if (!recurringForm.title || recurringForm.amount <= 0) return alert("Preencha os campos.");
    setIsSaving(true);
    try {
      const { error } = await supabase.from('recurring_bills').insert([recurringForm]);
      if (error) {
        if(error.code === '42P01') {
          alert("A tabela 'recurring_bills' não existe. Por favor, vá em 'Arquitetura' e rode o script de atualização do banco.");
        } else {
          throw error;
        }
      } else {
        setIsRecurringModalOpen(false);
        await fetchData();
      }
    } catch (err: any) { alert("Erro ao salvar: " + err.message); }
    finally { setIsSaving(false); }
  };

  const handleDeleteRecurring = async (id: string) => {
    if(!confirm("Excluir esta conta recorrente?")) return;
    try {
      await supabase.from('recurring_bills').delete().eq('id', id);
      fetchData();
    } catch(err) { console.error(err); }
  };

  const calculateTotals = () => {
    const incomes = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const pendingToPay = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);
    const recurringTotal = recurringBills.filter(b => b.active).reduce((acc, b) => acc + b.amount, 0);
    const totalFees = transactions.filter(t => t.category === 'FEES').reduce((acc, t) => acc + t.amount, 0);
    
    return { incomes, expenses, pendingToPay, recurringTotal, totalFees, balance: incomes - expenses };
  };

  const { incomes, expenses, pendingToPay, recurringTotal, totalFees, balance } = calculateTotals();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'FEES': return <Percent size={18} />;
      case 'UTILITY': return <Droplets size={18} />;
      case 'INVENTORY': return <FileText size={18} />;
      case 'LABOR': return <Users size={18} />;
      default: return <DollarSign size={18} />;
    }
  };

  const getTopSuppliers = () => {
    const supplierMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'EXPENSE' && t.supplier)
      .forEach(t => {
        supplierMap[t.supplier] = (supplierMap[t.supplier] || 0) + t.amount;
      });
    
    return Object.entries(supplierMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  };

  // --- COMPONENTES VISUAIS ---

  const renderDRE = () => {
    // Cálculo do DRE baseado no mês atual (considerando realizado E previsto para visão gerencial)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const sumCategory = (cat: string) => monthTransactions.filter(t => t.type === 'EXPENSE' && t.category === cat).reduce((acc, t) => acc + t.amount, 0);
    const grossRevenue = monthTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    
    const taxes = sumCategory('FEES');
    const netRevenue = grossRevenue - taxes;
    
    const cmv = sumCategory('INVENTORY'); // Custo de Mercadoria Vendida
    const grossProfit = netRevenue - cmv;
    
    const labor = sumCategory('LABOR');
    const utility = sumCategory('UTILITY');
    const service = sumCategory('SERVICE');
    const other = sumCategory('OTHER') + sumCategory('MAINTENANCE') + sumCategory('LEGAL') + sumCategory('LOAN');
    
    const totalOpExpenses = labor + utility + service + other;
    const ebitda = grossProfit - totalOpExpenses;

    const dreLines = [
      { label: 'Receita Bruta de Vendas', value: grossRevenue, type: 'plus', main: true },
      { label: '(-) Impostos e Taxas', value: taxes, type: 'minus' },
      { label: '(=) Receita Líquida', value: netRevenue, type: 'result', main: true },
      { label: '(-) CMV (Custo Mercadoria)', value: cmv, type: 'minus' },
      { label: '(=) Lucro Bruto', value: grossProfit, type: 'result', main: true },
      { label: '(-) Despesas com Pessoal', value: labor, type: 'minus' },
      { label: '(-) Água, Luz, Aluguel', value: utility, type: 'minus' },
      { label: '(-) Serviços de Terceiros', value: service, type: 'minus' },
      { label: '(-) Outras Despesas', value: other, type: 'minus' },
      { label: '(=) EBITDA / Resultado Operacional', value: ebitda, type: 'final', main: true },
    ];

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120}/></div>
           <div className="relative z-10">
             <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Resultado Operacional (Mês Atual)</h3>
             <p className={`text-5xl font-black tracking-tight ${ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               R$ {ebitda.toFixed(2)}
             </p>
             <p className="text-xs font-medium mt-4 opacity-70">Lucro antes de juros, impostos, depreciação e amortização.</p>
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
           <h3 className="font-black text-slate-800 text-xl mb-8 flex items-center gap-2">
             <FileText size={24} className="text-indigo-500"/> Demonstrativo de Resultados (DRE)
           </h3>
           <div className="space-y-4">
             {dreLines.map((line, idx) => (
               <div key={idx} className={`flex justify-between items-center py-3 border-b border-slate-50 last:border-0 ${line.main ? 'pt-6' : ''}`}>
                  <span className={`text-sm ${line.main ? 'font-black text-slate-800 uppercase tracking-tight' : 'font-medium text-slate-500 pl-4'}`}>
                    {line.label}
                  </span>
                  <span className={`font-black ${
                    line.type === 'plus' ? 'text-emerald-600' : 
                    line.type === 'minus' ? 'text-rose-500' : 
                    line.type === 'final' ? (line.value >= 0 ? 'text-emerald-600 text-lg' : 'text-rose-600 text-lg') :
                    'text-slate-800'
                  }`}>
                    {line.type === 'minus' && '- '}R$ {line.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  const renderProjection = () => {
    // Projeção para os próximos 30 dias
    const projectionData = [];
    let currentBalance = balance; // Começa com o saldo atual REAL
    const today = new Date();

    let minBalance = currentBalance;
    let minDate = today;

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Soma entradas previstas para este dia (Pending Incomes)
      const dayIn = transactions
        .filter(t => t.type === 'INCOME' && t.status === 'PENDING' && t.due_date === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);

      // Soma saídas previstas para este dia (Pending Expenses)
      const dayOut = transactions
        .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING' && t.due_date === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);

      currentBalance = currentBalance + dayIn - dayOut;
      
      if (currentBalance < minBalance) {
        minBalance = currentBalance;
        minDate = date;
      }

      projectionData.push({
        day: date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
        balance: currentBalance,
        in: dayIn,
        out: dayOut
      });
    }

    const isDanger = minBalance < 0;

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className={`p-8 rounded-[3rem] shadow-xl relative overflow-hidden text-white ${isDanger ? 'bg-rose-600' : 'bg-indigo-600'}`}>
           <div className="absolute top-0 right-0 p-8 opacity-10"><LineChartIcon size={120}/></div>
           <div className="relative z-10">
             <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Projeção de Caixa (30 Dias)</h3>
             {isDanger ? (
               <>
                 <p className="text-4xl font-black tracking-tight flex items-center gap-3">
                   <AlertCircle size={40} className="text-white"/> Risco de Quebra
                 </p>
                 <p className="text-sm font-medium mt-4 bg-white/20 p-3 rounded-xl inline-block">
                   Saldo projetado cairá para <span className="font-black">R$ {minBalance.toFixed(2)}</span> em {minDate.toLocaleDateString()}.
                 </p>
               </>
             ) : (
               <>
                 <p className="text-4xl font-black tracking-tight flex items-center gap-3">
                   <CheckCircle2 size={40} className="text-emerald-300"/> Fluxo Saudável
                 </p>
                 <p className="text-sm font-medium mt-4 opacity-80">
                   O saldo deve permanecer positivo nos próximos 30 dias. Mínimo previsto: R$ {minBalance.toFixed(2)}.
                 </p>
               </>
             )}
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm h-[450px]">
           <h3 className="font-black text-slate-800 text-xl mb-6 ml-4">Evolução do Saldo</h3>
           <ResponsiveContainer width="100%" height="85%">
             <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={isDanger ? '#ef4444' : '#6366f1'} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={isDanger ? '#ef4444' : '#6366f1'} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <Tooltip 
                 contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                 formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Saldo Projetado']}
               />
               <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
               <Area 
                 type="monotone" 
                 dataKey="balance" 
                 stroke={isDanger ? '#ef4444' : '#6366f1'} 
                 strokeWidth={3}
                 fillOpacity={1} 
                 fill="url(#colorBalance)" 
               />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderConciliation = () => {
    // Filtra apenas Receitas Futuras (PENDING INCOMES)
    const receivables = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    const totalReceivables = receivables.reduce((acc, t) => acc + t.amount, 0);

    const grouped = receivables.reduce((groups, t) => {
      const date = t.due_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
      return groups;
    }, {} as Record<string, FinancialTransaction[]>);

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Calendar size={120}/></div>
          <div className="relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Total a Receber (Cartões Futuros)</h3>
            <p className="text-5xl font-black tracking-tight">R$ {totalReceivables.toFixed(2)}</p>
            <p className="text-xs font-medium mt-4 opacity-70">Valores brutos processados via Cartão de Crédito e Débito ainda não compensados.</p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden p-8">
           <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2">
             <Clock size={24} className="text-indigo-500"/> Linha do Tempo de Recebimentos
           </h3>
           <div className="space-y-8">
             {Object.keys(grouped).map(date => {
                const dayTotal = grouped[date].reduce((acc, t) => acc + t.amount, 0);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div key={date} className="relative pl-8 border-l-2 border-slate-100">
                     <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${isToday ? 'bg-emerald-500' : 'bg-indigo-400'}`}></div>
                     <div className="mb-4">
                       <h4 className="font-black text-slate-800 text-lg">
                         {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                         {isToday && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest">Hoje</span>}
                       </h4>
                       <p className="text-xs font-bold text-slate-400 uppercase">Previsão de Entrada: <span className="text-emerald-600">R$ {dayTotal.toFixed(2)}</span></p>
                     </div>
                     <div className="space-y-2">
                        {grouped[date].map(t => (
                          <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                             <div className="flex items-center gap-3">
                                <CreditCard size={16} className="text-slate-400"/>
                                <span className="font-bold text-slate-700 text-sm">{t.description.replace('VENDA ', '').split(':')[0]}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800">R$ {t.amount.toFixed(2)}</span>
                                <button onClick={() => handleLiquidate(t.id)} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100">Antecipar/Baixar</button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )
             })}
             {Object.keys(grouped).length === 0 && (
                <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                  Nenhum recebimento futuro agendado.
                </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  const renderRecurring = () => {
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Repeat size={120}/></div>
             <div className="relative z-10">
               <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Custo Fixo Mensal</h3>
               <p className="text-4xl font-black tracking-tight">R$ {recurringTotal.toFixed(2)}</p>
               <p className="text-xs font-medium mt-4 opacity-70">Soma de todas as contas recorrentes ativas.</p>
               
               <button 
                 onClick={handleGenerateMonthlyBills}
                 disabled={isSaving}
                 className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
               >
                 {isSaving ? <Loader2 className="animate-spin" /> : <CalendarRange size={16} />}
                 Gerar Contas do Mês
               </button>
             </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                 <FileText size={24} className="text-indigo-500"/> Contas Cadastradas
               </h3>
               <button onClick={() => setIsRecurringModalOpen(true)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-indigo-100">
                 <Plus size={14}/> Nova Conta
               </button>
             </div>

             <div className="grid grid-cols-1 gap-3">
               {recurringBills.map(bill => (
                 <div key={bill.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm font-black text-xs">
                         {bill.day_of_month}
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">{bill.title}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400">{bill.category}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <span className="font-black text-slate-800">R$ {bill.amount.toFixed(2)}</span>
                       <button onClick={() => handleDeleteRecurring(bill.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
               {recurringBills.length === 0 && (
                 <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase">Nenhuma conta fixa cadastrada.</div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    return (
      <div className="space-y-8 animate-in fade-in">
        <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="font-black text-slate-800 flex items-center gap-3 text-xl">
             <ShieldCheck className="text-indigo-600" size={24} /> Conferência do Escritório
           </h3>
           <p className="text-xs text-slate-500 font-medium">Valide os fechamentos de caixa enviados pelos operadores.</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
           {audits.map((audit) => (
             <div key={audit.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all">
               <div className={`p-6 flex items-center justify-center w-full md:w-32 ${audit.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <div className="text-center">
                    <div className="font-black text-2xl">{new Date(audit.date).getDate()}</div>
                    <div className="text-[10px] font-bold uppercase">{new Date(audit.date).toLocaleDateString('pt-BR', {month: 'short'})}</div>
                  </div>
               </div>
               
               <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${audit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {audit.status === 'APPROVED' ? 'Auditado' : 'Pendente'}
                      </span>
                      {audit.difference_value !== 0 && (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} /> Divergência: R$ {audit.difference_value.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 italic">"{audit.notes}"</p>
                  </div>

                  <button 
                    onClick={() => handleOpenAudit(audit)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                  >
                    {audit.status === 'APPROVED' ? 'Ver Detalhes' : 'Validar Caixa'}
                  </button>
               </div>
             </div>
           ))}
           {audits.length === 0 && (
             <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">
               Nenhum fechamento pendente de auditoria.
             </div>
           )}
        </div>

        {/* Modal de Auditoria */}
        {selectedAudit && auditDetails && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
             <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                     <FileCheck size={28} className="text-emerald-500" />
                     Conferência: {new Date(selectedAudit.date).toLocaleDateString()}
                   </h3>
                   <button onClick={() => setSelectedAudit(null)} className="text-slate-400 p-2"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Vendas Totais</p>
                      <p className="text-2xl font-black text-emerald-600">+ R$ {auditDetails.totalSales.toFixed(2)}</p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Sangrias/Despesas</p>
                      <p className="text-2xl font-black text-rose-600">- R$ {auditDetails.totalExpenses.toFixed(2)}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <div className="flex gap-3 items-center">
                         <div className="p-2 bg-white rounded-lg text-indigo-600"><DollarSign size={20}/></div>
                         <div>
                           <p className="font-black text-indigo-900 text-sm">Resultado Operacional</p>
                           <p className="text-[10px] text-indigo-600 font-bold uppercase">Conferência Cega</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-black ${auditDetails.finalDifference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {auditDetails.finalDifference === 0 ? 'CAIXA BATIDO' : `DIF: R$ ${auditDetails.finalDifference.toFixed(2)}`}
                         </p>
                      </div>
                   </div>

                   <div className="border-t border-slate-100 pt-6">
                      <h4 className="font-black text-slate-800 text-sm mb-4">Comprovante de Depósito</h4>
                      {proofUrl ? (
                        <div className="relative group">
                           <img src={proofUrl} alt="Comprovante" className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
                           {selectedAudit.status !== 'APPROVED' && (
                             <button onClick={() => setProofUrl(null)} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md text-rose-500 hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                           )}
                        </div>
                      ) : (
                        <label className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/20 transition-all">
                           <Upload size={24} />
                           <span className="text-xs font-bold uppercase tracking-widest">Anexar Comprovante Bancário</span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleUploadProof} />
                        </label>
                      )}
                   </div>

                   {selectedAudit.status === 'PENDING' && (
                     <button 
                       onClick={handleApproveAudit}
                       disabled={isSaving}
                       className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                     >
                       {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                       Aprovar Fechamento
                     </button>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Financeiro Enterprise</h2>
          <p className="text-slate-500 font-medium">Controle total: Receitas, Taxas e Folha de Pagamento.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border shadow-sm flex-wrap gap-1">
           <button onClick={() => setActiveTab('flow')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'flow' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Fluxo</button>
           <button onClick={() => setActiveTab('audit')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Auditoria</button>
           <button onClick={() => setActiveTab('dre')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dre' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>DRE</button>
           <button onClick={() => setActiveTab('projection')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'projection' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Projeção</button>
           <button onClick={() => setActiveTab('recurring')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recurring' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Fixas</button>
           <button onClick={() => setActiveTab('conciliation')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'conciliation' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Conciliação</button>
           <button onClick={() => setActiveTab('methods')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'methods' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Config. Taxas</button>
        </div>
      </header>

      {activeTab === 'flow' && (
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

            <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden group">
              <div className="p-3 bg-white text-indigo-600 rounded-xl w-fit mb-3 shadow-sm relative z-10"><Clock size={24}/></div>
              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest relative z-10">Contas a Pagar</h4>
              <p className="text-2xl font-black text-indigo-800 mt-1 relative z-10">R$ {pendingToPay.toFixed(2)}</p>
              
              {recurringTotal > 0 && (
                <div className="mt-2 text-[10px] text-indigo-500 font-bold flex items-center gap-1 border-t border-indigo-200 pt-2 relative z-10">
                  <Repeat size={10} /> + R$ {recurringTotal.toFixed(2)} Recorrentes
                </div>
              )}
              <div className="absolute top-0 right-0 p-6 text-indigo-200 opacity-20"><Calendar size={80}/></div>
            </div>

            <div className={`p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden ${balance >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-900 text-white'}`}>
              <div className="relative z-10">
                <h4 className="text-[9px] font-black opacity-60 uppercase tracking-widest">Saldo Atual</h4>
                <p className="text-2xl font-black mt-1">R$ {balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
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
                      <th className="px-10 py-6">Fornecedor / Anexo</th>
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
                      const isRecurring = t.description.includes('[FIXO]');
                      
                      return (
                        <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'PENDING' ? 'bg-slate-50/20' : ''}`}>
                          <td className="px-10 py-7 text-slate-500 font-bold">{new Date(t.due_date).toLocaleDateString()}</td>
                          <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                               <div className={`p-3 rounded-2xl ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : isLabor ? 'bg-indigo-50 text-indigo-600' : isNF ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {getCategoryIcon(t.category)}
                               </div>
                               <div>
                                <p className={`font-black text-base ${isLabor && t.status === 'PENDING' ? 'text-indigo-700' : 'text-slate-800'}`}>
                                  {t.description}
                                  {isRecurring && <span className="ml-2 text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase">Recorrente</span>}
                                </p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.category}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-10 py-7">
                            {t.supplier ? (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 text-sm">{t.supplier}</span>
                                {t.attachment_url && (
                                  <button onClick={() => setViewAttachment(t.attachment_url)} className="p-1.5 bg-slate-100 rounded text-slate-400 hover:text-indigo-500">
                                    <Paperclip size={14} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold text-xs">-</span>
                            )}
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

            <div className="w-full lg:w-80 bg-slate-900 rounded-[3rem] p-8 text-white shadow-xl flex flex-col h-fit">
               <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                 <Truck className="text-indigo-400" size={24} /> Ranking Fornecedores
               </h3>
               <div className="space-y-4">
                 {getTopSuppliers().map((sup, idx) => (
                   <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                         <span className="font-bold text-sm truncate max-w-[100px]">{sup.name}</span>
                      </div>
                      <span className="font-bold text-emerald-400 text-xs">R$ {sup.amount.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                   </div>
                 ))}
                 {getTopSuppliers().length === 0 && (
                   <p className="text-center text-slate-500 text-xs py-10">Nenhum dado de fornecedor.</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dre' && renderDRE()}
      {activeTab === 'projection' && renderProjection()}
      {activeTab === 'recurring' && renderRecurring()}
      {activeTab === 'audit' && renderAudit()}

      {activeTab === 'methods' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button onClick={() => handleOpenMethodModal()} className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all group">
                <Plus size={48} className="group-hover:scale-110 transition-transform"/>
                <span className="font-black text-xs uppercase tracking-widest">Configurar Taxas</span>
              </button>
              {paymentMethods.map(m => (
                <div key={m.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><CreditCard size={80}/></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">{m.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenMethodModal(m)} className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><Edit3 size={18}/></button>
                      <button onClick={() => handleDeleteMethod(m.id)} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <div className="space-y-4 relative z-10">
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
      
      {activeTab === 'conciliation' && renderConciliation()}

      {/* Modal Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">Lançamento Financeiro</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
             </div>
             <div className="space-y-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setForm({...form, type: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${form.type === 'EXPENSE' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Saída (Despesa)</button>
                  <button onClick={() => setForm({...form, type: 'INCOME'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${form.type === 'INCOME' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Entrada (Receita)</button>
                </div>
                
                <input type="text" placeholder="Descrição da Transação" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black outline-none" />
                
                {form.type === 'EXPENSE' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Fornecedor (Opcional)</label>
                    <input type="text" placeholder="Ex: Atacadão, Coca-Cola..." value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-bold text-slate-700 outline-none" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <input type="number" placeholder="Valor R$" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-xl" />
                   <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black" />
                </div>

                <div className="border-t border-slate-100 pt-6">
                   <label className="flex items-center gap-3 w-full p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer transition-all bg-slate-50">
                      <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                      <Upload size={24} />
                      <span className="font-bold text-xs uppercase tracking-widest">{form.attachment_url ? 'Arquivo Anexado' : 'Anexar Comprovante/NF'}</span>
                   </label>
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

      {/* Visualizador de Anexo */}
      {viewAttachment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-4 shadow-2xl relative">
              <button onClick={() => setViewAttachment(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={24}/></button>
              <div className="p-8 flex flex-col items-center">
                 <h3 className="font-black text-xl mb-4 text-slate-800">Visualização de Comprovante</h3>
                 {viewAttachment.startsWith('data:image') ? (
                   <img src={viewAttachment} alt="Comprovante" className="max-h-[60vh] rounded-xl shadow-md border border-slate-200" />
                 ) : (
                   <div className="p-12 text-center bg-slate-50 rounded-2xl w-full">
                     <FileText size={64} className="mx-auto text-slate-400 mb-4" />
                     <p className="font-bold text-slate-500">Arquivo PDF ou Formato não visualizável diretamente.</p>
                     <a href={viewAttachment} download="comprovante" className="mt-4 inline-block text-emerald-600 font-black uppercase text-xs hover:underline">Baixar Arquivo</a>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal Nova Conta Recorrente */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">Nova Conta Recorrente</h3>
                <button onClick={() => setIsRecurringModalOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Tipo de Conta</label>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {['Aluguel', 'Energia Elétrica', 'Água', 'Impostos', 'Sistema/Software', 'Contador'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setRecurringForm({...recurringForm, title: type})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${recurringForm.title === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Outro (Digite o nome)" value={recurringForm.title} onChange={e => setRecurringForm({...recurringForm, title: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Categoria Financeira</label>
                  <select value={recurringForm.category} onChange={e => setRecurringForm({...recurringForm, category: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black outline-none">
                    <option value="UTILITY">Contas de Consumo (Água/Luz)</option>
                    <option value="FEES">Impostos e Taxas</option>
                    <option value="OTHER">Aluguel e Estrutura</option>
                    <option value="SERVICE">Serviços Terceirizados</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Valor Estimado</label>
                    <input type="number" value={recurringForm.amount} onChange={e => setRecurringForm({...recurringForm, amount: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Dia Vencimento</label>
                    <input type="number" min="1" max="31" value={recurringForm.day_of_month} onChange={e => setRecurringForm({...recurringForm, day_of_month: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black text-center" />
                  </div>
                </div>
                
                <button onClick={handleSaveRecurring} disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all">Salvar Modelo</button>
             </div>
           </div>
        </div>
      )}

      {/* Modal Adquirente */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">{editingMethodId ? 'Editar' : 'Novo'} Método</h3>
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
