
import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft, Plus, Minus, Search, CheckCircle2, Star, Clock, MapPin, UtensilsCrossed, Bike, User, X } from 'lucide-react';
import { MenuProduct, ProductCategory, OrderItem, OrderType } from '../types';
import { supabase } from '../services/supabase';

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

interface PublicSelfServiceProps {
  onOrderComplete?: (order: any) => void;
  onExit?: () => void;
  userId?: string;
}

const PublicSelfService: React.FC<PublicSelfServiceProps> = ({ onOrderComplete, onExit, userId }) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'TODOS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'browsing' | 'confirming' | 'success' | 'selecting_type' | 'selecting_table'>('selecting_type');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [pizzaSelection, setPizzaSelection] = useState<{ product: MenuProduct, flavors: string[] } | null>(null);

  // Timer para voltar ao início após sucesso
  React.useEffect(() => {
    if (orderStatus === 'success') {
      const timer = setTimeout(() => {
        setOrderStatus('selecting_type');
        setCustomerName('');
        setSelectedTable(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus]);

  const categories: (ProductCategory | 'TODOS')[] = ['TODOS', 'ENTRADAS', 'PIZZAS', 'PORCOES', 'BEBIDAS'];

  const filteredProducts = MOCK_MENU.filter(p => {
    const matchesCategory = activeCategory === 'TODOS' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: MenuProduct, flavors?: string[]) => {
    // Se for pizza pequena ou grande e não tiver sabores selecionados, abre o seletor
    if ((product.id === 'p1' || product.id === 'p2') && !flavors) {
      setPizzaSelection({ product, flavors: [] });
      return;
    }

    setCart(prev => {
      // Calcula o preço da pizza baseado no sabor mais caro
      let finalPrice = product.price;
      if (flavors && flavors.length > 0) {
        const flavorPrices = flavors.map(fName => MOCK_MENU.find(m => m.name === fName)?.price || 0);
        finalPrice = Math.max(...flavorPrices, 0);
      }

      const itemName = flavors && flavors.length > 0 
        ? `${product.name} (${flavors.join(' / ')})`
        : product.name;
        
      const existing = prev.find(item => item.name === itemName);
      if (existing) {
        return prev.map(item => 
          item.name === itemName 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        name: itemName, 
        price: finalPrice, 
        quantity: 1 
      }];
    });
    setPizzaSelection(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product_id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      }
      return prev.filter(item => item.product_id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinishOrder = async () => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      setOrderStatus('selecting_table');
      return;
    }

    setOrderStatus('confirming');
    
    try {
      // 1. Salva a transação financeira no Supabase (O valor entra no caixa)
      const { error: saleError } = await supabase.from('financial_transactions').insert([{
        type: 'INCOME',
        category: 'OTHER',
        description: `Autoatendimento [${orderType === 'DINE_IN' ? `Mesa ${selectedTable}` : 'Retirada'}]: ${customerName || 'Cliente'}`,
        amount: cartTotal,
        due_date: new Date().toISOString().split('T')[0],
        status: 'PAID'
      }]);

      if (saleError) throw saleError;

      // 2. Cria o pedido para a cozinha/copa e para a aba do POS
      const newOrderItems = cart.map(item => {
        const isDrink = item.name.toLowerCase().includes('coca') || item.name.toLowerCase().includes('suco') || item.name.toLowerCase().includes('cerveja');
        return { 
          ...item, 
          sent_to_kitchen: true,
          routing_tag: isDrink ? 'COPA' : 'COZINHA',
          origin: 'SELF_SERVICE' as const
        };
      });

      // 3. Salva no localStorage para o POS ler (Integração Local em tempo real)
      const STORAGE_KEY = `COUNTER_TABLES_V5_${userId || 'GENERIC'}`;
      const savedTables = localStorage.getItem(STORAGE_KEY);
      let tables = savedTables ? JSON.parse(savedTables) : [];

      let finalOrder: any = null;

      if (orderType === 'DINE_IN') {
        const tableIndex = tables.findIndex((t: any) => t.type === 'DINE_IN' && t.table_number === selectedTable);
        if (tableIndex > -1) {
          tables[tableIndex] = {
            ...tables[tableIndex],
            status: 'OCCUPIED',
            customer: { name: customerName || 'Cliente Autoatendimento' },
            items: [...(tables[tableIndex].items || []), ...newOrderItems],
            opened_at: tables[tableIndex].opened_at || new Date().toISOString(),
            paid_amount: (tables[tableIndex].paid_amount || 0) + cartTotal
          };
          finalOrder = tables[tableIndex];
        } else {
          finalOrder = {
            id: `self-${Date.now()}`,
            type: 'DINE_IN',
            status: 'OCCUPIED',
            customer: { name: customerName || 'Cliente Autoatendimento' },
            items: newOrderItems,
            opened_at: new Date().toISOString(),
            use_service_charge: false,
            table_number: selectedTable,
            paid_amount: cartTotal
          };
          tables = [finalOrder, ...tables];
        }
      } else {
        finalOrder = {
          id: `self-${Date.now()}`,
          type: 'COUNTER',
          status: 'OCCUPIED',
          customer: { name: customerName || 'Cliente Autoatendimento' },
          items: newOrderItems,
          opened_at: new Date().toISOString(),
          use_service_charge: false,
          paid_amount: cartTotal
        };
        tables = [finalOrder, ...tables];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));

      // 4. Simula a impressão do pedido (Recibo Cliente + Comanda Cozinha)
      setTimeout(() => {
        const printContent = `
          <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 20px;">
            <!-- RECIBO DO CLIENTE -->
            <h2 style="text-align: center;">PEDIDO AUTOATENDIMENTO</h2>
            <p style="text-align: center;">------------------------</p>
            <p><strong>Cliente:</strong> ${customerName || 'Cliente'}</p>
            <p><strong>Tipo:</strong> ${orderType === 'DINE_IN' ? `Mesa ${selectedTable}` : 'Retirada'}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
            <p style="text-align: center;">------------------------</p>
            ${cart.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <p style="text-align: center;">------------------------</p>
            <h3 style="text-align: right;">TOTAL: R$ ${cartTotal.toFixed(2)}</h3>
            <p style="text-align: center; margin-top: 20px;">Obrigado pela preferência!</p>
            
            <div style="page-break-after: always; margin-bottom: 50px;"></div>
            <p style="text-align: center;">--- CORTE AQUI ---</p>
            <div style="page-break-before: always; margin-top: 50px;"></div>

            <!-- COMANDA DA COZINHA -->
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 5px;">COZINHA / COPA</h2>
            <h3 style="text-align: center; font-size: 18px; margin-top: 0;">${orderType === 'DINE_IN' ? `MESA ${selectedTable}` : 'BALCÃO'}</h3>
            <p style="text-align: center; margin: 0;">${new Date().toLocaleString()}</p>
            <p style="text-align: center;">------------------------</p>
            ${newOrderItems.map(item => `
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
          printWindow.document.write('<html><head><title>Imprimir Pedido</title></head><body>');
          printWindow.document.write(printContent);
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
        }
      }, 500);

      setOrderStatus('success');
      if (onOrderComplete) onOrderComplete(finalOrder);
      setCart([]);
    } catch (err: any) {
      alert("Erro ao processar pagamento: " + err.message);
      setOrderStatus('browsing');
    }
  };

  if (orderStatus === 'selecting_type') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[250] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
          <UtensilsCrossed size={40} />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Bem-vindo ao Counter!</h1>
        <p className="text-slate-400 font-medium mb-8">Identifique-se para começar seu pedido</p>
        
        <div className="w-full max-w-md mb-10 space-y-4">
          <div className="relative">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input 
              type="text" 
              placeholder="Digite seu nome aqui..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-white/10 border-2 border-white/10 rounded-[2rem] py-6 pl-16 pr-6 text-white text-xl font-bold placeholder:text-slate-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          {!customerName && <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">O nome é obrigatório para continuar</p>}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl transition-all duration-500 ${!customerName ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
          <button 
            onClick={() => { setOrderType('DINE_IN'); setOrderStatus('selecting_table'); }}
            className="bg-white p-10 rounded-[3rem] border-4 border-transparent hover:border-indigo-500 transition-all group flex flex-col items-center gap-4 shadow-xl"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin size={32} />
            </div>
            <span className="text-xl font-black text-slate-800 uppercase tracking-tight">Comer no Local</span>
          </button>

          <button 
            onClick={() => { setOrderType('COUNTER'); setOrderStatus('browsing'); }}
            className="bg-white p-10 rounded-[3rem] border-4 border-transparent hover:border-emerald-500 transition-all group flex flex-col items-center gap-4 shadow-xl"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bike size={32} />
            </div>
            <span className="text-xl font-black text-slate-800 uppercase tracking-tight">Para Retirar</span>
          </button>
        </div>
        
        <button onClick={onExit} className="mt-12 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">Sair do Autoatendimento</button>
      </div>
    );
  }

  if (orderStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-100/50">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">Pedido Recebido!</h1>
        <p className="text-slate-500 text-xl max-w-md mb-8">
          Seu pedido já está em nossa cozinha. Você pode acompanhar o status nos painéis do salão.
        </p>
        <div className="bg-slate-50 p-6 rounded-3xl w-full max-w-sm border border-slate-100 mb-8">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Senha do Pedido</div>
          <div className="text-6xl font-black text-indigo-600">#{Math.floor(Math.random() * 900) + 100}</div>
        </div>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-8 animate-pulse">
          Reiniciando totem em 5 segundos...
        </p>
        <button 
          onClick={() => {
            setOrderStatus('selecting_type');
            setCustomerName('');
            setSelectedTable(null);
          }}
          className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 transition-transform"
        >
          Novo Pedido
        </button>
      </div>
    );
  }

  if (orderStatus === 'selecting_table') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[250] flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full">
          <header className="flex justify-between items-center mb-12">
            <button onClick={() => setOrderStatus('selecting_type')} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">Em qual mesa você está?</h2>
              <p className="text-slate-400 font-medium">Selecione o número da sua mesa no salão</p>
            </div>
            <div className="w-14" />
          </header>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-4">
            {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => { setSelectedTable(num); setOrderStatus('browsing'); }}
                className="aspect-square bg-white/10 border-2 border-white/5 rounded-2xl flex items-center justify-center text-2xl font-black text-white hover:bg-indigo-600 hover:border-indigo-400 transition-all active:scale-90"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-[150] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Autoatendimento</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Loja Aberta • Matriz Centro
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-6">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-slate-700">4.9</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700">25-35 min</span>
            </div>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="relative bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 flex items-center gap-3 hover:bg-indigo-700 transition-colors"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="font-black text-sm">R$ {cartTotal.toFixed(2)}</span>
            )}
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        {/* Banner */}
        <div className="px-6 py-8">
          <div className="relative h-48 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100">
            <img 
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop" 
              className="w-full h-full object-cover"
              alt="Pizza Banner"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-10">
              <span className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Oferta do Dia</span>
              <h2 className="text-3xl font-black text-white max-w-xs leading-tight">As melhores Pizzas Artesanais da Região</h2>
            </div>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="px-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="O que você deseja comer hoje?"
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-6 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all border border-slate-100 group">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                  src={`https://picsum.photos/seed/${product.id}/600/400`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={product.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                  {product.category}
                </div>
              </div>
              <div className="px-2">
                <h3 className="text-lg font-black text-slate-800 mb-1">{product.name}</h3>
                <p className="text-slate-500 text-xs line-clamp-2 mb-4 font-medium leading-relaxed">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900">R$ {product.price.toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pizza Flavor Selection Modal */}
      {pizzaSelection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">{pizzaSelection.product.name}</h3>
                    <p className="text-slate-500 font-medium">Escolha até {pizzaSelection.product.id === 'p1' ? '2' : '3'} sabores</p>
                 </div>
                 <button onClick={() => setPizzaSelection(null)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {MOCK_MENU.filter(p => p.category === 'SABORES_PIZZA').map(flavor => {
                    const isSelected = pizzaSelection.flavors.includes(flavor.name);
                    const maxFlavors = pizzaSelection.product.max_flavors || 1;
                    
                    return (
                      <button 
                        key={flavor.id}
                        disabled={!isSelected && pizzaSelection.flavors.length >= maxFlavors}
                        onClick={() => {
                          setPizzaSelection(prev => {
                            if (!prev) return null;
                            if (isSelected) {
                              return { ...prev, flavors: prev.flavors.filter(f => f !== flavor.name) };
                            }
                            return { ...prev, flavors: [...prev.flavors, flavor.name] };
                          });
                        }}
                        className={`p-6 rounded-3xl border-2 text-left transition-all flex flex-col gap-2 ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                            : 'border-slate-100 bg-white hover:border-slate-200 disabled:opacity-40'
                        }`}
                      >
                         <div className="flex justify-between items-center">
                            <span className="font-black text-slate-800">{flavor.name}</span>
                            {isSelected && <CheckCircle2 size={20} className="text-indigo-600" />}
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{flavor.description}</p>
                      </button>
                    );
                 })}
              </div>
              
              <div className="p-10 bg-slate-50 flex flex-col gap-4">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Selecionados: {pizzaSelection.flavors.length} / {pizzaSelection.product.id === 'p1' ? '2' : '3'}</span>
                    {pizzaSelection.flavors.length > 0 && (
                      <span className="text-indigo-600 font-black text-sm">{pizzaSelection.flavors.join(' + ')}</span>
                    )}
                 </div>
                 <button 
                   disabled={pizzaSelection.flavors.length === 0}
                   onClick={() => addToCart(pizzaSelection.product, pizzaSelection.flavors)}
                   className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-300 transition-all active:scale-95"
                 >
                    Confirmar Sabores
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex justify-end animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Seu Pedido</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <ArrowLeft size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingCart size={40} />
                  </div>
                  <p className="text-slate-400 font-bold">Seu carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100">
                      <img src={`https://picsum.photos/seed/${item.product_id}/100/100`} alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-indigo-600 font-bold text-xs">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <button onClick={() => removeFromCart(item.product_id)} className="text-slate-400 hover:text-rose-500">
                        <Minus size={16} />
                      </button>
                      <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => {
                        const product = MOCK_MENU.find(p => p.id === item.product_id)!;
                        if (product.id === 'p1' || product.id === 'p2') {
                          // Apenas incrementa se for pizza já configurada (pelo nome)
                          setCart(prev => prev.map(it => it.name === item.name ? { ...it, quantity: it.quantity + 1 } : it));
                        } else {
                          addToCart(product);
                        }
                      }} className="text-slate-400 hover:text-indigo-600">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Subtotal</span>
                <span className="text-slate-900 font-black">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Taxa de Serviço</span>
                <span className="text-emerald-600 font-black">Grátis</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xl font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-indigo-600">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0 || orderStatus === 'confirming'}
                onClick={handleFinishOrder}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none hover:bg-slate-800 transition-colors"
              >
                {orderStatus === 'confirming' ? 'Processando...' : 'Finalizar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSelfService;
