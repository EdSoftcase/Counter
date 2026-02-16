
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Loader2, Camera, AlertTriangle, 
  TrendingDown, DollarSign, Percent, ChevronRight, 
  Utensils, Beer, Scale, Search, Save, Plus, Trash2, ArrowRight, X
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { StockItem } from '../types';

// Tipos auxiliares locais para a lógica de ficha técnica e auditoria
type ProductType = 'PIZZA' | 'BEBIDA' | 'SOBREMESA';

interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
}

interface RecipeItem {
  ingredient_id: string;
  quantity: number; // Quantidade usada na receita (ex: 0.300 kg de farinha)
}

// Mock inicial de produtos (em produção viria do banco)
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pizza de Mussarela', type: 'PIZZA', price: 45.00 },
  { id: 'p2', name: 'Pizza de Calabresa', type: 'PIZZA', price: 42.00 },
  { id: 'p3', name: 'Pizza Portuguesa', type: 'PIZZA', price: 48.00 },
  { id: 'b1', name: 'Coca-Cola 2L', type: 'BEBIDA', price: 12.00 },
  { id: 'b2', name: 'Heineken Long Neck', type: 'BEBIDA', price: 9.00 },
];

const Audit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'count' | 'analysis' | 'recipes'>('sales');
  const [loading, setLoading] = useState(true);
  
  // Dados do Banco
  const [inventory, setInventory] = useState<StockItem[]>([]);
  
  // Estados de Auditoria
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [salesInput, setSalesInput] = useState<Record<string, number>>({}); // Produto ID -> Qtd Vendida
  const [stockCountInput, setStockCountInput] = useState<Record<string, number>>({}); // Insumo ID -> Estoque Contado (Real)
  
  // Configurações
  const [lossLimit, setLossLimit] = useState(5); // Limite aceitável de perda em %
  const [recipes, setRecipes] = useState<Record<string, RecipeItem[]>>({}); // Produto ID -> Lista de Ingredientes
  
  // UI Auxiliares
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<string | null>(null);
  
  // Modal Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ name: '', type: 'PIZZA', price: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('inventory_items').select('*').order('name');
      setInventory(data || []);
      
      // Inicializa a contagem com o estoque atual do sistema (apenas como sugestão)
      const initialCounts: Record<string, number> = {};
      (data || []).forEach(item => {
        initialCounts[item.id] = item.current_stock;
      });
      setStockCountInput(initialCounts);

      // Mock de Receitas (Simulando banco de dados de fichas técnicas)
      // Em produção, buscaríamos da tabela 'product_recipes'
      if (data) {
        const farinha = data.find(i => i.name.toLowerCase().includes('farinha'))?.id;
        const queijo = data.find(i => i.name.toLowerCase().includes('mussarela') || i.name.toLowerCase().includes('queijo'))?.id;
        const calabresa = data.find(i => i.name.toLowerCase().includes('calabresa'))?.id;
        const coca = data.find(i => i.name.toLowerCase().includes('coca') || i.name.toLowerCase().includes('refrigerante'))?.id;

        const mockRecipes: Record<string, RecipeItem[]> = {};
        
        // Receita Pizza Mussarela
        if (farinha && queijo) {
          mockRecipes['p1'] = [
            { ingredient_id: farinha, quantity: 0.35 }, // 350g massa
            { ingredient_id: queijo, quantity: 0.30 }   // 300g queijo
          ];
        }
        // Receita Pizza Calabresa
        if (farinha && queijo && calabresa) {
          mockRecipes['p2'] = [
            { ingredient_id: farinha, quantity: 0.35 },
            { ingredient_id: queijo, quantity: 0.15 },
            { ingredient_id: calabresa, quantity: 0.20 }
          ];
        }
        // Receita Bebida (Coca) - 1 pra 1
        if (coca) {
          mockRecipes['b1'] = [
            { ingredient_id: coca, quantity: 1 }
          ];
        }

        setRecipes(mockRecipes);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Auditoria ---

  const calculateTheoreticalUsage = () => {
    const usage: Record<string, number> = {};

    // Para cada produto vendido
    Object.entries(salesInput).forEach(([productId, soldQty]) => {
      if (soldQty <= 0) return;

      const productRecipe = recipes[productId];
      if (productRecipe) {
        // Deduz ingredientes da ficha técnica
        productRecipe.forEach(item => {
          usage[item.ingredient_id] = (usage[item.ingredient_id] || 0) + (item.quantity * soldQty);
        });
      }
    });
    return usage;
  };

  const getAuditResults = () => {
    const theoreticalUsage = calculateTheoreticalUsage();
    
    return inventory.map(item => {
      const startStock = item.current_stock; // Estoque que estava no sistema antes da venda
      const consumedTheoretical = theoreticalUsage[item.id] || 0;
      const expectedStock = Math.max(0, startStock - consumedTheoretical);
      const countedStock = stockCountInput[item.id] !== undefined ? stockCountInput[item.id] : startStock;
      
      const difference = expectedStock - countedStock; // Se positivo, sumiu estoque (perda). Se negativo, sobrou (ganho/erro).
      const lossValue = difference * (item.cost_price || 0);
      
      // Cálculo de % de perda sobre o consumo
      // Se não houve consumo, baseia-se no estoque total
      const baseForCalc = startStock > 0 ? startStock : 1;
      const lossPercentage = (difference / baseForCalc) * 100;

      return {
        ...item,
        consumedTheoretical,
        expectedStock,
        countedStock,
        difference,
        lossValue,
        lossPercentage,
        isLoss: difference > 0, // Perda real (estoque físico menor que o esperado)
        isCritical: (difference > 0) && ((difference / baseForCalc) * 100 > lossLimit)
      };
    }).sort((a, b) => b.lossValue - a.lossValue); // Ordena pelos maiores prejuízos
  };

  const handleUpdateStock = async () => {
    if (!confirm("Isso atualizará o estoque oficial do sistema com as contagens realizadas e registrará as perdas. Confirmar?")) return;
    
    setLoading(true);
    try {
      const results = getAuditResults();
      
      for (const res of results) {
        // 1. Atualiza Estoque
        if (res.countedStock !== res.current_stock) {
          await supabase.from('inventory_items').update({ current_stock: res.countedStock }).eq('id', res.id);
        }

        // 2. Registra Perda Financeira se houver divergência significativa
        if (res.lossValue > 1) { // Só registra se perda > R$ 1,00 para não sujar log
           await supabase.from('financial_transactions').insert([{
             type: 'EXPENSE',
             category: 'INVENTORY', // Categoria de custo de mercadoria
             description: `QUEBRA DE ESTOQUE: ${res.name} (Furo: ${res.difference.toFixed(2)} ${res.unit})`,
             amount: res.lossValue,
             due_date: new Date().toISOString().split('T')[0],
             status: 'PAID' // Considera perda realizada
           }]);
        }
      }
      alert("Auditoria finalizada! Estoques ajustados e perdas contabilizadas.");
      setSalesInput({});
      fetchData();
      setActiveTab('sales');
    } catch (err) {
      alert("Erro ao processar auditoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProductForm.name) return;
    const newProd: Product = {
        id: crypto.randomUUID(),
        name: newProductForm.name,
        type: newProductForm.type as ProductType,
        price: Number(newProductForm.price)
    };
    setProducts([...products, newProd]);
    setIsProductModalOpen(false);
    setNewProductForm({ name: '', type: 'PIZZA', price: 0 });
  };

  // --- Renderização de Componentes ---

  const renderSalesTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black mb-1">Passo 1: Vendas do Turno</h3>
          <p className="opacity-80 text-sm">Informe a quantidade vendida de cada produto para calcularmos a baixa teórica.</p>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all flex items-center gap-2"
                title="Adicionar Novo Produto"
            >
                <Plus size={24} />
            </button>
            <Utensils size={40} className="opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(prod => (
          <div key={prod.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-black text-slate-800">{prod.name}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">{prod.type === 'PIZZA' ? 'Produção' : 'Revenda'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSalesInput(prev => ({...prev, [prod.id]: Math.max(0, (prev[prod.id] || 0) - 1)}))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black hover:bg-slate-200">-</button>
              <input 
                type="number" 
                value={salesInput[prod.id] || 0} 
                onChange={(e) => setSalesInput(prev => ({...prev, [prod.id]: Number(e.target.value)}))}
                className="w-12 text-center font-black text-xl outline-none"
              />
              <button onClick={() => setSalesInput(prev => ({...prev, [prod.id]: (prev[prod.id] || 0) + 1}))} className="w-8 h-8 rounded-full bg-slate-900 text-white font-black hover:bg-slate-700">+</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end pt-6">
        <button onClick={() => setActiveTab('count')} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
          Próximo: Contagem <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderCountTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black mb-1">Passo 2: Contagem Física</h3>
          <p className="opacity-80 text-sm">Conte o que sobrou nas prateleiras e geladeiras (Estoque Real).</p>
        </div>
        <Scale size={40} className="opacity-20" />
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl">
          <Search className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar insumo..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent font-bold w-full outline-none text-slate-700"
          />
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl">
              <div className="flex-1">
                <p className="font-black text-slate-800">{item.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sistema: {item.current_stock} {item.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Contado:</span>
                <input 
                  type="number" 
                  value={stockCountInput[item.id] !== undefined ? stockCountInput[item.id] : item.current_stock}
                  onChange={(e) => setStockCountInput(prev => ({...prev, [item.id]: Number(e.target.value)}))}
                  className="w-24 p-3 bg-slate-100 rounded-xl text-center font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500 w-8">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={() => setActiveTab('sales')} className="text-slate-400 font-bold uppercase text-xs hover:text-slate-600">Voltar</button>
        <button onClick={() => setActiveTab('analysis')} className="bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-600 transition-all">
          Finalizar e Analisar <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  );

  const renderAnalysisTab = () => {
    const results = getAuditResults();
    const totalLossValue = results.reduce((acc, r) => r.difference > 0 ? acc + r.lossValue : acc, 0);
    const criticalItems = results.filter(r => r.isCritical).length;

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Prejuízo Identificado</p>
            <p className="text-4xl font-black text-rose-400">R$ {totalLossValue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Valor total de desvio de estoque hoje.</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Itens Críticos</p>
            <div className="flex items-center gap-3">
               <span className={`text-4xl font-black ${criticalItems > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{criticalItems}</span>
               <AlertTriangle size={24} className={criticalItems > 0 ? 'text-rose-500' : 'text-slate-200'} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Produtos com perda acima de {lossLimit}%.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite Aceitável</span>
              <span className="text-xl font-black text-slate-800">{lossLimit}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="20" 
              value={lossLimit} 
              onChange={(e) => setLossLimit(Number(e.target.value))}
              className="w-full accent-slate-900 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-lg">Detalhamento dos Gargalos</h3>
            <button onClick={handleUpdateStock} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg">
              Confirmar Ajuste de Estoque
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-4">Insumo</th>
                  <th className="px-8 py-4 text-center">Início</th>
                  <th className="px-8 py-4 text-center">Consumo Teórico</th>
                  <th className="px-8 py-4 text-center">Deveria Ter</th>
                  <th className="px-8 py-4 text-center">Contado</th>
                  <th className="px-8 py-4 text-center">Diferença</th>
                  <th className="px-8 py-4 text-right">Prejuízo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {results.map(r => (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${r.isCritical ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-700">{r.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{r.unit}</p>
                    </td>
                    <td className="px-8 py-4 text-center text-slate-500 font-bold">{r.current_stock}</td>
                    <td className="px-8 py-4 text-center text-indigo-600 font-black">-{r.consumedTheoretical.toFixed(2)}</td>
                    <td className="px-8 py-4 text-center text-slate-700 font-bold bg-slate-50 rounded-lg">{r.expectedStock.toFixed(2)}</td>
                    <td className="px-8 py-4 text-center font-bold border-2 border-slate-100 rounded-lg">{r.countedStock}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md font-black text-[10px] ${r.difference > 0 ? 'bg-rose-100 text-rose-700' : r.difference < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {r.difference > 0 ? '-' : '+'}{Math.abs(r.difference).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-black text-slate-800">
                      {r.lossValue > 0 ? (
                        <span className="text-rose-600">R$ {r.lossValue.toFixed(2)}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRecipesTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right">
       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 border-r border-slate-100 pr-8">
             <h3 className="font-black text-slate-800 mb-6 text-lg">Produtos de Venda</h3>
             <div className="space-y-2">
                {products.map(prod => (
                  <button 
                    key={prod.id} 
                    onClick={() => setSelectedProductForRecipe(prod.id)}
                    className={`w-full text-left p-4 rounded-2xl font-bold text-sm transition-all flex justify-between items-center ${selectedProductForRecipe === prod.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <span>{prod.name}</span>
                    <ChevronRight size={16} className={selectedProductForRecipe === prod.id ? 'text-white' : 'text-slate-300'} />
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1">
             {selectedProductForRecipe ? (
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-xl">Composição (Ficha Técnica)</h3>
                    <button className="text-emerald-600 font-black text-xs uppercase flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Plus size={14} /> Adicionar Ingrediente
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {(recipes[selectedProductForRecipe] || []).map((item, idx) => {
                      const stockItem = inventory.find(i => i.id === item.ingredient_id);
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-xl shadow-sm"><Scale size={16} className="text-indigo-500"/></div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{stockItem?.name || 'Item Desconhecido'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Estoque: {stockItem?.category}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                             <div className="text-right">
                               <p className="font-black text-slate-800">{item.quantity} {stockItem?.unit}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase">Por unidade vendida</p>
                             </div>
                             <button className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                           </div>
                        </div>
                      );
                    })}
                    {(!recipes[selectedProductForRecipe] || recipes[selectedProductForRecipe].length === 0) && (
                      <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Nenhum ingrediente vinculado a este produto.
                      </div>
                    )}
                 </div>
                 
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      A ficha técnica define quanto será baixado do estoque automaticamente a cada venda. Mantenha as quantidades precisas para evitar falsos alertas de perda.
                    </p>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                 <Utensils size={64} className="opacity-20" />
                 <p className="font-bold text-sm">Selecione um produto para editar sua receita.</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Auditoria & Perdas</h2>
          <p className="text-slate-500 font-medium">Controle de gargalos financeiros e fichas técnicas.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border shadow-sm w-full lg:w-auto overflow-x-auto">
           {[
             { id: 'sales', label: '1. Vendas', icon: DollarSign },
             { id: 'count', label: '2. Contagem', icon: Scale },
             { id: 'analysis', label: '3. Resultado', icon: Percent },
             { id: 'recipes', label: 'Fichas Técnicas', icon: Utensils }
           ].map(tab => {
             const Icon = tab.icon;
             return (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)} 
                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Icon size={14} /> {tab.label}
               </button>
             );
           })}
        </div>
      </header>

      {loading ? <Loader2 className="animate-spin mx-auto mt-20 text-emerald-500" size={48} /> : (
        <>
          {activeTab === 'sales' && renderSalesTab()}
          {activeTab === 'count' && renderCountTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
          {activeTab === 'recipes' && renderRecipesTab()}
        </>
      )}

      {/* Modal Adicionar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800">Novo Produto de Venda</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Produto</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Pizza de Atum, Coca-Cola 350ml" 
                     value={newProductForm.name} 
                     onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} 
                     className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-bold outline-none" 
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Categoria</label>
                      <select 
                        value={newProductForm.type} 
                        onChange={e => setNewProductForm({...newProductForm, type: e.target.value as any})} 
                        className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-bold outline-none"
                      >
                        <option value="PIZZA">Pizza / Produção</option>
                        <option value="BEBIDA">Bebida / Revenda</option>
                        <option value="SOBREMESA">Sobremesa</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Preço de Venda</label>
                      <input 
                        type="number" 
                        placeholder="R$ 0.00" 
                        value={newProductForm.price} 
                        onChange={e => setNewProductForm({...newProductForm, price: Number(e.target.value)})} 
                        className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-bold outline-none text-center" 
                      />
                   </div>
                </div>

                <button onClick={handleAddProduct} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                  <Plus size={20} /> Cadastrar Produto
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
