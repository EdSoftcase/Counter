
import React from 'react';
import { 
  LayoutDashboard, ClipboardList, CheckCircle2, ShieldCheck, Zap,
  CalendarCheck, Database, Clock, Briefcase, Settings as SettingsIcon, LogOut,
  Users, BarChart3, PackageSearch, ShieldAlert, Wallet, Calculator,
  Store, ChevronRight
} from 'lucide-react';
import { AppModule } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  permittedModules: (AppModule | string)[];
  onLogout: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, permittedModules, onLogout, isOpen }) => {
  
  const menuGroups = [
    {
      label: 'Operacional',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'pos', label: 'Vendas & Salão', icon: Store, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
        { id: 'cash_register', label: 'Frente de Caixa', icon: Calculator, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
        { id: 'timeclock', label: 'Registrar Ponto', icon: Clock, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
        { id: 'execution', label: 'Executar Tarefas', icon: CheckCircle2, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
      ]
    },
    {
      label: 'Gestão Enterprise',
      items: [
        { id: 'inventory', label: 'Suprimentos', icon: PackageSearch, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'finance', label: 'Financeiro', icon: Wallet, roles: ['ADMIN'] },
        { id: 'compliance', label: 'RH & Conformidade', icon: ShieldAlert, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'users', label: 'Funcionários', icon: Users, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'routines', label: 'Config. de Rotinas', icon: ClipboardList, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR'] },
      ]
    },
    {
      label: 'Engenharia',
      items: [
        { id: 'audit', label: 'Auditoria & Logs', icon: ShieldCheck, roles: ['ADMIN', 'SUPERVISOR'] },
        { id: 'niches', label: 'Modelos de Nicho', icon: Briefcase, roles: ['ADMIN'] },
        { id: 'proposal', label: 'Proposta Comercial', icon: Zap, roles: ['ADMIN'] },
        { id: 'database', label: 'Arquitetura SQL', icon: Database, roles: ['ADMIN'] },
      ]
    }
  ];

  const checkAccess = (id: string, roles: string[]) => {
    const hasRoleAccess = roles.includes(userRole);
    const hasModulePermission = userRole === 'ADMIN' || permittedModules.includes(id);
    return hasRoleAccess && hasModulePermission;
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-xl">
            C
          </div>
          <div>
            <h1 className="font-black text-xl leading-tight tracking-tighter">Counter</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter(item => checkAccess(item.id, item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{group.label}</h3>
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                      activeTab === item.id 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                    <span className="font-bold text-xs uppercase tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* RODAPÉ DE CONFIGURAÇÕES E SAÍDA */}
      <div className="p-4 border-t border-slate-800/50 space-y-2 bg-slate-900/80 backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
            activeTab === 'settings' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <SettingsIcon size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Configurações</span>
          </div>
          <ChevronRight size={14} className={activeTab === 'settings' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Sair do Painel</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
