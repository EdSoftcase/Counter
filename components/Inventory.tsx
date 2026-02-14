
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { StockItem } from '../types';

const Inventory: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'shopping' | 'audit'>('stock');
  const [insumos, setInsumos] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (!error && data) setInsumos(data);
      setLoading(false);
    };
    fetchInventory();
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Suprimentos</h2>
          <p className="text-slate-500">Controle total de estoque sincronizado na nuvem.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {['stock', 'shopping', 'audit'].map(tab => (
            <button key={tab} onClick={() => setActiveSubTab(tab as any)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeSubTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              {tab === 'stock' ? 'Estoque' : tab === 'shopping' ? 'Compras' : 'Auditoria'}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : activeSubTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Item</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Saldo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Ideal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insumos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-800">{item.name}</td>
                  {/* Fixed: currentStock -> current_stock to match StockItem interface */}
                  <td className="px-8 py-6 text-center font-mono font-black text-emerald-600">{item.current_stock} {item.unit}</td>
                  {/* Fixed: idealQuantity -> ideal_quantity to match StockItem interface */}
                  <td className="px-8 py-6 text-right font-mono font-bold text-slate-400">{item.ideal_quantity} {item.unit}</td>
                </tr>
              ))}
              {insumos.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    Nenhum insumo encontrado no Supabase (inventory_items).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;