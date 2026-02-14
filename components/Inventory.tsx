
import React, { useState, useEffect } from 'react';
import { 
  Loader2, Edit3, Plus, Search, 
  CheckCircle2, Truck, Camera, X, Sparkles, Wand2, ArrowRight, ShoppingCart,
  UtensilsCrossed, Beer, Hammer, AlertCircle, Package, DollarSign
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { StockItem } from '../types';
import { analyzeInventoryImage } from '../services/gemini';

const Inventory: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'shopping'>('stock');
  const [activeCategory, setActiveCategory] = useState<'PERECIVEIS' | 'BEBIDAS' | 'EQUIPAMENTOS'>('PERECIVEIS');
  const [insumos, setInsumos] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzingIA, setIsAnalyzingIA] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receivingItem, setReceivingItem] = useState<StockItem | null>(null);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: 'UN',
    category: 'PERECIVEIS' as any,
    ideal_quantity: 0,
    current_stock: 0,
    cost_price: 0
  });

  const [receiveData, setReceiveData] = useState({
    quantity: 0,
    value: 0
  });

  const [quickScanResult, setQuickScanResult] = useState<{
    item: StockItem | null,
    quantity: number,
    price: number
  }>({ item: null, quantity: 0, price: 0 });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name', { ascending: true });
      if (!error && data) {
        setInsumos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar inventário:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOrder = async (item: StockItem) => {
    setIsSaving(true);
    try {
      const willOrder = !item.is_ordered;
      
      await supabase
        .from('inventory_items')
        .update({ is_ordered: willOrder })
        .eq('id', item.id);
      
      if (willOrder) {
        const estimatedQty = Math.max(0, item.ideal_quantity - item.current_stock);
        const estimatedCost = estimatedQty * (item.cost_price || 0);

        if (estimatedCost > 0) {
          await supabase.from('financial_transactions').insert([{
            type: 'EXPENSE',
            category: 'INVENTORY',
            description: `PROVISÃO: Pedido de ${item.name}`,
            amount: estimatedCost,
            due_date: new Date().toISOString().split('T')[0],
            status: 'PENDING'
          }]);
        }
      }

      await fetchInventory();
    } catch (err: any) {
      alert("Erro ao processar pedido financeiro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceiveConfirm = async () => {
    const targetItem = receivingItem || quickScanResult.item;
    const targetData = receivingItem ? receiveData : { quantity: quickScanResult.quantity, value: quickScanResult.price };

    if (!targetItem) return;
    
    setIsSaving(true);
    try {
      const newStock = Number(targetItem.current_stock) + Number(targetData.quantity);
      const totalAmount = Number(targetData.quantity) * Number(targetData.value);

      // 1. Atualiza Estoque Físico
      await supabase.from('inventory_items').update({ 
        current_stock: newStock, 
        cost_price: targetData.value,
        is_ordered: false 
      }).eq('id', targetItem.id);

      // 2. Busca a PROVISÃO e marca como RECEBIDA, mas mantém PENDING (Contas a Pagar)
      const { data: pendingTrans } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('status', 'PENDING')
        .eq('category', 'INVENTORY')
        .ilike('description', `%${targetItem.name}%`)
        .limit(1);

      if (pendingTrans && pendingTrans.length > 0) {
        // Atualiza a descrição para o gestor saber que a NF chegou
        await supabase.from('financial_transactions').update({
          amount: totalAmount,
          description: `COMPRA: ${targetItem.name} [NF RECEBIDA - AGUARDANDO PAGAMENTO]`,
          // Mantemos PENDING para o gestor liquidar no financeiro depois
        }).eq('id', pendingTrans[0].id);
      } else {
        // Se não havia provisão, cria uma conta a pagar já com NF recebida
        await supabase.from('financial_transactions').insert([{
          type: 'EXPENSE',
          category: 'INVENTORY',
          description: `COMPRA: ${targetItem.name} [NF RECEBIDA - AGUARDANDO PAGAMENTO]`,
          amount: totalAmount,
          due_date: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        }]);
      }

      // 3. Log de Auditoria
      await supabase.from('inventory_logs').insert([{
        item_id: targetItem.id,
        item_name: targetItem.name,
        old_stock: targetItem.current_stock,
        new_stock: newStock,
        change_type: 'ENTRADA',
        executed_by: 'Logística Enterprise',
        evidence_url: evidencePhoto
      }]);

      setIsReceiveModalOpen(false);
      setIsQuickScanOpen(false);
      setEvidencePhoto(null);
      fetchInventory();
      alert("Mercadoria recebida! O estoque foi atualizado e a conta foi enviada para o Financeiro como 'Aguardando Pagamento'.");
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const simulateCamera = (isQuick: boolean = false) => {
    const photo = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400";
    setEvidencePhoto(photo);
    if (isQuick) handleQuickIAAnalysis(photo);
  };

  const handleQuickIAAnalysis = async (photo: string) => {
    setIsAnalyzingIA(true);
    try {
      const itemNames = insumos.map(i => i.name);
      const result = await analyzeInventoryImage(photo, undefined, itemNames);
      const matchedItem = insumos.find(i => i.name.toLowerCase().includes(result.productName.toLowerCase()));
      setQuickScanResult({ item: matchedItem || null, quantity: result.quantity, price: result.price });
    } catch (err) { console.error(err); }
    finally { setIsAnalyzingIA(false); }
  };

  const filteredItems = insumos.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCategory = item.category || 'PERECIVEIS';
    const matchesCategory = itemCategory === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const shoppingList = insumos.filter(item => item.current_stock < item.ideal_quantity || item.is_ordered);

  const handleSaveItem = async () => {
    if (!formData.name) return alert("O nome é obrigatório.");
    setIsSaving(true);
    try {
      const cleanData = { ...formData, category: formData.category || 'PERECIVEIS' };
      if (editingId) {
        await supabase.from('inventory_items').update(cleanData).eq('id', editingId);
      } else {
        await supabase.from('inventory_items').insert([cleanData]);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: StockItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      unit: item.unit || 'UN',
      category: item.category || 'PERECIVEIS',
      ideal_quantity: item.ideal_quantity || 0,
      current_stock: item.current_stock || 0,
      cost_price: item.cost_price || 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Suprimentos</h2>
          <p className="text-slate-500 font-medium">Controle de estoque e recebimento de NF.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setEvidencePhoto(null); setQuickScanResult({item:null, quantity:0, price:0}); setIsQuickScanOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Sparkles size={20} /> Entrada por Foto (IA)
          </button>
          <button onClick={() => { setEditingId(null); setFormData({name: '', unit: 'UN', category: activeCategory, ideal_quantity: 0, current_stock: 0, cost_price: 0}); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} /> Novo Insumo
          </button>
        </div>
      </header>

      <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm w-fit">
        <button onClick={() => setActiveSubTab('stock')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'stock' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Estoque Atual</button>
        <button onClick={() => setActiveSubTab('shopping')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'shopping' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Carrinho de Pedidos</button>
      </div>

      {activeSubTab === 'stock' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'PERECIVEIS', label: 'Perecíveis', icon: UtensilsCrossed, color: 'emerald', desc: 'Alimentos e insumos' },
              { id: 'BEBIDAS', label: 'Bebidas', icon: Beer, color: 'blue', desc: 'Líquidos e refrigerantes' },
              { id: 'EQUIPAMENTOS', label: 'Equipamentos', icon: Hammer, color: 'indigo', desc: 'Balanças e utensílios' },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`group relative flex flex-col items-start p-8 rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                    isActive 
                      ? `bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02] z-10` 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-4 rounded-2xl mb-4 transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-white'}`}>
                    <Icon size={28} />
                  </div>
                  <span className="font-black text-lg tracking-tight uppercase">{cat.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{cat.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder={`Filtrar...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-bold" />
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Produto</th>
                    <th className="px-10 py-6">Qtd Padrão</th>
                    <th className="px-10 py-6">Saldo</th>
                    <th className="px-10 py-6">Últ. Valor</th>
                    <th className="px-10 py-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-10 py-7">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-lg leading-tight">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-slate-500 font-black text-base">{item.ideal_quantity}</td>
                      <td className="px-10 py-7">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm ${item.current_stock < item.ideal_quantity ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.current_stock}
                        </div>
                      </td>
                      <td className="px-10 py-7 text-slate-500 font-bold">R$ {item.cost_price?.toFixed(2) || '0.00'}</td>
                      <td className="px-10 py-7 text-right">
                        <div className="flex justify-end gap-3">
                           <button 
                             onClick={() => handleToggleOrder(item)} 
                             disabled={isSaving}
                             className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${item.is_ordered ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                           >
                             {isSaving ? <Loader2 className="animate-spin" size={14}/> : item.is_ordered ? <Truck size={14}/> : <ShoppingCart size={14}/>} 
                             {item.is_ordered ? 'No Pedido' : 'Pedir'}
                           </button>
                           <button onClick={() => openEditModal(item)} className="p-3 text-slate-300 hover:text-slate-900"><Edit3 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shoppingList.map(item => (
            <div key={item.id} className={`bg-white p-8 rounded-[3rem] border-2 shadow-sm relative ${item.is_ordered ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="font-black text-slate-800 text-2xl tracking-tight">{item.name}</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase">Sugestão: {Math.max(0, item.ideal_quantity - item.current_stock)} {item.unit}</p>
                 </div>
                 {item.is_ordered && (
                   <div className="flex flex-col items-end">
                     <Truck className="text-amber-500" size={24} />
                     <span className="text-[8px] font-black text-amber-600 uppercase mt-1">Dívida Provisionada</span>
                   </div>
                 )}
               </div>
               <button onClick={() => { setReceivingItem(item); setReceiveData({quantity: Math.max(0, item.ideal_quantity - item.current_stock), value: item.cost_price}); setIsReceiveModalOpen(true); }} className="w-full py-5 bg-indigo-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">Confirmar Recebimento de NF</button>
            </div>
          ))}
          {shoppingList.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-black">Nenhum item em falta ou pedido pendente.</div>
          )}
        </div>
      )}

      {/* Modal Insumo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">{editingId ? 'Editar' : 'Novo'} Insumo</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2"><X size={32}/></button>
             </div>
             <div className="space-y-6">
                <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-slate-50 rounded-[2rem] border font-black" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" placeholder="Ideal" value={formData.ideal_quantity} onChange={e => setFormData({...formData, ideal_quantity: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] border font-black text-center" />
                  <input type="number" placeholder="Atual" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] border font-black text-center" />
                  <input type="number" placeholder="Preço" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] border font-black text-center" />
                </div>
                <button onClick={handleSaveItem} disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs">Confirmar Cadastro</button>
             </div>
           </div>
        </div>
      )}

      {/* Modal Recebimento */}
      {isReceiveModalOpen && receivingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-3xl font-black tracking-tight">Receber: {receivingItem.name}</h3>
               <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 p-2"><X size={28}/></button>
             </div>
             <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                  <AlertCircle className="text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-800">Ao confirmar, o estoque sobe agora, mas a despesa ficará pendente no financeiro para o gestor pagar depois.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Quantidade Recebida</label>
                    <input type="number" value={receiveData.quantity} onChange={e => setReceiveData({...receiveData, quantity: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[1.5rem] font-black text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Preço Pago Un.</label>
                    <input type="number" value={receiveData.value} onChange={e => setReceiveData({...receiveData, value: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[1.5rem] font-black text-center" />
                  </div>
                </div>
                <button onClick={handleReceiveConfirm} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirmar Chegada de Mercadoria</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
