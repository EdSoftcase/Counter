
import React, { useState, useEffect } from 'react';
import { 
  Utensils, ShoppingCart, Trash2, CheckCircle2, ChevronRight,
  X, Loader2, Pizza, Soup, CookingPot, Coffee,
  Timer, PlusCircle, CheckSquare, DollarSign, Sparkles, User, 
  ChevronLeft, Layers, ArrowLeft, UtensilsCrossed, Bike, Monitor, History,
  UserPlus, MapPin, QrCode, CreditCard, Landmark, Check, Send, Beer, Search, MessageSquare,
  Filter, RefreshCw, Calculator, Plus, Trash, Info, UserMinus, UserPlus2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { MenuProduct, ProductCategory, TableSession, OrderItem, Customer, OrderType, OrderStatus } from '../types';

const MOCK_MENU: MenuProduct[] = [
  { id: 'p1', name: 'Pizza Individual', price: 0, category: 'PIZZAS', description: 'Até 2 sabores', is_pizza_base: true, max_flavors: 2 },
  { id: 'p2', name: 'Pizza Grande', price: 0, category: 'PIZZAS', description: 'Até 3 sabores', is_pizza_base: true, max_flavors: 3 },
  { id: 's1', name: 'Mussarela', price: 45.00, category: 'SABORES_PIZZA', description: 'Molho de tomate, muçarela e orégano' },
  { id: 's2', name: 'Calabresa', price: 54.00, category: 'SABORES_PIZZA', description: 'Muçarela, calabresa fatiada e cebola' },
  { id: 's3', name: 'Portuguesa', price: 60.00, category: 'SABORES_PIZZA', description: 'Muçarela, presunto, ovos, cebola e ervilha' },
  { id: 's4', name: 'Frango c/ Catupiry', price: 65.00, category: 'SABORES_PIZZA', description: 'Frango desfiado e legítimo catupiry' },
  { id: 'e1', name: 'Bruschetta', price: 28.00, category: 'ENTRADAS', description: 'Pão italiano, tomate, alho e manjericão' },
  { id: 'd1', name: 'Coca-Cola 2L', price: 14.00, category: 'BEBIDAS', description: 'Refrigerante 2 litros' },
  { id: 'd2', name: 'Suco Natural', price: 10.00, category: 'BEBIDAS', description: 'Copo 500ml' },
  { id: 'bo1', name: 'Borda Catupiry', price: 10.00, category: 'BORDAS' },
  { id: 'bo2', name: 'Borda Cheddar', price: 12.00, category: 'BORDAS' },
];

const QUICK_NOTES = ["Sem cebola", "Bem assada", "Bem quente", "Pouco queijo", "Caprichar no molho", "Massa fina", "Cortar em 12 fatias"];

const MOTOBOYS = ["Carlos Oliveira", "Marcos Silva", "João Delivery", "Rafa Motos", "Próprio Estabelecimento"];

const PAYMENT_METHODS = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX", "Vale Refeição"];

const DELIVERY_REGIONS = [
  { name: 'Centro', fee: 5.00 },
  { name: 'Bairro Norte', fee: 8.00 },
  { name: 'Bairro Sul', fee: 12.00 },
];

const POS: React.FC<any> = ({ userName, userId }) => {
  const [view, setView] = useState<'SALON' | 'DELIVERY' | 'COUNTER' | 'SELF_SERVICE' | 'MONITOR' | 'ORDER' | 'HISTORY'>('SALON');
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('PIZZAS');
  
  const TABLES_STORAGE_KEY = `COUNTER_TABLES_V5_${userId || 'GENERIC'}`;
  const [tables, setTables] = useState<TableSession[]>([]);
  const [historySales, setHistorySales] = useState<any[]>([]);
  const isLoaded = React.useRef(false);
  
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isClosingTable, setIsClosingTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Split Payment State
  const [payments, setPayments] = useState<{ method: string, amount: number, is_tip?: boolean }[]>([]);
  const [currentPayMethod, setCurrentPayMethod] = useState(PAYMENT_METHODS[0]);
  const [currentPayAmount, setCurrentPayAmount] = useState<number>(0);
  const [selectedMotoboy, setSelectedMotoboy] = useState(MOTOBOYS[0]);

  // Wizard de Pizza
  const [pizzaStep, setPizzaStep] = useState<'IDLE' | 'FLAVORS' | 'BORDERS'>('IDLE');
  const [pizzaDraft, setPizzaDraft] = useState<{ 
    base: MenuProduct | null, 
    flavors: MenuProduct[],
    border: MenuProduct | null,
    notes: string
  }>({ base: null, flavors: [], border: null, notes: '' });

  // CRM Delivery
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ name: '', phone: '', address: '', region: 'Centro' });

  useEffect(() => {
    isLoaded.current = false;
    const loadTables = () => {
      const saved = localStorage.getItem(TABLES_STORAGE_KEY);
      let currentTables: TableSession[] = [];
      
      try {
        if (saved) {
          currentTables = JSON.parse(saved);
          if (!Array.isArray(currentTables)) currentTables = [];
        }
      } catch (e) {
        console.error("Erro ao carregar mesas:", e);
        currentTables = [];
      }

      // Garante que existam 50 mesas de salão (DINE_IN)
      const salonTables = currentTables.filter(t => t.type === 'DINE_IN');
      if (salonTables.length < 50) {
        const existingTableNumbers = new Set(salonTables.map(t => t.table_number));
        const newSalonTables: TableSession[] = [];
        
        for (let i = 1; i <= 50; i++) {
          if (!existingTableNumbers.has(i)) {
            newSalonTables.push({
              id: `table-${i}`,
              type: 'DINE_IN',
              table_number: i,
              status: 'AVAILABLE',
              items: [],
              use_service_charge: true,
              opened_at: ''
            });
          }
        }
        currentTables = [...currentTables, ...newSalonTables].sort((a, b) => {
          if (a.type === 'DINE_IN' && b.type === 'DINE_IN') return (a.table_number || 0) - (b.table_number || 0);
          return 0;
        });
      }
      
      setTables(currentTables);
      isLoaded.current = true;
    };

    loadTables();
    fetchHistory();

    // Sincronização em tempo real entre abas/totem
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TABLES_STORAGE_KEY) {
        loadTables();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId, TABLES_STORAGE_KEY]);

  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
    }
  }, [tables, TABLES_STORAGE_KEY]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .in('category', ['OTHER'])
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setHistorySales(data);
  };

  // Busca automática de cliente por telefone
  useEffect(() => {
    const search = async () => {
      if (customerForm.phone && customerForm.phone.replace(/\D/g, '').length >= 10) {
        setSearchingCustomer(true);
        try {
          const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', customerForm.phone)
            .maybeSingle();
          
          if (data) {
            setCustomerForm({
              name: data.name,
              phone: data.phone,
              address: data.address,
              region: data.region || 'Centro'
            });
          }
        } finally {
          setSearchingCustomer(false);
        }
      }
    };
    const timer = setTimeout(search, 800);
    return () => clearTimeout(timer);
  }, [customerForm.phone]);

  const handleSendOrder = () => {
    if (!selectedSession || cart.length === 0) return;
    
    const routedItems = cart.map(item => {
      const product = MOCK_MENU.find(m => m.id === item.product_id);
      const isDrink = product?.category === 'BEBIDAS' || product?.category === 'VINHOS';
      return { 
        ...item, 
        sent_to_kitchen: true,
        routing_tag: isDrink ? 'COPA' : 'COZINHA' 
      };
    });

    const now = new Date().toISOString();
    const tableId = selectedSession.id;

    // Imprimir Comanda da Cozinha
    const printContent = `
      <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 5px;">COZINHA / COPA</h2>
        <h3 style="text-align: center; font-size: 18px; margin-top: 0;">${selectedSession.type === 'DINE_IN' ? `MESA ${selectedSession.table_number}` : selectedSession.type === 'COUNTER' ? 'BALCÃO' : 'DELIVERY'}</h3>
        <p style="text-align: center; margin: 0;">${new Date().toLocaleString()}</p>
        <p style="text-align: center;">------------------------</p>
        ${routedItems.map(item => `
          <div style="margin-bottom: 10px; font-size: 16px;">
            <div style="font-weight: bold;">[${item.routing_tag}] ${item.quantity}x ${item.name}</div>
            ${item.notes ? `<div style="margin-left: 10px; font-style: italic;">OBS: ${item.notes}</div>` : ''}
          </div>
        `).join('')}
        <p style="text-align: center;">------------------------</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Comanda Cozinha</title></head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updated = {
          ...t,
          status: 'OCCUPIED' as OrderStatus,
          opened_at: t.opened_at || now,
          items: [...t.items, ...routedItems]
        };
        setSelectedSession(updated);
        return updated;
      }
      return t;
    }));

    setCart([]); 
    setSelectedSession(null);
    setView(selectedSession.type === 'DINE_IN' ? 'SALON' : 'DELIVERY');
    alert("Pedido enviado para produção!");
  };

  const startDelivery = () => {
    if (!customerForm.name || !customerForm.phone) return alert("Preencha Nome e Telefone.");
    const fee = DELIVERY_REGIONS.find(r => r.name === customerForm.region)?.fee || 0;
    
    const newSession: TableSession = {
      id: `del-${Date.now()}`,
      type: 'DELIVERY',
      status: 'PREPARING',
      customer: { ...customerForm } as Customer,
      items: [],
      opened_at: new Date().toISOString(),
      use_service_charge: false,
      delivery_fee: fee
    };

    setTables(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setCart([]);
    setView('ORDER');
  };

  const finalizePizza = () => {
    if (!pizzaDraft.base) return;
    
    const maxFlavorPrice = Math.max(...pizzaDraft.flavors.map(f => f.price), 0);
    const borderPrice = pizzaDraft.border?.price || 0;
    const total = maxFlavorPrice + borderPrice;
    
    const flavorNames = pizzaDraft.flavors.map(f => f.name);
    const fullName = `${pizzaDraft.base.name} (${flavorNames.join(' / ')})${pizzaDraft.border ? ` + ${pizzaDraft.border.name}` : ''}`;

    const newItem: OrderItem = {
      product_id: pizzaDraft.base.id,
      name: fullName,
      quantity: 1,
      price: total,
      flavors: flavorNames,
      is_pizza: true,
      sent_to_kitchen: false,
      notes: pizzaDraft.notes
    };

    setCart(prev => [...prev, newItem]);
    setPizzaStep('IDLE');
    setPizzaDraft({ base: null, flavors: [], border: null, notes: '' });
  };

  const toggleServiceCharge = () => {
    if (!selectedSession) return;
    const newState = !selectedSession.use_service_charge;
    setTables(prev => prev.map(t => t.id === selectedSession.id ? { ...t, use_service_charge: newState } : t));
    setSelectedSession({ ...selectedSession, use_service_charge: newState });
  };

  const handleFinalizeSale = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const itemsTotal = selectedSession.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const serviceCharge = selectedSession.use_service_charge ? itemsTotal * 0.10 : 0;
      const deliveryFee = selectedSession.delivery_fee || 0;
      const totalOrder = itemsTotal + serviceCharge + deliveryFee;

      // Separa Gorjetas de Pagamentos Normais
      const normalPayments = payments.filter(p => !p.is_tip);
      const tipPayments = payments.filter(p => p.is_tip);
      const totalTips = tipPayments.reduce((acc, p) => acc + p.amount, 0);

      const paymentsDesc = normalPayments.map(p => `${p.method}: R$ ${p.amount.toFixed(2)}`).join(' / ');
      const motoboyDesc = selectedSession.type === 'DELIVERY' ? ` | Entregador: ${selectedMotoboy}` : '';
      const serviceDesc = selectedSession.use_service_charge ? ` | Taxa Serviço (10%): R$ ${serviceCharge.toFixed(2)}` : ' | Sem Taxa Serviço';

      // 1. Transação da Venda (Apenas o valor pago no PDV, descontando o que já foi pago no Totem)
      const amountPaidAtPOS = normalPayments.reduce((acc, p) => acc + p.amount, 0);
      if (amountPaidAtPOS > 0) {
        const { error: saleError } = await supabase.from('financial_transactions').insert([{
          type: 'INCOME',
          category: 'OTHER',
          description: `Venda PDV [${selectedSession.type}]: ${selectedSession.customer?.name || `Mesa ${selectedSession.table_number}`} | Pagto: ${paymentsDesc}${motoboyDesc}${serviceDesc}`,
          amount: amountPaidAtPOS,
          due_date: new Date().toISOString().split('T')[0],
          status: 'PAID'
        }]);

        if (saleError) throw saleError;
      }

      // 2. Se houver gorjeta extra no checkout, lança transação separada
      if (totalTips > 0) {
        await supabase.from('financial_transactions').insert([{
          type: 'INCOME',
          category: 'OTHER',
          description: `GORJETA MOTOBOY: ${selectedMotoboy} | Ref Pedido: ${selectedSession.customer?.name || 'Venda'}`,
          amount: totalTips,
          due_date: new Date().toISOString().split('T')[0],
          status: 'PAID'
        }]);
      }

      // Limpar mesa ou remover delivery
      if (selectedSession.type === 'DINE_IN') {
        setTables(prev => prev.map(t => t.id === selectedSession.id ? { ...t, items: [], status: 'AVAILABLE', opened_at: '', use_service_charge: true } : t));
      } else {
        setTables(prev => prev.filter(t => t.id !== selectedSession.id));
      }

      alert("Venda finalizada com sucesso!");
      setIsClosingTable(false);
      setPayments([]);
      setSelectedSession(null);
      setCart([]);
      setView('SALON');
      fetchHistory();
    } catch (err: any) {
      alert("Erro ao finalizar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentPart = () => {
    if (currentPayAmount <= 0) return;
    
    const totalPaidBefore = payments.reduce((acc, p) => acc + p.amount, 0);
    const itemsTotal = (selectedSession?.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) || 0);
    const serviceCharge = selectedSession?.use_service_charge ? itemsTotal * 0.10 : 0;
    const totalOrder = itemsTotal + serviceCharge + (selectedSession?.delivery_fee || 0);
    const remainingBefore = totalOrder - totalPaidBefore;

    // Se o valor informado ultrapassar o que falta pagar
    if (currentPayAmount > remainingBefore && remainingBefore > 0) {
      const tipAmount = currentPayAmount - remainingBefore;
      if (confirm(`O valor de R$ ${currentPayAmount.toFixed(2)} é maior que o saldo restante (R$ ${remainingBefore.toFixed(2)}).\n\nA diferença de R$ ${tipAmount.toFixed(2)} é GORJETA para o motoboy?`)) {
        setPayments([
          ...payments, 
          { method: currentPayMethod, amount: remainingBefore },
          { method: `${currentPayMethod} (Gorjeta Extra)`, amount: tipAmount, is_tip: true }
        ]);
        setCurrentPayAmount(0);
        return;
      }
    }

    setPayments([...payments, { method: currentPayMethod, amount: currentPayAmount }]);
    setCurrentPayAmount(0);
  };

  const removePaymentPart = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  // Cálculos de Totais para Interface
  const itemsSubtotal = selectedSession ? selectedSession.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) : 0;
  const cartSubtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const totalItems = itemsSubtotal + cartSubtotal;
  const handleMarkItemReady = (tableId: string, itemIndex: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          items: t.items.map((it, idx) => {
            if (idx === itemIndex) {
              return { ...it, sent_to_kitchen: false }; // Remove from kitchen view by setting sent_to_kitchen to false
            }
            return it;
          })
        };
      }
      return t;
    }));
  };

  const currentServiceCharge = (selectedSession?.use_service_charge) ? (totalItems * 0.10) : 0;
  const totalSessionAmount = totalItems + currentServiceCharge + (selectedSession?.delivery_fee || 0);
  
  const totalPaid = payments.filter(p => !p.is_tip).reduce((acc, p) => acc + p.amount, 0) + (selectedSession?.paid_amount || 0);
  const totalTipsCalculated = payments.filter(p => p.is_tip).reduce((acc, p) => acc + p.amount, 0);
  const remainingAmount = Math.max(0, totalSessionAmount - totalPaid);

  return (
    <div className="pb-24">
      {/* Navegação Superior */}
      <div className="flex bg-white p-1.5 rounded-[2rem] border shadow-sm mb-10 overflow-x-auto gap-1">
         {[
           { id: 'SALON', label: 'Salão', icon: Utensils },
           { id: 'DELIVERY', label: 'Delivery', icon: Bike },
           { id: 'COUNTER', label: 'Balcão', icon: ShoppingCart },
           { id: 'SELF_SERVICE', label: 'Autoatendimento', icon: Monitor },
           { id: 'MONITOR', label: 'Monitor KDS', icon: CookingPot },
           { id: 'HISTORY', label: 'Histórico', icon: History }
         ].map(tab => (
           <button key={tab.id} onClick={() => setView(tab.id as any)} className={`px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
             <tab.icon size={16}/> {tab.label}
           </button>
         ))}
      </div>

      {/* VIEW: SALON */}
      {view === 'SALON' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in">
           {tables.filter(t => t.type === 'DINE_IN').length === 0 ? (
             <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 animate-pulse"><Utensils size={40}/></div>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma mesa configurada ou carregando...</p>
                <button onClick={() => window.location.reload()} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Recarregar Sistema</button>
             </div>
           ) : (
             tables.filter(t => t.type === 'DINE_IN').map(table => {
               const isOccupied = table.items.length > 0;
               const subtotal = table.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
               const serviceCharge = table.use_service_charge ? subtotal * 0.10 : 0;
               return (
                 <div key={table.id} onClick={() => { setSelectedSession(table); setCart([]); setView('ORDER'); }} className={`p-10 rounded-[3rem] border-2 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isOccupied ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-400'}`}>
                    <div className={`p-4 rounded-2xl ${isOccupied ? 'bg-white/10' : 'bg-slate-50'}`}><Utensils size={32}/></div>
                    <div className="text-center">
                       <h4 className="font-black text-2xl tracking-tighter">Mesa {table.table_number}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{isOccupied ? `R$ ${(subtotal + serviceCharge).toFixed(2)}` : 'Livre'}</p>
                    </div>
                 </div>
               );
             })
           )}
        </div>
      )}

      {/* VIEW: DELIVERY (CRM) */}
      {view === 'DELIVERY' && (
        <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
              <div className="flex justify-between items-center border-b pb-6">
                <div>
                   <h3 className="text-3xl font-black text-slate-800">Novo Delivery</h3>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Pedidos Externos</p>
                </div>
                {searchingCustomer && <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] bg-indigo-50 px-4 py-2 rounded-full animate-pulse uppercase"><Loader2 size={14} className="animate-spin"/> Buscando CRM...</div>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp / Telefone</label>
                  <input type="text" placeholder="(00) 00000-0000" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-indigo-600 outline-none focus:border-indigo-400 transition-all text-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Cliente</label>
                  <input type="text" placeholder="Nome Completo" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-lg outline-none focus:border-indigo-400 transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Endereço de Entrega</label>
                  <input type="text" placeholder="Rua, Número, Bairro, Complemento" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-lg outline-none focus:border-indigo-400 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Região de Entrega</label>
                  <select value={customerForm.region} onChange={e => setCustomerForm({...customerForm, region: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black outline-none appearance-none">
                    {DELIVERY_REGIONS.map(r => <option key={r.name} value={r.name}>{r.name} (R$ {r.fee.toFixed(2)})</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                   <button onClick={startDelivery} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                     <UserPlus size={20}/> Abrir Pedido Delivery
                   </button>
                </div>
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest ml-4">Entregas em Andamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {tables.filter(t => t.type === 'DELIVERY').map(del => (
                   <div key={del.id} onClick={() => { setSelectedSession(del); setCart([]); setView('ORDER'); }} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-400 cursor-pointer transition-all shadow-sm group">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Bike size={24}/></div>
                         <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase">Ativo</span>
                      </div>
                      <h5 className="font-black text-slate-800 text-xl truncate">{del.customer?.name}</h5>
                      <p className="text-slate-400 font-bold text-xs mt-1">{del.customer?.phone}</p>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                         <span className="text-2xl font-black text-slate-900">R$ {(del.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) + (del.delivery_fee || 0)).toFixed(2)}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* VIEW: COUNTER (Balcão/Autoatendimento) */}
      {view === 'COUNTER' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><ShoppingCart size={28} className="text-emerald-500"/> Pedidos de Balcão</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pedidos para retirada e autoatendimento</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.filter(t => t.type === 'COUNTER').length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><ShoppingCart size={40}/></div>
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum pedido no balcão</p>
                </div>
              ) : (
                tables.filter(t => t.type === 'COUNTER').map(order => (
                  <div key={order.id} onClick={() => { setSelectedSession(order); setCart([]); setView('ORDER'); }} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 hover:border-emerald-400 cursor-pointer transition-all shadow-sm group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingCart size={24}/></div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase">Aguardando</span>
                     </div>
                     <h5 className="font-black text-slate-800 text-xl truncate">{order.customer?.name || 'Cliente Balcão'}</h5>
                     <p className="text-slate-400 font-bold text-xs mt-1">
                        {order.table_number ? `Mesa ${order.table_number}` : `Pedido #${order.id.split('-').pop()}`}
                     </p>
                     <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                        <span className="text-2xl font-black text-slate-900">R$ {order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
      {/* VIEW: SELF_SERVICE (Autoatendimento) */}
      {view === 'SELF_SERVICE' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><Monitor size={28} className="text-indigo-500"/> Autoatendimento</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pedidos pagos via Totem</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.filter(t => t.items.some(i => i.origin === 'SELF_SERVICE')).length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Monitor size={40}/></div>
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum pedido do totem</p>
                </div>
              ) : (
                tables.filter(t => t.items.some(i => i.origin === 'SELF_SERVICE')).map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[3rem] border-2 border-indigo-100 transition-all shadow-sm group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Monitor size={24}/></div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase">Pago no Totem</span>
                     </div>
                     <h5 className="font-black text-slate-800 text-xl truncate">{order.customer?.name || 'Cliente Totem'}</h5>
                     <p className="text-slate-400 font-bold text-xs mt-1">
                        {order.table_number ? `Mesa ${order.table_number}` : `Retirada #${order.id.split('-').pop()}`}
                     </p>
                     <div className="mt-4 space-y-2">
                        {order.items.filter(i => i.origin === 'SELF_SERVICE').map((it, idx) => (
                           <div key={idx} className="text-sm font-bold text-slate-600 flex justify-between">
                              <span>{it.quantity}x {it.name}</span>
                           </div>
                        ))}
                     </div>
                     <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Total Pago</span>
                        <span className="text-2xl font-black text-indigo-600">R$ {order.items.filter(i => i.origin === 'SELF_SERVICE').reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                     </div>
                     <button onClick={() => {
                        // Limpar itens do totem após entregue
                        setTables(prev => prev.map(t => {
                           if (t.id === order.id) {
                              return { ...t, items: t.items.filter(i => i.origin !== 'SELF_SERVICE') };
                           }
                           return t;
                        }));
                     }} className="w-full mt-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors">
                        Marcar como Entregue
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {view === 'MONITOR' && (
        <div className="space-y-10 animate-in fade-in">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <h3 className="flex items-center gap-3 text-orange-600 font-black uppercase tracking-widest bg-orange-50 p-4 rounded-2xl border border-orange-100"><CookingPot size={24}/> Cozinha (Pizzas)</h3>
                 <div className="space-y-4">
                    {tables.map(s => s.items.filter(i => i.sent_to_kitchen && (i as any).routing_tag !== 'COPA').map((it, idx) => (
                      <div key={`${s.id}-${idx}`} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4">
                         <div className="flex justify-between items-start">
                            <div className="flex-1">
                               <p className="font-black text-slate-800 text-xl leading-tight">{it.quantity}x {it.name}</p>
                               <div className="mt-3 space-y-2">
                                  {s.type === 'DINE_IN' && (
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase">Mesa {s.table_number} {it.origin === 'SELF_SERVICE' && '(Autoatendimento)'}</span>
                                  )}
                                  {s.type === 'COUNTER' && (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">Balcão: {s.customer?.name || 'Cliente'} {it.origin === 'SELF_SERVICE' && '(Autoatendimento)'}</span>
                                  )}
                                  {s.type === 'DELIVERY' && (
                                    <div className="space-y-1">
                                       <div className="flex items-center gap-2"><span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase">DELIVERY: {s.customer?.name}</span></div>
                                       <div className="flex items-start gap-2 text-slate-500"><MapPin size={12} className="mt-1 shrink-0"/><p className="text-[10px] font-bold uppercase leading-relaxed">{s.customer?.address} - {s.customer?.region}</p></div>
                                       <div className="flex items-center gap-2 text-emerald-600"><DollarSign size={12}/><p className="text-[10px] font-black uppercase">VLR: R$ {((it.price * it.quantity) + (s.delivery_fee || 0)).toFixed(2)} (TX: R$ {s.delivery_fee?.toFixed(2)})</p></div>
                                    </div>
                                  )}
                               </div>
                            </div>
                            <button onClick={() => handleMarkItemReady(s.id, idx)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Check/></button>
                         </div>
                         {it.notes && (
                           <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                              <MessageSquare className="text-amber-500 shrink-0" size={16} />
                              <p className="text-xs font-black text-amber-900 uppercase leading-relaxed">OBS: {it.notes}</p>
                           </div>
                         )}
                      </div>
                    ))).flat()}
                 </div>
              </div>
              <div className="space-y-6">
                 <h3 className="flex items-center gap-3 text-blue-600 font-black uppercase tracking-widest bg-blue-50 p-4 rounded-2xl border border-blue-100"><Beer size={24}/> Copa (Bebidas)</h3>
                 <div className="space-y-4">
                    {tables.map(s => s.items.filter(i => i.sent_to_kitchen && (i as any).routing_tag === 'COPA').map((it, idx) => (
                      <div key={`${s.id}-${idx}`} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm flex justify-between items-center">
                         <div>
                            <p className="font-black text-slate-800 text-xl leading-tight">{it.quantity}x {it.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              Local: {s.type === 'DINE_IN' ? `Mesa ${s.table_number}` : s.type === 'COUNTER' ? 'Balcão' : `Delivery: ${s.customer?.name}`} {it.origin === 'SELF_SERVICE' && '(Autoatendimento)'}
                            </p>
                         </div>
                         <button onClick={() => handleMarkItemReady(s.id, idx)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"><Check/></button>
                      </div>
                    ))).flat()}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VIEW: HISTORY */}
      {view === 'HISTORY' && (
        <div className="space-y-8 animate-in fade-in">
           <header className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><History size={28} className="text-emerald-500"/> Histórico de Vendas</h3>
              <button onClick={fetchHistory} className="p-4 bg-white border rounded-2xl hover:bg-slate-50"><RefreshCw size={20}/></button>
           </header>
           
           <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                       <th className="px-10 py-6">Data/Hora</th>
                       <th className="px-10 py-6">Pedido / Detalhes</th>
                       <th className="px-10 py-6">Valor Total</th>
                       <th className="px-10 py-6 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y text-sm">
                    {historySales.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-10 py-6 font-bold text-slate-500">{new Date(sale.created_at).toLocaleString()}</td>
                         <td className="px-10 py-6">
                            <p className="font-black text-slate-800 truncate max-w-[400px]">{sale.description.replace('Venda PDV ', '')}</p>
                         </td>
                         <td className="px-10 py-6 font-black text-emerald-600 text-lg">R$ {sale.amount.toFixed(2)}</td>
                         <td className="px-10 py-6 text-right"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black text-[10px] uppercase">Finalizado</span></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* VIEW: ORDER (PDV) */}
      {view === 'ORDER' && selectedSession && (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in">
           <div className="flex-1 space-y-6">
              <header className="flex items-center gap-4">
                 <button onClick={() => setView(selectedSession.type === 'DELIVERY' ? 'DELIVERY' : 'SALON')} className="p-3 bg-white rounded-2xl border hover:bg-slate-50 transition-all active:scale-90"><ChevronLeft/></button>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Atendimento: {selectedSession.type === 'DINE_IN' ? `Mesa ${selectedSession.table_number}` : `Delivery: ${selectedSession.customer?.name}`}</h3>
              </header>

              <div className="flex bg-white p-2 rounded-[2rem] border shadow-sm gap-2 overflow-x-auto">
                 {[{id:'PIZZAS', l:'Tamanhos', i:Pizza}, {id:'SABORES_PIZZA', l:'Sabores', i:Sparkles}, {id:'BEBIDAS', l:'Bebidas', i:Coffee}, {id:'ENTRADAS', l:'Entradas', i:Soup}].map(cat => (
                   <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>
                      <cat.i size={16}/> {cat.l}
                   </button>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                 {MOCK_MENU.filter(p => p.category === activeCategory).map(prod => (
                   <button key={prod.id} onClick={() => prod.is_pizza_base ? (setPizzaDraft({ base: prod, flavors: [], border: null, notes: '' }), setPizzaStep('FLAVORS')) : setCart([...cart, { product_id: prod.id, name: prod.name, quantity: 1, price: prod.price, sent_to_kitchen: false }])} className="bg-white p-8 rounded-[2.5rem] border flex justify-between items-center hover:border-indigo-400 transition-all group text-left shadow-sm">
                     <div><p className="font-black text-slate-800 text-xl leading-none mb-1">{prod.name}</p><p className="text-emerald-600 font-black text-xs">{prod.price > 0 ? `R$ ${prod.price.toFixed(2)}` : 'Personalizar'}</p></div>
                     <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><PlusCircle size={24}/></div>
                   </button>
                 ))}
              </div>
           </div>

           {/* Carrinho lateral */}
           <div className="w-full lg:w-[450px] bg-white rounded-[3.5rem] border shadow-2xl flex flex-col h-[800px] overflow-hidden sticky top-24">
              <div className="p-10 bg-slate-900 text-white shrink-0 flex justify-between items-center">
                 <div><h3 className="text-2xl font-black uppercase tracking-tight">Carrinho</h3><p className="text-[10px] font-black uppercase text-emerald-400">Canal: {selectedSession.type}</p></div>
                 <ShoppingCart className="opacity-20" size={32}/>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50 custom-scrollbar">
                 {selectedSession.items.map((it, idx) => (
                   <div key={`sent-${idx}`} className="bg-slate-100 p-6 rounded-2xl border flex flex-col gap-2 opacity-70">
                      <div className="flex justify-between items-center"><p className="font-black text-slate-700 text-sm">{it.quantity}x {it.name}</p><span className="text-[10px] font-black text-slate-400">R$ {it.price.toFixed(2)}</span></div>
                      {it.notes && <p className="text-[9px] font-bold text-amber-600 uppercase italic">OBS: {it.notes}</p>}
                   </div>
                 ))}
                 {cart.map((it, idx) => (
                   <div key={`new-${idx}`} className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-100 flex flex-col gap-3 shadow-sm animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                         <div className="flex-1"><p className="font-black text-slate-800 text-sm leading-tight">{it.quantity}x {it.name}</p><p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Aguardando Envio</p></div>
                         <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="p-3 text-rose-400 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                      </div>
                      {it.notes && <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-[10px] font-bold text-slate-600 uppercase">OBS: {it.notes}</div>}
                   </div>
                 ))}
              </div>
              <div className="p-10 border-t bg-white space-y-4 shrink-0 shadow-inner">
                 <div className="space-y-2">
                    {selectedSession.type === 'DINE_IN' && (
                       <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                             <User className="text-slate-400" size={16}/>
                             <span className="text-[10px] font-black text-slate-500 uppercase">Taxa Garçom (10%)</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`font-black text-sm ${selectedSession.use_service_charge ? 'text-emerald-600' : 'text-slate-300 line-through'}`}>
                                R$ {currentServiceCharge.toFixed(2)}
                             </span>
                             <button onClick={toggleServiceCharge} className={`p-2 rounded-lg transition-all ${selectedSession.use_service_charge ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {selectedSession.use_service_charge ? <UserMinus size={14}/> : <UserPlus2 size={14}/>}
                             </button>
                          </div>
                       </div>
                    )}
                 </div>
                 <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral</span><span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {totalSessionAmount.toFixed(2)}</span></div>
                 <div className="grid grid-cols-1 gap-2">
                    <button disabled={cart.length === 0} onClick={handleSendOrder} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 transition-all"><Send size={20}/> Enviar Produção</button>
                    <button onClick={() => { setPayments([]); setIsClosingTable(true); }} className="w-full py-7 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><DollarSign size={20}/> Fechar & Receber</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL FECHAMENTO (CHECOUT ENTERPRISE) */}
      {isClosingTable && selectedSession && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Finalizar Venda</h3>
                    <p className="text-slate-500 font-medium italic">Gestão de pagamentos e taxas.</p>
                 </div>
                 <button onClick={() => setIsClosingTable(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button>
              </div>

              {selectedSession.type === 'DELIVERY' && (
                <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 mb-8 space-y-4">
                   <div className="flex items-center gap-3 text-indigo-700 font-black uppercase text-[10px] tracking-widest">
                      <Bike size={18}/> Vínculo de Entrega
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Motoboy Responsável</label>
                         <select value={selectedMotoboy} onChange={e => setSelectedMotoboy(e.target.value)} className="w-full p-4 bg-white border border-indigo-200 rounded-2xl font-bold text-slate-700 outline-none">
                            {MOTOBOYS.map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Taxa Motoboy</label>
                         <div className="p-4 bg-white border border-indigo-200 rounded-2xl font-black text-indigo-600 flex justify-between">
                            <span>REPASSE</span>
                            <span>R$ {selectedSession.delivery_fee?.toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-6 rounded-[2rem] border text-center relative overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total do Pedido</p>
                    <p className="text-3xl font-black text-slate-800">R$ {totalSessionAmount.toFixed(2)}</p>
                    {selectedSession.use_service_charge && (
                      <div className="mt-2 text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 py-1 rounded-full">Inclui 10% Garçom</div>
                    )}
                 </div>
                 <div className={`p-6 rounded-[2rem] border text-center transition-colors ${remainingAmount <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Falta Receber</p>
                    <p className={`text-3xl font-black ${remainingAmount <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {remainingAmount <= 0 ? `QUITADO` : `R$ ${remainingAmount.toFixed(2)}`}
                    </p>
                 </div>
              </div>

              {/* Opção de remover taxa se não foi feito antes */}
              {selectedSession.type === 'DINE_IN' && (
                 <button onClick={toggleServiceCharge} className={`w-full mb-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 ${selectedSession.use_service_charge ? 'bg-white border-rose-100 text-rose-500 hover:bg-rose-50' : 'bg-emerald-50 border-emerald-500 text-emerald-700'}`}>
                    {selectedSession.use_service_charge ? 'Remover 10% (Solicitação do Cliente)' : 'Reativar Taxa de 10%'}
                 </button>
              )}

              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 mb-8 space-y-6">
                 <div className="flex items-center gap-3 text-slate-800 font-black uppercase text-[10px] tracking-widest">
                    <Calculator size={18}/> Recebimento Dinâmico
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Método</label>
                       <select value={currentPayMethod} onChange={e => setCurrentPayMethod(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                         {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Valor R$</label>
                       <div className="flex gap-2">
                          <input type="number" value={currentPayAmount || ''} placeholder={remainingAmount.toFixed(2)} onChange={e => setCurrentPayAmount(Number(e.target.value))} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-center" />
                          <button onClick={addPaymentPart} className="bg-emerald-500 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95"><Plus size={24}/></button>
                       </div>
                    </div>
                 </div>

                 {payments.length > 0 && (
                   <div className="space-y-2 pt-4 border-t border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Resumo do Recebimento</p>
                      {payments.map((p, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-4 rounded-xl animate-in slide-in-from-left-2 ${p.is_tip ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
                           <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className={p.is_tip ? 'text-amber-500' : 'text-emerald-500'}/>
                              <span className={`font-bold text-sm ${p.is_tip ? 'text-amber-800' : 'text-slate-700'}`}>{p.method}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className={`font-black ${p.is_tip ? 'text-amber-600' : 'text-slate-900'}`}>R$ {p.amount.toFixed(2)}</span>
                              <button onClick={() => removePaymentPart(idx)} className="text-rose-400 hover:bg-rose-50 p-1 rounded-md"><Trash size={14}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-1 gap-2 pt-4 border-t">
                 <button onClick={handleFinalizeSale} disabled={loading || remainingAmount > 0} className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${remainingAmount > 0 ? 'bg-slate-100 text-slate-400 grayscale cursor-not-allowed opacity-50' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}>
                    {loading ? <Loader2 className="animate-spin" size={24}/> : <CheckSquare size={24}/>} 
                    {remainingAmount > 0 ? `Saldo Pendente: R$ ${remainingAmount.toFixed(2)}` : 'Confirmar Venda e Sair'}
                 </button>
                 <button onClick={() => setIsClosingTable(false)} className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar Fechamento</button>
              </div>
           </div>
        </div>
      )}

      {/* PIZZA WIZARD */}
      {pizzaStep !== 'IDLE' && (
        <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
           <header className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
              <div className="flex items-center gap-6">
                <button onClick={() => setPizzaStep('IDLE')} className="p-3 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-90"><ArrowLeft/></button>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Montando {pizzaDraft.base?.name}</h2>
              </div>
              <button onClick={() => setPizzaStep('IDLE')} className="text-white/40 hover:text-white"><X size={32}/></button>
           </header>
           <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-12 pb-24">
                 {pizzaStep === 'FLAVORS' && (
                    <div className="space-y-8">
                       <div className="flex justify-between items-end">
                         <h3 className="text-4xl font-black text-white">Escolha os Sabores <span className="text-emerald-400">({pizzaDraft.flavors.length}/{pizzaDraft.base?.max_flavors})</span></h3>
                         {pizzaDraft.flavors.length > 0 && (
                            <button onClick={() => setPizzaStep('BORDERS')} className="bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all">Próximo: Borda & Obs <ChevronRight/></button>
                         )}
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {MOCK_MENU.filter(m => m.category === 'SABORES_PIZZA').map(s => {
                             const isSelected = pizzaDraft.flavors.find(f => f.id === s.id);
                             const isFull = pizzaDraft.flavors.length >= (pizzaDraft.base?.max_flavors || 1);
                             return (
                               <button key={s.id} disabled={!isSelected && isFull} onClick={() => isSelected ? setPizzaDraft({...pizzaDraft, flavors: pizzaDraft.flavors.filter(f => f.id !== s.id)}) : setPizzaDraft({...pizzaDraft, flavors: [...pizzaDraft.flavors, s]})} className={`p-8 rounded-[2.5rem] border-4 text-left transition-all relative ${isSelected ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl' : 'bg-white/5 border-white/10 text-white hover:border-emerald-500/50'}`}>
                                 <p className="font-black text-xl mb-1">{s.name}</p>
                                 <p className="text-xs font-bold opacity-60 uppercase">Base: R$ {s.price.toFixed(2)}</p>
                                 {isSelected && <div className="absolute top-4 right-4 bg-white text-emerald-600 p-1 rounded-full"><CheckCircle2 size={20}/></div>}
                               </button>
                             );
                          })}
                       </div>
                    </div>
                 )}
                 {pizzaStep === 'BORDERS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-right-4">
                       <div className="space-y-8">
                          <h3 className="text-3xl font-black text-white">1. Escolha a Borda</h3>
                          <div className="grid grid-cols-1 gap-4">
                             {MOCK_MENU.filter(m => m.category === 'BORDAS').map(b => (
                               <button key={b.id} onClick={() => setPizzaDraft({...pizzaDraft, border: b})} className={`p-6 rounded-3xl border-4 text-left transition-all ${pizzaDraft.border?.id === b.id ? 'bg-emerald-50 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                 <p className="font-black text-lg">{b.name}</p>
                                 <p className="text-xs font-bold opacity-60">+ R$ {b.price.toFixed(2)}</p>
                               </button>
                             ))}
                             <button onClick={() => setPizzaDraft({...pizzaDraft, border: null})} className={`p-6 rounded-3xl border-4 text-left transition-all ${!pizzaDraft.border ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                               <p className="font-black text-lg">Sem Borda Recheada</p>
                               <p className="text-xs font-bold opacity-60">Padrão</p>
                             </button>
                          </div>
                       </div>
                       
                       <div className="space-y-8">
                          <h3 className="text-3xl font-black text-white">2. Observações do Cliente</h3>
                          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                             <div className="flex flex-wrap gap-2">
                                {QUICK_NOTES.map(note => (
                                  <button key={note} onClick={() => setPizzaDraft(prev => ({...prev, notes: prev.notes ? `${prev.notes}, ${note}` : note}))} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5">{note}</button>
                                ))}
                             </div>
                             <textarea value={pizzaDraft.notes} onChange={e => setPizzaDraft({...pizzaDraft, notes: e.target.value})} placeholder="Escreva observações adicionais aqui..." className="w-full h-32 bg-slate-800 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500 transition-all"></textarea>
                             <button onClick={finalizePizza} className="w-full py-7 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">Finalizar Pizza e Ir para Carrinho <PlusCircle/></button>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
