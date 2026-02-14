
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
import { UserRole } from './types';
import { Bell, Search, Menu, Clock, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [userName, setUserName] = useState('');
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

  const handleLogin = (role: UserRole, name: string) => {
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);
    // Funcionários começam na tela de Ponto ou Execução
    if (role === UserRole.OPERATOR) {
      setActiveTab('timeclock');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      setIsLoggedIn(false);
      setActiveTab('dashboard');
    }
  };

  const renderContent = () => {
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
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white z-[100] px-4 py-2 flex items-center justify-center gap-3 shadow-lg animate-slide-down">
          <AlertTriangle size={18} />
          <span className="text-sm font-bold">Configuração incompleta: Verifique suas chaves do Supabase.</span>
          <button onClick={() => setShowConfigWarning(false)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition-all">Fechar</button>
        </div>
      )}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        userRole={userRole} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isLoggedIn ? 'lg:ml-64' : ''}`}>
        <header className="flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 h-16 lg:h-20 shadow-sm lg:shadow-none">
          <div className="flex items-center gap-4 flex-1">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-lg"
             >
               <Menu size={24} />
             </button>

             <div className="relative max-w-xs w-full hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Pesquisar no sistema..." 
                 className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
               />
             </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{userRole} Logado</span>
              <span className={`text-xs font-bold flex items-center gap-1 justify-end ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-500'}`}>
                <ShieldCheck size={12} /> {userName}
              </span>
            </div>
            
            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl relative hover:bg-slate-100 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner hover:scale-105 transition-transform uppercase"
            >
              {userName.substring(0, 2)}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          {renderContent()}
        </div>

        {/* Menu Mobile persistente para facilitar o uso por funcionários */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center lg:hidden z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-500' : 'text-slate-400'}`}>
            <Menu size={20} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button onClick={() => setActiveTab('timeclock')} className={`flex flex-col items-center gap-1 ${activeTab === 'timeclock' ? 'text-emerald-500' : 'text-slate-400'}`}>
            <Clock size={20} />
            <span className="text-[10px] font-bold">Ponto</span>
          </button>
          <button onClick={() => setActiveTab('execution')} className={`flex flex-col items-center gap-1 ${activeTab === 'execution' ? 'text-emerald-500' : 'text-slate-400'}`}>
            <CheckCircle2 size={20} />
            <span className="text-[10px] font-bold">Tarefas</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
