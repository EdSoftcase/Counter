
import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  CalendarCheck,
  Database,
  Clock,
  Briefcase,
  Settings,
  LogOut,
  Users,
  BarChart3,
  PackageSearch
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  onLogout: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, onLogout, isOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'timeclock', label: 'Registrar Ponto', icon: Clock, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { id: 'routines', label: 'Rotinas', icon: ClipboardList, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'execution', label: 'Executar Tarefas', icon: CheckCircle2, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { id: 'inventory', label: 'Suprimentos', icon: PackageSearch, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'users', label: 'Funcionários', icon: Users, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'audit', label: 'Auditoria & Logs', icon: ShieldCheck, roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'niches', label: 'Modelos de Nicho', icon: Briefcase, roles: ['ADMIN'] },
    { id: 'proposal', label: 'Proposta Comercial', icon: Zap, roles: ['ADMIN'] },
    { id: 'validation', label: 'Plano 30 Dias', icon: CalendarCheck, roles: ['ADMIN'] },
    { id: 'database', label: 'Arquitetura', icon: Database, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 flex items-center justify-between border-b border-slate-800/50 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            C
          </div>
          <div>
            <h1 className="font-black text-xl leading-tight tracking-tighter">Counter</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50 mt-auto bg-slate-900/50 backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings size={20} />
          <span className="text-sm font-bold">Configurações</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Sair do Painel</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
