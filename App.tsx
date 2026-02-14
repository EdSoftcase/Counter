
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Execution from './components/Execution';
import Audit from './components/Audit';
import Proposal from './components/Proposal';
import ValidationPlan from './components/ValidationPlan';
import DatabaseSchema from './components/DatabaseSchema';
import TimeClock from './components/TimeClock';
import NicheTemplates from './components/NicheTemplates';
import Settings from './components/Settings';
import Employees from './components/Employees';
import Reports from './components/Reports';
import Login from './components/Login';
import RoutineManager from './components/RoutineManager';
import Inventory from './components/Inventory';
import Compliance from './components/Compliance';
import Finance from './components/Finance';
import { UserRole, AppModule } from './types';
import { Bell, Search, Menu, Clock, CheckCircle2, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [userName, setUserName] = useState('');
  const [permittedModules, setPermittedModules] = useState<(AppModule | string)[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setShowConfigWarning(true);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleLogin = (role: UserRole, name: string, modules: (AppModule | string)[]) => {
    setUserRole(role);
    setUserName(name);
    setPermittedModules(modules);
    setIsLoggedIn(true);
    
    // Se o usuário não tem acesso ao dashboard, redireciona para o primeiro módulo que ele tem
    if (role !== UserRole.ADMIN && !modules.includes('dashboard')) {
      setActiveTab(modules[0] as string || 'timeclock');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      setIsLoggedIn(false);
      setActiveTab('dashboard');
      setPermittedModules([]);
    }
  };

  const renderContent = () => {
    // PROTEÇÃO DE ACESSO: Se não for ADMIN e não estiver nos módulos permitidos, bloqueia
    const isAllowed = userRole === UserRole.ADMIN || permittedModules.includes(activeTab as AppModule);

    if (!isAllowed && activeTab !== 'dashboard' && activeTab !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center shadow-inner">
            <Lock size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">Acesso Restrito</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Você não tem permissão para acessar o módulo "{activeTab}". Entre em contato com seu gestor.</p>
          </div>
          <button onClick={() => setActiveTab('dashboard')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest">Voltar ao Início</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard userRole={userRole} userName={userName} />;
      case 'timeclock': return <TimeClock />;
      case 'execution': return <Execution />;
      case 'audit': return <Audit />;
      case 'niches': return <NicheTemplates />;
      case 'proposal': return <Proposal />;
      case 'validation': return <ValidationPlan />;
      case 'database': return <DatabaseSchema />;
      case 'settings': return <Settings onUpgradeRequest={() => setActiveTab('proposal')} />;
      case 'users': return <Employees />;
      case 'reports': return <Reports />;
      case 'routines': return <RoutineManager />;
      case 'inventory': return <Inventory />;
      case 'compliance': return <Compliance />;
      case 'finance': return <Finance />;
      default: return <Dashboard userRole={userRole} userName={userName} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col lg:flex-row">
      {showConfigWarning && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white z-[100] px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
          <AlertTriangle size={18} />
          <span className="text-sm font-bold">Configuração incompleta do Supabase.</span>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        userRole={userRole} 
        permittedModules={permittedModules}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 lg:ml-64`}>
        <header className="flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 h-16 lg:h-20 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-lg">
               <Menu size={24} />
             </button>
             <div className="relative max-w-xs w-full hidden md:block font-bold text-slate-400 text-sm">
               Ambiente Enterprise Unificado
             </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{userRole} Logado</span>
              <span className={`text-xs font-bold flex items-center gap-1 justify-end text-emerald-600`}>
                <ShieldCheck size={12} /> {userName}
              </span>
            </div>
            <button onClick={() => setActiveTab('settings')} className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner uppercase">
              {userName.substring(0, 2)}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
