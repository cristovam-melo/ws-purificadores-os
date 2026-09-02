import React from 'react';
import { 
  FileText, 
  Users, 
  BellRing, 
  Settings, 
  PlusCircle, 
  Droplets, 
  CheckCircle2 
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, alertCount = 0, onNewOS }) {
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: Droplets },
    { id: 'orders', label: 'Ordens de Serviço', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
    { 
      id: 'alerts', 
      label: 'Alertas & Retorno', 
      icon: BellRing, 
      badge: alertCount > 0 ? alertCount : null 
    },
    { id: 'settings', label: 'Configurações & Backup', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-xl">
          WS
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight leading-tight text-base">WS Purificadores</h1>
          <p className="text-xs text-cyan-400 font-medium">Gestão & Manutenção</p>
        </div>
      </div>

      {/* Botão de Ação Rápida */}
      <div className="p-4">
        <button
          onClick={onNewOS}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer da Sidebar com Status do Backup Local */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Armazenamento local seguro ativo</span>
        </div>
      </div>
    </aside>
  );
}