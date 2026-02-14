
import React, { useState } from 'react';
import { Stethoscope, Utensils, ShoppingBag, Truck, CheckCircle2, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Frequency } from '../types';

const NicheTemplates: React.FC = () => {
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (!confirm(`Deseja importar as ${template.routines.length} rotinas padrão de "${template.name}"?`)) return;

    setApplying(templateId);
    
    try {
      // Inserindo com IDs explícitos para garantir que a tabela aceite o registro
      const routinesToInsert = template.routines.map(title => ({
        id: crypto.randomUUID(),
        title,
        description: `Rotina padrão para o setor de ${template.name}. Verifique os itens de conformidade.`,
        frequency: Frequency.DAILY,
        deadline: '12:00'
      }));

      const { data, error } = await supabase.from('routines').insert(routinesToInsert).select();

      if (error) {
        console.error("Erro Supabase:", error);
        throw new Error(error.message);
      }

      alert(`Sucesso! Foram criadas ${data?.length} rotinas no seu painel operacional.`);
    } catch (error: any) {
      console.error("Erro ao aplicar template:", error);
      alert(`Erro ao conectar com o banco: ${error.message}.`);
    } finally {
      setApplying(null);
    }
  };

  const templates = [
    {
      id: 'HEALTH',
      name: 'Clínicas & Saúde',
      icon: Stethoscope,
      color: 'bg-blue-600',
      routines: ['Higienização de Autoclave', 'Checklist de Consultório', 'Controle de Validade de Medicamentos', 'Aferição de Geladeira de Vacinas']
    },
    {
      id: 'FOOD',
      name: 'Restaurantes & Pizzarias',
      icon: Utensils,
      color: 'bg-orange-600',
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
      color: 'bg-purple-600',
      routines: ['Organização de Vitrine', 'Fechamento de Caixa', 'Inventário Rotativo', 'Checklist de Fachada']
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Modelos de Negócio</h2>
          <p className="text-slate-500">Acelere seu setup carregando rotinas prontas validadas pelo mercado.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Powered by Counter AI</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden hover:shadow-2xl transition-all group relative flex flex-col h-full border-b-8 border-b-slate-100 hover:border-b-emerald-400">
            {applying === template.id && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 text-center p-6 text-emerald-600 animate-in fade-in">
                <Loader2 className="animate-spin" size={48} />
                <div>
                  <p className="font-black text-slate-800 text-lg">Injetando no Banco...</p>
                  <p className="text-sm text-slate-500 font-medium">Sincronizando modelos com Supabase.</p>
                </div>
              </div>
            )}
            <div className={`${template.color} p-10 text-white flex justify-between items-center relative overflow-hidden`}>
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                 <template.icon size={120} />
               </div>
              <div className="p-4 bg-white/20 rounded-2xl shadow-inner relative z-10">
                <template.icon size={36} />
              </div>
              <button 
                onClick={() => handleApply(template.id)}
                className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-110 shadow-2xl flex items-center gap-2 active:scale-95 relative z-10"
              >
                <PlusCircle size={14} /> Ativar Modelo
              </button>
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <h3 className="font-black text-2xl text-slate-800 mb-8">{template.name}</h3>
              <div className="space-y-5 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-4">Checklists Inclusos:</p>
                {template.routines.map((r, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm text-slate-600 font-bold list-none">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    {r}
                  </li>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NicheTemplates;
