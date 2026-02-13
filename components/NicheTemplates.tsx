
import React, { useState } from 'react';
import { Stethoscope, Utensils, ShoppingBag, Truck, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const NicheTemplates: React.FC = () => {
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = (id: string) => {
    setApplying(id);
    setTimeout(() => {
      setApplying(null);
      alert(`O modelo operacional foi aplicado! Agora você possui rotinas profissionais de Restaurante/Pizzaria configuradas na aba "Rotinas".`);
    }, 2000);
  };

  const templates = [
    {
      id: 'HEALTH',
      name: 'Clínicas & Saúde',
      icon: Stethoscope,
      color: 'bg-blue-500',
      routines: ['Higienização de Autoclave', 'Checklist de Consultório', 'Controle de Validade de Medicamentos', 'Aferição de Geladeira de Vacinas']
    },
    {
      id: 'FOOD',
      name: 'Restaurantes & Pizzarias',
      icon: Utensils,
      color: 'bg-orange-500',
      routines: [
        'Abertura de Cozinha & Gás', 
        'Limpeza de Câmara Fria', 
        'Controle de Validade (PVPS)', 
        'Recebimento de Mercadoria',
        'Checklist de Fechamento de Coifa'
      ]
    },
    {
      id: 'RETAIL',
      name: 'Lojas & Varejo',
      icon: ShoppingBag,
      color: 'bg-purple-500',
      routines: ['Organização de Vitrine', 'Fechamento de Caixa', 'Inventário Rotativo', 'Checklist de Fachada']
    }
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Modelos de Negócio</h2>
          <p className="text-slate-500">Acelere seu setup carregando rotinas prontas validadas pelo mercado.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Powered by Counter AI</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group cursor-pointer relative flex flex-col h-full border-b-4 border-b-slate-100 hover:border-b-emerald-400">
            {applying === template.id && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 text-center p-6">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <div>
                  <p className="font-black text-slate-800 text-lg">Injetando Rotinas...</p>
                  <p className="text-sm text-slate-500">Configurando checklists e níveis de auditoria.</p>
                </div>
              </div>
            )}
            <div className={`${template.color} p-8 text-white flex justify-between items-center`}>
              <div className="p-3 bg-white/20 rounded-2xl">
                <template.icon size={32} />
              </div>
              <button 
                onClick={() => handleApply(template.id)}
                className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg"
              >
                Ativar
              </button>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="font-black text-xl text-slate-800 mb-6">{template.name}</h3>
              <div className="space-y-4 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Checklists Inclusos:</p>
                {template.routines.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium list-none">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    </div>
                    {r}
                  </li>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50">
                 <p className="text-xs text-slate-400 italic">Este pacote adiciona {template.routines.length} rotinas estruturadas ao seu painel.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NicheTemplates;
