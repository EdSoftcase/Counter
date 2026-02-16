
import React, { useState, useEffect } from 'react';
import { 
  User, Building, CreditCard, Bell, Shield, Save, 
  CheckCircle2, Loader2, Smartphone, Mail, Lock, 
  Eye, EyeOff, Key, Download, Trash2, AlertTriangle,
  FileBadge, Globe, ShieldCheck, KeyRound, Upload
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { CompanyConfig } from '../types';

interface SettingsProps {
  onUpgradeRequest: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onUpgradeRequest }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado Fiscal
  const [fiscalConfig, setFiscalConfig] = useState<Partial<CompanyConfig>>({
    cnpj: '',
    ie: '',
    csc_id: '000001',
    csc_token: '',
    environment: 'homologation'
  });

  useEffect(() => {
    fetchFiscalConfig();
  }, []);

  const fetchFiscalConfig = async () => {
    try {
      const { data, error } = await supabase.from('company_configs').select('*').limit(1).maybeSingle();
      if (data) setFiscalConfig(data);
    } catch (err) {
      console.error("Erro ao carregar configs:", err);
    }
  };

  const handleSaveFiscal = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase.from('company_configs').select('id').limit(1).maybeSingle();
      
      let error;
      if (existing) {
        error = (await supabase.from('company_configs').update(fiscalConfig).eq('id', existing.id)).error;
      } else {
        error = (await supabase.from('company_configs').insert([{ ...fiscalConfig, company_name: 'Counter Enterprise User' }])).error;
      }

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Erro ao salvar configuração fiscal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'company', label: 'Dados da Empresa', icon: Building },
    { id: 'fiscal', label: 'NFC-e / Fiscal', icon: FileBadge },
    { id: 'billing', label: 'Plano e Assinatura', icon: CreditCard },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'fiscal':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="text-indigo-600" /> Configuração da NFC-e
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Integração Direta com SEFAZ</p>
                  </div>
                  <button 
                    onClick={handleSaveFiscal}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Salvar Dados Fiscais'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ do Emitente</label>
                    <input 
                      type="text" 
                      value={fiscalConfig.cnpj} 
                      onChange={e => setFiscalConfig({...fiscalConfig, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inscrição Estadual (IE)</label>
                    <input 
                      type="text" 
                      value={fiscalConfig.ie} 
                      onChange={e => setFiscalConfig({...fiscalConfig, ie: e.target.value})}
                      placeholder="Somente números" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID do Token CSC</label>
                    <input 
                      type="text" 
                      value={fiscalConfig.csc_id} 
                      onChange={e => setFiscalConfig({...fiscalConfig, csc_id: e.target.value})}
                      placeholder="Ex: 000001" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código CSC (Token SEFAZ)</label>
                    <input 
                      type="password" 
                      value={fiscalConfig.csc_token} 
                      onChange={e => setFiscalConfig({...fiscalConfig, csc_token: e.target.value})}
                      placeholder="Token alfanumérico gerado no site da Fazenda" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" 
                    />
                  </div>
               </div>

               <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><KeyRound size={80}/></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Certificado Digital A1</p>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                       <label className="flex-1 w-full p-6 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-white/40 cursor-pointer transition-all bg-white/5">
                          <Upload size={24}/>
                          <span className="text-xs font-bold uppercase tracking-widest">Anexar Arquivo .PFX / .P12</span>
                          <input type="file" className="hidden" accept=".pfx,.p12" />
                       </label>
                       <div className="w-full sm:w-64 space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400">Senha do Certificado</label>
                          <input type="password" placeholder="Sua senha secreta" className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-sm outline-none focus:border-white/30" />
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex gap-4">
               <Globe className="text-indigo-500 shrink-0" size={24} />
               <div>
                  <p className="text-xs font-black uppercase text-indigo-800 mb-2">Ambiente de Transmissão SEFAZ</p>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setFiscalConfig({...fiscalConfig, environment: 'homologation'})}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${fiscalConfig.environment === 'homologation' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-indigo-100'}`}
                     >
                       Homologação (Ambiente de Testes)
                     </button>
                     <button 
                       onClick={() => setFiscalConfig({...fiscalConfig, environment: 'production'})}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${fiscalConfig.environment === 'production' ? 'bg-rose-600 text-white' : 'bg-white text-rose-400 border border-rose-100'}`}
                     >
                       Produção (Valor Fiscal Real)
                     </button>
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-3 font-medium italic">Nota: No ambiente de produção, as notas emitidas geram impostos reais.</p>
               </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Perfil do Administrador</h3>
              <button 
                onClick={handleSaveFiscal}
                disabled={isSaving}
                className={`flex items-center gap-2 text-xs font-black uppercase px-4 py-2 rounded-lg transition-all tracking-widest ${
                  saveSuccess 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                }`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" defaultValue="Ricardo Santos" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input type="email" defaultValue="ricardo@empresa.com.br" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                <input type="text" defaultValue="Diretor de Operações" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                <input type="text" defaultValue="(11) 98888-7777" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-400" />
              </div>
            </div>
          </div>
        );
      case 'company':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Building size={20} className="text-indigo-500" /> Informações Jurídicas</h3>
               <button onClick={handleSaveFiscal} className="text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                 {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                 Atualizar Cadastro
               </button>
            </div>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                  <input type="text" defaultValue="Counter Enterprise LTDA" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                  <input type="text" defaultValue="12.345.678/0001-99" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço da Sede Matriz</label>
                <input type="text" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-2">
               <CreditCard size={20} className="text-indigo-500" /> Gestão de Assinatura
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-indigo-800 font-black text-2xl tracking-tighter">Plano Profissional</p>
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest">Renovação automática em 12/11/2023</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => alert('Abrindo portal de faturas (Stripe/Asaas)...')}
                  className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/50 transition-colors shadow-sm"
                >
                  Ver Faturas
                </button>
                <button 
                  onClick={onUpgradeRequest}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Upgrade de Plano
                </button>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-[0.2em]"><Bell size={18} className="text-indigo-500" /> Central de Alertas</h3>
              <button onClick={handleSaveFiscal} className="text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <Save size={14} /> Salvar Preferências
              </button>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <Smartphone className="text-slate-400" />
                  <div>
                    <p className="font-black text-slate-800 text-sm">Alertas Push Mobile</p>
                    <p className="text-xs text-slate-500 font-medium">Notificar gestor sobre atrasos em tempo real.</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-indigo-500 rounded-full appearance-none checked:bg-indigo-500 relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all bg-slate-300" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <Mail className="text-slate-400" />
                  <div>
                    <p className="font-black text-slate-800 text-sm">Relatórios Semanais</p>
                    <p className="text-xs text-slate-500 font-medium">Resumo de auditoria e perdas por e-mail.</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-indigo-500 rounded-full appearance-none checked:bg-indigo-500 relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all bg-slate-300" defaultChecked />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
            <div className="space-y-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-xl"><Shield size={20} className="text-indigo-500" /> Segurança da Conta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} defaultValue="password123" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha de Acesso</label>
                  <input type="password" placeholder="Mínimo 8 caracteres" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
              </div>
              <button onClick={handleSaveFiscal} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                <Key size={14} /> Redefinir Senha
              </button>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-6">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Gerenciamento de Dados Críticos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-6 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="text-left">
                    <p className="font-black text-slate-700 text-sm">Exportar Todos os Dados</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Backup em JSON/CSV</p>
                  </div>
                  <Download size={24} className="text-slate-400 group-hover:text-indigo-500" />
                </button>
                <button className="flex items-center justify-between p-6 border border-rose-100 bg-rose-50/20 rounded-2xl hover:bg-rose-50 transition-colors group text-left">
                  <div className="text-left text-rose-700">
                    <p className="font-black text-sm">Excluir Organização</p>
                    <p className="text-[10px] font-bold uppercase mt-1 opacity-70">Ação Irreversível</p>
                  </div>
                  <Trash2 size={24} className="text-rose-300 group-hover:text-rose-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex gap-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={24} />
              <p className="text-xs text-amber-800 font-bold leading-relaxed uppercase tracking-tight">
                Ambiente Protegido por Criptografia Militar. Seus logs de auditoria e fiscais são imutáveis e protegidos contra alteração por terceiros.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Carregando Módulo...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <header>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Configurações</h2>
        <p className="text-slate-500 font-medium">Gerencie sua conta, dados fiscais e níveis de segurança.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left ${
                activeSection === item.id 
                  ? 'bg-slate-900 text-white shadow-xl scale-[1.02] z-10' 
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? 'text-indigo-400' : 'text-slate-400'} />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
