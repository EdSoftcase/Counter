
import React, { useState, useEffect } from 'react';
import { 
  Loader2, Edit3, Plus, Search, 
  CheckCircle2, Truck, Camera, X, Sparkles, Wand2, ArrowRight, ShoppingCart,
  UtensilsCrossed, Beer, Hammer, AlertCircle, Package, DollarSign,
  FileBadge, Info
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
  const [modalTab, setModalTab] = useState<'BASIC' | 'FISCAL'>('BASIC');
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
    cost_price: 0,
    ncm: '21069090',
    cfop: '5102',
    tax_origin: 0,
    cest: ''
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
        await supabase.from('financial_transactions').update({
          amount: totalAmount,
          description: `COMPRA: ${targetItem.name} [NF RECEBIDA - AGUARDANDO PAGAMENTO]`,
        }).eq('id', pendingTrans[0].id);
      } else {
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
      alert("Mercadoria recebida e enviada ao financeiro!");
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
    } catch (err: any) { 
      console.error(err);
      alert(err.message || "Erro ao analisar imagem.");
    } finally { setIsAnalyzingIA(false); }
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
    setModalTab('BASIC');
    setFormData({
      name: item.name,
      unit: item.unit || 'UN',
      category: item.category || 'PERECIVEIS',
      ideal_quantity: item.ideal_quantity || 0,
      current_stock: item.current_stock || 0,
      cost_price: item.cost_price || 0,
      ncm: (item as any).ncm || '21069090',
      cfop: (item as any).cfop || '5102',
      tax_origin: (item as any).tax_origin || 0,
      cest: (item as any).cest || ''
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
          <button onClick={() => { setEditingId(null); setModalTab('BASIC'); setFormData({name: '', unit: 'UN', category: activeCategory, ideal_quantity: 0, current_stock: 0, cost_price: 0, ncm: '21069090', cfop: '5102', tax_origin: 0, cest: ''}); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
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
                    <th className="px-10 py-6">Fiscal</th>
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
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg w-fit">
                           <FileBadge size={12}/> {(item as any).ncm || 'Sem NCM'}
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <div className="flex justify-end gap-3">
                           <button onClick={() => handleToggleOrder(item)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${item.is_ordered ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                             {item.is_ordered ? <Truck size={14}/> : <ShoppingCart size={14}/>} 
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
                 {item.is_ordered && <Truck className="text-amber-500" size={24} />}
               </div>
               <button onClick={() => { setReceivingItem(item); setReceiveData({quantity: Math.max(0, item.ideal_quantity - item.current_stock), value: item.cost_price}); setIsReceiveModalOpen(true); }} className="w-full py-5 bg-indigo-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Receber Mercadoria</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Insumo/Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black tracking-tight">{editingId ? 'Editar' : 'Novo'} Insumo</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"><X size={32}/></button>
             </div>

             <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 gap-1">
                <button onClick={() => setModalTab('BASIC')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'BASIC' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Informações Básicas</button>
                <button onClick={() => setModalTab('FISCAL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'FISCAL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}>Dados Tributários (NFC-e)</button>
             </div>

             <div className="space-y-6">
                {modalTab === 'BASIC' ? (
                  <div className="space-y-6 animate-in slide-in-from-left-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto/Insumo</label>
                       <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Qtd Ideal</label>
                         <input type="number" value={formData.ideal_quantity} onChange={e => setFormData({...formData, ideal_quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-center" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Saldo Atual</label>
                         <input type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-center" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Custo Médio</label>
                         <input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-center" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                        <Info className="text-amber-500 shrink-0" size={20}/>
                        <p className="text-[10px] text-amber-800 font-bold leading-tight">
                          Códigos exigidos pela SEFAZ. Se não souber, peça auxílio à sua contabilidade ou use os padrões sugeridos pela IA Counter.
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NCM (8 dígitos)</label>
                          <input type="text" value={formData.ncm} onChange={e => setFormData({...formData, ncm: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CFOP Padrão</label>
                          <input type="text" value={formData.cfop} onChange={e => setFormData({...formData, cfop: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código CEST (Opcional)</label>
                          <input type="text" value={formData.cest} onChange={e => setFormData({...formData, cest: e.target.value})} placeholder="Ex: 1708700" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem da Mercadoria</label>
                          <select value={formData.tax_origin} onChange={e => setFormData({...formData, tax_origin: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black">
                             <option value={0}>0 - Nacional</option>
                             <option value={1}>1 - Importada (Direta)</option>
                             <option value={2}>2 - Importada (Mercado Interno)</option>
                          </select>
                        </div>
                     </div>
                  </div>
                )}
                
                <div className="flex gap-4 pt-6 border-t">
                   <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs">Descartar</button>
                   <button onClick={handleSaveItem} disabled={isSaving} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95">
                     {isSaving ? <Loader2 className="animate-spin" /> : 'Confirmar Cadastro'}
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Quick Scan (IA) Modal - Reusando o componente já existente */}
      {isQuickScanOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-3xl font-black tracking-tight">Leitura de Nota Fiscal</h3>
                 <button onClick={() => setIsQuickScanOpen(false)} className="text-slate-400 p-2"><X size={28}/></button>
              </div>

              {isAnalyzingIA ? (
                <div className="py-20 flex flex-col items-center justify-center gap-6 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-indigo-500 rounded-full animate-ping opacity-20 absolute inset-0"></div>
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center relative z-10 shadow-xl">
                      <Sparkles size={32} className="animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl">Analisando Imagem...</h4>
                    <p className="text-slate-400 font-bold text-xs mt-1">Nossa IA está lendo a nota fiscal.</p>
                  </div>
                </div>
              ) : !evidencePhoto ? (
                <div className="py-12 flex flex-col items-center gap-6">
                  <div onClick={() => simulateCamera(true)} className="w-full h-64 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                    <Camera size={64} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase text-xs tracking-widest">Tirar Foto da NF ou Produto</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom">
                   <div className="w-full h-48 bg-slate-100 rounded-[2.5rem] overflow-hidden relative border border-slate-200">
                      <img src={evidencePhoto} alt="Evidence" className="w-full h-full object-cover opacity-80" />
                   </div>

                   {quickScanResult.item ? (
                     <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 text-center">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Produto Identificado</p>
                        <h3 className="font-black text-emerald-900 text-xl">{quickScanResult.item.name}</h3>
                     </div>
                   ) : (
                     <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 text-center">
                        <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
                        <p className="font-black text-amber-800 text-sm">Produto não encontrado.</p>
                     </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={quickScanResult.quantity} onChange={(e) => setQuickScanResult({...quickScanResult, quantity: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[1.5rem] font-black text-center text-lg" placeholder="Qtd" />
                      <input type="number" value={quickScanResult.price} onChange={(e) => setQuickScanResult({...quickScanResult, price: Number(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-[1.5rem] font-black text-center text-lg" placeholder="Preço" />
                   </div>

                   {quickScanResult.item && (
                      <button onClick={handleReceiveConfirm} disabled={isSaving} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl">Confirmar Entrada</button>
                   )}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
