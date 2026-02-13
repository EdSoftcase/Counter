
import React from 'react';
import { Check, Zap, Target, ShieldCheck, BarChart3, Users } from 'lucide-react';

const Proposal: React.FC = () => {
  const plans = [
    {
      name: 'Básico',
      price: '149',
      description: 'Ideal para um único estabelecimento.',
      users: 'Até 5 usuários',
      features: ['1 Unidade', 'Checklist com Fotos', 'Geolocalização', 'Relatórios Básicos'],
      cta: 'Começar Agora',
      recommended: false
    },
    {
      name: 'Profissional',
      price: '349',
      description: 'Perfeito para crescer seu negócio.',
      users: 'Até 15 usuários',
      features: ['Multiunidade (Até 3)', 'Auditoria Avançada', 'Alertas em Tempo Real', 'Dashboard de Performance'],
      cta: 'Plano Mais Vendido',
      recommended: true
    },
    {
      name: 'Rede',
      price: '799',
      description: 'Escalabilidade para franquias e redes.',
      users: 'Ilimitado',
      features: ['Unidades Ilimitadas', 'Exportação Customizada', 'API de Integração', 'Suporte Prioritário 24/7'],
      cta: 'Falar com Consultor',
      recommended: false
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Proposta Comercial: Counter Enterprise</h2>
        <p className="text-lg text-slate-600">A solução definitiva para transformar processos manuais em eficiência operacional rastreável.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative p-8 bg-white rounded-2xl border ${plan.recommended ? 'border-emerald-500 shadow-xl scale-105 z-10' : 'border-slate-200 shadow-sm'} flex flex-col`}
          >
            {plan.recommended && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
                Recomendado
              </span>
            )}
            <h3 className="text-2xl font-bold text-slate-800">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-900">R$ {plan.price}</span>
              <span className="ml-1 text-slate-500">/mês</span>
            </div>
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">{plan.description}</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <Users size={18} className="text-emerald-500" />
                {plan.users}
              </li>
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-slate-600">
                  <Check size={18} className="text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`mt-10 w-full py-3 px-6 rounded-xl font-bold transition-all ${
              plan.recommended 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg' 
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <section className="bg-slate-900 rounded-3xl p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Zap size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-bold mb-6">Por que escolher o Counter?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <Target size={20} />
              </div>
              <h4 className="font-bold text-lg">Responsabilidade Real</h4>
              <p className="text-slate-400 text-sm">Evidências fotográficas e GPS garantem que a tarefa foi feita no local e hora certa.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-lg">Auditoria Simplificada</h4>
              <p className="text-slate-400 text-sm">Elimine pilhas de papel e mensagens perdidas no WhatsApp com um log centralizado.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Proposal;
