
import React, { useState } from 'react';
import { 
  User, Building, CreditCard, Bell, Shield, Save, 
  CheckCircle2, Loader2, Smartphone, Mail, Lock, 
  Eye, EyeOff, Key, Download, Trash2, AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  onUpgradeRequest: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onUpgradeRequest }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    // Simula chamada de API para salvar as configurações
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const menuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'company', label: 'Dados da Empresa', icon: Building },
    { id: 'billing', label: 'Plano e Assinatura', icon: CreditCard },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Perfil do Administrador</h3>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all ${
                  saveSuccess 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input type="text" defaultValue="Ricardo Santos" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail Corporativo</label>
                <input type="email" defaultValue="ricardo@empresa.com.br" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                <input type="text" defaultValue="Diretor de Operações" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input type="text" defaultValue="(11) 98888-7777" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        );
      case 'company':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building size={18} className="text-emerald-500" /> Informações Jurídicas</h3>
               <button onClick={handleSave} className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                 {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                 Atualizar Cadastro
               </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Razão Social</label>
                  <input type="text" defaultValue="Counter Enterprise LTDA" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                  <input type="text" defaultValue="12.345.678/0001-99" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Sede</label>
                <input type="text" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <CreditCard size={18} className="text-emerald-500" /> Seu Plano Atual
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100 gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-emerald-800 font-black text-xl">Plano Profissional</p>
                <p className="text-emerald-600 text-sm">Próxima renovação em 12/11/2023</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => alert('Abrindo portal de faturas (Stripe/Asaas)...')}
                  className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                >
                  Gerenciar Faturas
                </button>
                <button 
                  onClick={onUpgradeRequest}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Upgrade de Plano
                </button>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Bell size={18} className="text-emerald-500" /> Central de Alertas</h3>
              <button onClick={handleSave} className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                 <Save size={14} /> Salvar Preferências
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex gap-3">
                  <Smartphone className="text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Notificações Push</p>
                    <p className="text-xs text-slate-500">Alertas de atraso crítico direto no celular.</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-emerald-500 rounded-full appearance-none checked:bg-emerald-500 relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all bg-slate-300" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex gap-3">
                  <Mail className="text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Relatórios Semanais por E-mail</p>
                    <p className="text-xs text-slate-500">Receba o resumo de conformidade toda segunda-feira.</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-emerald-500 rounded-full appearance-none checked:bg-emerald-500 relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all bg-slate-300" defaultChecked />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Shield size={18} className="text-emerald-500" /> Segurança da Conta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-500 uppercase">Senha Atual</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} defaultValue="password123" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label>
                  <input type="password" placeholder="Mínimo 8 caracteres" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                <Key size={16} /> Redefinir Senha
              </button>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Gerenciamento de Dados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="text-left">
                    <p className="font-bold text-slate-700 text-sm">Exportar Todos os Dados</p>
                    <p className="text-[10px] text-slate-500">Backup em formato JSON/CSV</p>
                  </div>
                  <Download size={20} className="text-slate-400 group-hover:text-emerald-500" />
                </button>
                <button className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-xl hover:bg-red-50 transition-colors group">
                  <div className="text-left text-red-700">
                    <p className="font-bold text-sm">Excluir Organização</p>
                    <p className="text-[10px] opacity-70">Ação irreversível de purga de dados</p>
                  </div>
                  <Trash2 size={20} className="text-red-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <p className="text-xs text-amber-800">
                Sua conta está protegida por criptografia de ponta a ponta. Logs de auditoria são imutáveis e protegidos contra alteração por terceiros.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configurações do Sistema</h2>
        <p className="text-slate-500">Gerencie sua conta, dados da empresa e níveis de segurança.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeSection === item.id 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200/50' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? 'text-emerald-600' : 'text-slate-400'} />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
