
import React, { useState, useEffect } from 'react';
import { 
  Utensils, Beer, Wine, Plus, Minus, ShoppingCart, 
  Trash2, Printer, CheckCircle2, ChevronRight,
  Search, X, Loader2, Pizza, Soup, CookingPot, Coffee,
  Store, Bike, Phone, MapPin, History, CreditCard,
  Timer, Navigation, MessageSquare, PlusCircle, CheckSquare,
  Smartphone as MobileIcon, Monitor as MonitorIcon, DollarSign,
  AlertTriangle, Landmark, QrCode, Sparkles, Filter, User, ChevronLeft, Layers, Lock,
  Undo2, UserPlus, UserCheck, MessageSquareQuote, FileBadge, Fingerprint, PlusSquare
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { MenuProduct, ProductCategory, TableSession, OrderItem, Customer, OrderType, OrderStatus } from '../types';

interface POSProps {
  onOpenCashier?: () => void;
  userName?: string;
  userId?: string;
}

const MOCK_MENU: MenuProduct[] = [
  { id: 'b1', name: 'Pizza Grande', price: 0, category: 'PIZZAS', is_pizza_base: true, max_flavors: 3, ncm: '21069090' },
  { id: 'b2', name: 'Pizza Individual', price: 0, category: 'PIZZAS', is_pizza_base: true, max_flavors: 2, ncm: '21069090' },
  { id: 's1', name: 'Mussarela', price: 45.00, category: 'SABORES_PIZZA', ncm: '21069090' },
  { id: 's2', name: 'Calabresa', price: 54.00, category: 'SABORES_PIZZA', ncm: '21069090' },
  { id: 's3', name: 'Portuguesa', price: 60.00, category: 'SABORES_PIZZA', ncm: '21069090' },
  { id: 's4', name: 'Frango Catupiry', price: 58.00, category: 'SABORES_PIZZA', ncm: '21069090' },
  { id: 's5', name: 'Camarão Especial', price: 90.00, category: 'SABORES_PIZZA', ncm: '21069090' },
  { id: 'e1', name: 'Bruschetta', price: 28.00, category: 'ENTRADAS', ncm: '21069090' },
  { id: 'd1', name: 'Coca-Cola 2L', price: 14.00, category: 'BEBIDAS', ncm: '22021000' },
  { id: 'bo1', name: 'Borda Catupiry', price: 10.00, category: 'BORDAS', ncm: '21069090' },
  { id: 'bo2', name: 'Borda Chocolate', price: 12.00, category: 'BORDAS', ncm: '21069090' },
];

const DELIVERY_REGIONS = [
  { name: 'Centro', fee: 5.00 },
  { name: 'Bairro Norte', fee: 8.00 },
  { name: 'Bairro Sul', fee: 12.00 },
  { name: 'Condomínios', fee: 18.00 },
];

const POS: React.FC<POSProps> = ({ onOpenCashier, userName, userId }) => {
  const [view, setView] = useState<'SALON' | 'DELIVERY' | 'MONITOR' | 'ORDER' | 'HISTORY'>('SALON');
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('PIZZAS');
  
  // Chaves de Persistência
  const TABLES_STORAGE_KEY = `COUNTER_TABLES_STATE_${userId || 'GENERIC'}`;
  const CASHIER_STORAGE_KEY = `RETRY_SESSION_${userId || 'GENERIC'}`;

  // Persistência de Dados
  const [tables, setTables] = useState<TableSession[]>([]);
  const [activeOrders, setActiveOrders] = useState<TableSession[]>([]); 
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  
  // Seleção Atual
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cancelledInSession, setCancelledInSession] = useState<OrderItem[]>([]);

  // Campos de Auditoria de Venda
  const [vendaOperator, setVendaOperator] = useState(userName || '');
  const [vendaMotoboy, setVendaMotoboy] = useState('');
  
  // Fiscal State
  const [vendaCpf, setVendaCpf] = useState('');
  const [emitirNFCe, setEmitirNFCe] = useState(true);

  // Pizza Builder
  const [pizzaStep, setPizzaStep] = useState<'IDLE' | 'PARTS' | 'FLAVORS' | 'BORDERS' | 'NOTES'>('IDLE');
  const [pizzaDraft, setPizzaDraft] = useState<{ 
    base: MenuProduct | null, 
    parts: number, 
    flavors: MenuProduct[],
    border: MenuProduct | null,
    notes: string
  }>({ base: null, parts: 1, flavors: [], border: null, notes: '' });
  
  // CRM
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ name: '', phone: '', address: '', region: 'Centro', cpf_cnpj: '' });
  const [crmResults, setCrmResults] = useState<Customer[]>([]);
  const [isSearchingCrm, setIsSearchingCrm] = useState(false);

  // Auditoria e Financeiro
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isClosingTable, setIsClosingTable] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'DEBIT' | 'PIX'>('CASH');
  const [isCashierOpen, setIsCashierOpen] = useState(false);

  // 1. Inicialização e Recuperação de Estado
  useEffect(() => {
    const savedTables = localStorage.getItem(TABLES_STORAGE_KEY);
    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      const initialTables: TableSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `table-${i + 1}`,
        type: 'DINE_IN',
        table_number: i + 1,
        status: 'AVAILABLE',
        items: [],
        cancelled_items: [],
        opened_at: '',
        use_service_charge: true
      }));
      setTables(initialTables);
    }
    checkCashierStatus();
  }, [userId]);

  // Sincronização de Mesas
  useEffect(() => {
    if (tables.length > 0) {
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
      // Filtra pedidos ativos para o monitor (que não são DINE_IN ou que estão em produção)
      const pendingDelivery = tables.filter(t => t.type !== 'DINE_IN' && t.status !== 'COMPLETED' && t.status !== 'AVAILABLE');
      setActiveOrders(pendingDelivery);
    }
  }, [tables]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      checkCashierStatus();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (view === 'HISTORY') fetchHistory();
  }, [view]);

  const checkCashierStatus = () => {
    const savedSession = localStorage.getItem(CASHIER_STORAGE_KEY);
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setIsCashierOpen(data.step === 'ACTIVE');
    } else {
      setIsCashierOpen(false);
    }
  };

  const handleAddTable = () => {
    const nextNumber = tables.length + 1;
    const newTable: TableSession = {
      id: `table-${nextNumber}`,
      type: 'DINE_IN',
      table_number: nextNumber,
      status: 'AVAILABLE',
      items: [],
      cancelled_items: [],
      opened_at: '',
      use_service_charge: true
    };
    setTables([...tables, newTable]);
  };

  const fetchHistory = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('due_date', today)
      .ilike('description', 'PDV [%')
      .order('created_at', { ascending: false });
    if (data) setCompletedHistory(data);
  };

  const searchCustomer = async (term: string) => {
    if (term.length < 3) { setCrmResults([]); return; }
    setIsSearchingCrm(true);
    try {
      const { data } = await supabase.from('customers').select('*').or(`name.ilike.%${term}%,phone.ilike.%${term}%`).limit(5);
      setCrmResults(data || []);
    } finally { setIsSearchingCrm(false); }
  };

  const startDelivery = () => {
    if (!customerForm.name || !customerForm.phone) return alert("Dados do cliente incompletos.");
    const fee = DELIVERY_REGIONS.find(r => r.name === customerForm.region)?.fee || 0;
    const session: TableSession = {
      id: `del-${Date.now()}`,
      type: 'DELIVERY',
      status: 'PREPARING',
      customer: { ...customerForm } as Customer,
      items: [],
      cancelled_items: [],
      opened_at: new Date().toISOString(),
      use_service_charge: false,
      delivery_fee: fee
    };
    setSelectedSession(session);
    setCart([]);
    setVendaCpf(customerForm.cpf_cnpj || '');
    setCancelledInSession([]);
    setView('ORDER');
  };

  const startCounter = () => {
    const session: TableSession = {
      id: `cnt-${Date.now()}`,
      type: 'COUNTER',
      status: 'PREPARING',
      customer: customerForm.name ? ({ ...customerForm } as Customer) : undefined,
      items: [],
      cancelled_items: [],
      opened_at: new Date().toISOString(),
      use_service_charge: false
    };
    setSelectedSession(session);
    setCart([]);
    setVendaCpf(customerForm.cpf_cnpj || '');
    setCancelledInSession([]);
    setView('ORDER');
  };

  const calculateSubtotal = (items: OrderItem[]) => items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const finalizePizza = () => {
    if (!pizzaDraft.base) return;
    const flavorPrices = pizzaDraft.flavors.map(f => f.price);
    const maxFlavorPrice = flavorPrices.length > 0 ? Math.max(...flavorPrices) : 0;
    const borderPrice = pizzaDraft.border ? pizzaDraft.border.price : 0;
    const totalPrice = maxFlavorPrice + borderPrice;
    const flavorNames = pizzaDraft.flavors.map(f => f.name);
    const pizzaName = `${pizzaDraft.base.name} (${flavorNames.join(' / ')})${pizzaDraft.border ? ` + ${pizzaDraft.border.name}` : ''}`;

    const newPizzaItem: OrderItem = {
      product_id: pizzaDraft.base.id,
      name: pizzaName,
      quantity: 1,
      price: totalPrice,
      flavors: flavorNames,
      is_pizza: true,
      sent_to_kitchen: false,
      notes: pizzaDraft.notes
    };

    setCart([...cart, newPizzaItem]);
    setPizzaStep('IDLE');
    setPizzaDraft({ base: null, parts: 1, flavors: [], border: null, notes: '' });
    setActiveCategory('PIZZAS');
  };

  const handleSendOrder = () => {
    if (!selectedSession || cart.length === 0) return;
    const itemsWithSent = cart.map(i => ({ ...i, sent_to_kitchen: true }));
    const updated: TableSession = { 
      ...selectedSession, 
      items: itemsWithSent, 
      cancelled_items: cancelledInSession,
      status: 'PREPARING',
      opened_at: selectedSession.opened_at || new Date().toISOString()
    };

    if (selectedSession.type === 'DINE_IN') {
      setTables(prevTables => prevTables.map(t => t.id === selectedSession.id ? { ...updated, status: 'OCCUPIED' } : t));
      alert("Pedido enviado para a cozinha!");
      setView('SALON');
    } else {
      setTables(prev => [updated, ...prev]);
      alert("Pedido enviado para produção!");
      setView('MONITOR');
    }
    setSelectedSession(null);
    setCart([]);
  };

  const handleFinalizeVenda = async () => {
    checkCashierStatus();
    if (!isCashierOpen) return alert("O Caixa não está aberto.");
    if (!vendaOperator) return alert("Informe o operador.");
    
    setLoading(true);
    const subtotal = calculateSubtotal(cart);
    const serviceCharge = selectedSession?.use_service_charge ? subtotal * 0.1 : 0;
    const total = subtotal + serviceCharge + (selectedSession?.delivery_fee || 0);

    try {
      const channel = selectedSession?.type;
      const clientName = selectedSession?.customer?.name || `Mesa ${selectedSession?.table_number}`;
      const motoboyActual = selectedSession?.motoboy_name || vendaMotoboy;
      const methodMap: Record<string, string> = { 'CASH': 'DINHEIRO', 'PIX': 'PIX', 'CREDIT': 'CRÉDITO', 'DEBIT': 'DÉBITO' };
      const methodLabel = methodMap[paymentMethod] || paymentMethod;
      const auditDesc = `PDV [${channel}]: ${clientName} | Op: ${vendaOperator} | Moto: ${motoboyActual || 'N/A'} - Canal: ${methodLabel} ${emitirNFCe ? '[PEDIDO NFC-e]' : ''}`;
      
      const mockFiscalData = emitirNFCe ? {
        nf_status: 'QUEUED',
        nf_key: vendaCpf ? `CPF:${vendaCpf}-${Date.now()}` : `AUTO-${Date.now()}`
      } : {};

      const { error: txError } = await supabase.from('financial_transactions').insert([{
        type: 'INCOME',
        category: 'OTHER',
        description: auditDesc,
        amount: total,
        due_date: new Date().toISOString().split('T')[0],
        status: paymentMethod === 'CASH' || paymentMethod === 'PIX' ? 'PAID' : 'PENDING',
        ...mockFiscalData
      }]);

      if (txError) throw txError;

      if (selectedSession?.type === 'DINE_IN') {
        setTables(prev => prev.map(t => t.id === selectedSession.id ? { 
          id: t.id,
          table_number: t.table_number,
          type: 'DINE_IN',
          status: 'AVAILABLE', 
          items: [], 
          cancelled_items: [], 
          opened_at: '', 
          use_service_charge: true 
        } : t));
      } else {
        setTables(prev => prev.filter(o => o.id !== selectedSession?.id));
      }

      alert(emitirNFCe ? "Venda finalizada! NFC-e em processamento..." : "Venda finalizada com sucesso!");
      setIsClosingTable(false);
      setView('SALON');
      setSelectedSession(null);
      setCart([]);
      setVendaMotoboy('');
      setVendaCpf('');
      fetchHistory();
    } catch (err: any) { alert("Erro ao finalizar: " + err.message); }
    finally { setLoading(false); }
  };

  // --- RENDERIZADORES ---

  const renderSalon = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in">
       {tables.filter(t => t.type === 'DINE_IN').map(table => {
         const isOccupied = table.status === 'OCCUPIED' || table.items.length > 0;
         const subtotal = calculateSubtotal(table.items);
         const elapsed = table.opened_at ? Math.floor((now.getTime() - new Date(table.opened_at).getTime()) / 60000) : 0;
         return (
           <div key={table.id} onClick={() => { setSelectedSession(table); setCart(table.items); setCancelledInSession(table.cancelled_items || []); setVendaOperator(userName || ''); setView('ORDER'); }}
             className={`p-10 rounded-[3rem] border-2 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isOccupied ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-400'}`}
           >
              <div className={`p-4 rounded-2xl ${isOccupied ? 'bg-white/10' : 'bg-slate-50'}`}><Utensils size={32}/></div>
              <div className="text-center">
                 <h4 className="font-black text-2xl tracking-tighter">Mesa {table.table_number}</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {isOccupied ? `${elapsed}min • R$ ${subtotal.toFixed(2)}` : 'Livre'}
                 </p>
              </div>
           </div>
         );
       })}
       
       <button onClick={handleAddTable} className="p-10 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50/50 group">
          <PlusSquare size={48} className="group-hover:scale-110 transition-transform" />
          <span className="font-black uppercase text-[10px] tracking-widest">Adicionar Mesa</span>
       </button>
    </div>
  );

  const renderDeliveryCRM = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
       <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border focus-within:border-indigo-400 transition-all">
             <Search className="text-slate-400" />
             <input type="text" placeholder="Buscar cliente por telefone ou nome..." className="bg-transparent flex-1 font-black text-lg outline-none" onChange={(e) => searchCustomer(e.target.value)} />
             {isSearchingCrm && <Loader2 className="animate-spin text-indigo-500" />}
          </div>

          {crmResults.length > 0 && (
            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Clientes Encontrados</p>
               {crmResults.map(c => (
                 <div key={c.id} onClick={() => setCustomerForm(c)} className="p-6 bg-slate-50 rounded-2xl border hover:border-indigo-400 cursor-pointer flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">{c.name[0]}</div>
                       <div><p className="font-black text-slate-800">{c.name}</p><p className="text-xs font-bold text-slate-400">{c.phone}</p></div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                 </div>
               ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
             <div className="space-y-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><User size={20} className="text-indigo-500" /> Identificação</h4>
                <input type="text" placeholder="Nome do Cliente" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" />
                <input type="text" placeholder="WhatsApp / Celular" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" />
                <input type="text" placeholder="CPF/CNPJ na Nota (Opcional)" value={customerForm.cpf_cnpj} onChange={e => setCustomerForm({...customerForm, cpf_cnpj: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" />
             </div>
             <div className="space-y-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><MapPin size={20} className="text-indigo-500" /> Endereço</h4>
                <input type="text" placeholder="Rua, Número, Bairro" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" />
                <select value={customerForm.region} onChange={e => setCustomerForm({...customerForm, region: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-black">
                   {DELIVERY_REGIONS.map(r => <option key={r.name} value={r.name}>{r.name} (R$ {r.fee.toFixed(2)})</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <button onClick={startCounter} className="py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 flex items-center justify-center gap-3">
               <Store size={20} /> Balcão
             </button>
             <button onClick={startDelivery} className="py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-3">
               <Bike size={20} /> Delivery
             </button>
          </div>
       </div>
    </div>
  );

  const renderMonitor = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
       {tables.filter(t => t.type !== 'DINE_IN' && t.status !== 'AVAILABLE').map(order => (
          <div key={order.id} className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
             <div className={`p-6 flex justify-between items-center ${order.status === 'PREPARING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                <div>
                   <h4 className="font-black text-lg uppercase tracking-tight">{order.type}</h4>
                   <p className="text-[10px] font-black uppercase opacity-80">{order.customer?.name || 'Venda Balcão'}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl"><Timer size={24}/></div>
             </div>
             <div className="p-8 flex-1 space-y-4">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                     <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">{it.quantity}x {it.name}</p>
                        {it.flavors && <p className="text-[10px] text-slate-400 font-bold">{it.flavors.join(' / ')}</p>}
                     </div>
                  </div>
                ))}
             </div>
             <div className="p-6 bg-slate-50 flex gap-2">
                <button onClick={() => { setSelectedSession(order); setCart(order.items); setView('ORDER'); }} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[10px]">Ver Pedido</button>
                <button onClick={() => { setSelectedSession(order); setCart(order.items); setIsClosingTable(true); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Baixar / Pago</button>
             </div>
          </div>
       ))}
       {tables.filter(t => t.type !== 'DINE_IN' && t.status !== 'AVAILABLE').length === 0 && (
         <div className="col-span-full py-32 text-center opacity-30 flex flex-col items-center gap-4">
            <CookingPot size={64}/>
            <p className="font-black uppercase tracking-widest text-sm">Nenhum pedido em produção no momento.</p>
         </div>
       )}
    </div>
  );

  return (
    <div className="pb-24">
      {isClosingTable && selectedSession && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[90vh]">
              <div className="p-10 border-b flex justify-between items-center bg-white shrink-0">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsClosingTable(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><ChevronLeft/></button>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Recebimento de Venda</h3>
                 </div>
                 <button onClick={() => setIsClosingTable(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={32}/></button>
              </div>
              
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={100}/></div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Total a Receber</p>
                         <p className="text-6xl font-black tracking-tighter">R$ {(calculateSubtotal(cart) + (selectedSession.use_service_charge ? calculateSubtotal(cart)*0.1 : 0) + (selectedSession.delivery_fee || 0)).toFixed(2)}</p>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                         <div className="flex justify-between items-center">
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><FileBadge className="text-indigo-500" size={18}/> Fiscal NFC-e</h4>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-slate-400 uppercase">{emitirNFCe ? 'Habilitada' : 'Sem Nota'}</span>
                               <input type="checkbox" checked={emitirNFCe} onChange={e => setEmitirNFCe(e.target.checked)} className="w-10 h-5 bg-indigo-600 rounded-full appearance-none checked:bg-indigo-600 relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all bg-slate-300" />
                            </div>
                         </div>
                         
                         {emitirNFCe && (
                           <div className="space-y-2 animate-in slide-in-from-top-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Identificar Cliente (CPF/CNPJ)</label>
                              <div className="relative">
                                 <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                 <input 
                                   type="text" 
                                   value={vendaCpf} 
                                   onChange={e => setVendaCpf(e.target.value)}
                                   placeholder="000.000.000-00 (Opcional)" 
                                   className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" 
                                 />
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Operador Responsável</label>
                            <div className="relative">
                               <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                               <input type="text" value={vendaOperator} onChange={e => setVendaOperator(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Meio de Pagamento</p>
                      <div className="grid grid-cols-2 gap-4">
                         {[{id:'CASH',l:'Dinheiro',i:DollarSign},{id:'PIX',l:'PIX',i:QrCode},{id:'CREDIT',l:'Crédito',i:CreditCard},{id:'DEBIT',l:'Débito',i:Landmark}].map(m=>(<button key={m.id} onClick={()=>setPaymentMethod(m.id as any)} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod===m.id?'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]':'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}><m.i size={32}/><span className="font-black text-[10px] uppercase tracking-widest">{m.l}</span></button>))}
                      </div>
                      <button onClick={handleFinalizeVenda} disabled={loading} className="w-full py-8 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                        {loading ? <Loader2 className="animate-spin" /> : <CheckSquare size={28} />}
                        Confirmar e Finalizar
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Header Unificado */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div><h2 className="text-4xl font-black text-slate-800 tracking-tight">Terminal de Vendas</h2></div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border shadow-sm flex-wrap gap-1">
           <button onClick={() => setView('SALON')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'SALON' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Mapa Salão</button>
           <button onClick={() => setView('DELIVERY')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'DELIVERY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Delivery</button>
           <button onClick={() => setView('MONITOR')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'MONITOR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Pedidos em Aberto</button>
           <button onClick={() => setView('HISTORY')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'HISTORY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Vendas de Hoje</button>
        </div>
      </header>

      {view === 'SALON' && renderSalon()}
      {view === 'DELIVERY' && renderDeliveryCRM()}
      {view === 'MONITOR' && renderMonitor()}
      {view === 'HISTORY' && (
        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm animate-in fade-in">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-bold text-slate-700">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                       <th className="px-10 py-6">Canal / Cliente</th>
                       <th className="px-10 py-6">Horário</th>
                       <th className="px-10 py-6">Pagamento</th>
                       <th className="px-10 py-6 text-right">Valor</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {completedHistory.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">{tx.description}</td>
                        <td className="px-10 py-6 text-slate-400">{new Date(tx.created_at).toLocaleTimeString()}</td>
                        <td className="px-10 py-6"><span className="bg-slate-100 px-3 py-1 rounded-lg uppercase text-[9px] font-black">{tx.status === 'PAID' ? 'Realizado' : 'Aguardando'}</span></td>
                        <td className="px-10 py-6 text-right font-black text-emerald-600">R$ {tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
      
      {/* POS Order Mode (Carrinho e Menu) */}
      {view === 'ORDER' && selectedSession && (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in">
           <div className="flex-1 space-y-6">
              <div className="flex bg-white p-2 rounded-[2rem] border shadow-sm gap-2 overflow-x-auto">
                 {[{id:'PIZZAS', l:'Bases', i:Pizza}, {id:'SABORES_PIZZA', l:'Sabores', i:Sparkles}, {id:'BORDAS', l:'Bordas', i:Layers}, {id:'ENTRADAS', l:'Entradas', i:Soup}, {id:'BEBIDAS', l:'Bebidas', i:Coffee}].map(cat => (
                   <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>
                      <cat.i size={16}/> {cat.l}
                   </button>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                 {MOCK_MENU.filter(p => p.category === activeCategory).map(prod => (
                   <div key={prod.id} className="bg-white p-6 rounded-[2.5rem] border hover:border-indigo-400 flex justify-between items-center transition-all group shadow-sm">
                      <div><p className="font-black text-slate-800 text-lg tracking-tight">{prod.name}</p><p className="text-emerald-600 font-black text-xs">R$ {prod.price.toFixed(2)}</p></div>
                      <button onClick={() => {
                        if(prod.is_pizza_base) { setPizzaDraft({base:prod, parts:1, flavors:[], border:null, notes: ''}); setPizzaStep('PARTS'); }
                        else if(activeCategory === 'SABORES_PIZZA') { if(pizzaDraft.flavors.length < pizzaDraft.parts) setPizzaDraft({...pizzaDraft, flavors: [...pizzaDraft.flavors, prod]}); }
                        else if(activeCategory === 'BORDAS') { setPizzaDraft({...pizzaDraft, border: prod}); setPizzaStep('NOTES'); }
                        else setCart([...cart, {product_id:prod.id, name:prod.name, price:prod.price, quantity:1, sent_to_kitchen: false}]);
                      }} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${pizzaDraft.flavors.find(f => f.id === prod.id) ? 'bg-emerald-50 text-white' : 'bg-slate-900 text-white'}`}>
                        {pizzaDraft.flavors.find(f => f.id === prod.id) ? <CheckCircle2 size={24}/> : <Plus/>}
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="w-full lg:w-[400px] bg-white rounded-[3rem] border shadow-2xl flex flex-col h-[750px] overflow-hidden sticky top-24">
              <div className="p-8 bg-slate-900 text-white shrink-0 flex justify-between items-center">
                 <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">{selectedSession.type}</h3>
                   <p className="text-[10px] font-black uppercase text-emerald-400">{selectedSession.customer?.name || `Mesa ${selectedSession.table_number}`}</p>
                 </div>
                 <button onClick={() => { setSelectedSession(null); setView('SALON'); }} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 custom-scrollbar">
                 {cart.map((it, idx) => (
                   <div key={idx} className="bg-white p-5 rounded-[2rem] border flex justify-between items-center group shadow-sm">
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">{it.quantity}x {it.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor: R$ {it.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0 ml-4"><Trash2 size={18}/></button>
                   </div>
                 ))}
              </div>
              <div className="p-8 border-t bg-white space-y-4 shrink-0 shadow-inner">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Líquido</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {(calculateSubtotal(cart) + (selectedSession.use_service_charge ? calculateSubtotal(cart)*0.1 : 0) + (selectedSession.delivery_fee || 0)).toFixed(2)}</span>
                 </div>
                 <div className="grid grid-cols-1 gap-2 pt-2">
                    <button onClick={handleSendOrder} disabled={cart.length === 0} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-xl">Lançar Cozinha</button>
                    <button onClick={() => { checkCashierStatus(); setIsClosingTable(true); }} disabled={cart.length === 0} className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-xl">Receber Pagamento</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
