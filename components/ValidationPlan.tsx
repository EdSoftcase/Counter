
import React from 'react';
import { Calendar, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const ValidationPlan: React.FC = () => {
  const steps = [
    { day: 1, title: 'Mapeamento de Processos', description: 'Listar todas as tarefas manuais críticas de abertura, fechamento e limpeza.', type: 'setup' },
    { day: 3, title: 'Cadastro e Unidades', description: 'Inserir dados da empresa, unidades e cadastrar os primeiros 5 funcionários.', type: 'setup' },
    { day: 5, title: 'Definição de Rotinas', description: 'Criar as 3 principais rotinas no sistema com exigência de foto e GPS.', type: 'setup' },
    { day: 7, title: 'Treinamento Operacional', description: 'Demonstrar o uso do app para os operadores nas unidades piloto.', type: 'execution' },
    { day: 8, title: 'Início da Operação Digital', description: 'Primeiro dia 100% digital. Monitoramento de suporte em tempo real.', type: 'execution' },
    { day: 15, title: 'Primeiro Ciclo de Auditoria', description: 'Supervisor revisa as evidências da primeira semana e aplica feedbacks.', type: 'audit' },
    { day: 22, title: 'Ajuste de Fluxo', description: 'Otimização de horários e descrição das tarefas baseada nos dados iniciais.', type: 'audit' },
    { day: 30, title: 'Relatório de Valor', description: 'Análise de % de conformidade e ROI (redução de perdas e erros).', type: 'value' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Plano de Validação (30 Dias)</h2>
        <p className="text-slate-500">Cronograma estratégico para implementar cultura de processos digitais.</p>
      </header>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[2.25rem] top-4 bottom-4 w-0.5 bg-slate-200"></div>

        <div className="space-y-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-6 group">
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center font-bold text-sm ${
                  step.day <= 8 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  D{step.day}
                </div>
              </div>
              
              <div className={`flex-1 p-6 rounded-2xl border transition-all ${
                step.day <= 8 
                  ? 'bg-white border-emerald-100 shadow-md ring-1 ring-emerald-50/50' 
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
                  {step.day <= 8 ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-slate-300" />
                  )}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                <div className="mt-4 flex items-center gap-2">
                   <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                     step.type === 'setup' ? 'bg-blue-100 text-blue-700' : 
                     step.type === 'execution' ? 'bg-purple-100 text-purple-700' :
                     step.type === 'audit' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                   }`}>
                     {step.type}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="flex-1 space-y-2">
          <h4 className="text-xl font-bold">Pronto para digitalizar seu negócio?</h4>
          <p className="text-emerald-50 text-sm opacity-90">Ao final dos 30 dias, você terá total controle sobre a execução das suas unidades e uma equipe mais responsável.</p>
        </div>
        <button className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors whitespace-nowrap flex items-center gap-2">
          Iniciar Onboarding <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ValidationPlan;
