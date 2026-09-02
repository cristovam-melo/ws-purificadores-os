import React, { useState, useEffect } from 'react';
import { Search, Bell, Download, Cloud, CheckCircle, RefreshCw } from 'lucide-react';
import { exportDatabaseBackup, getBackupSyncStatus, saveBackupToFolder } from '../../services/backupService';

export function Header({ title, subtitle, globalSearch, setGlobalSearch, alertCount = 0, onAlertClick }) {
  const [syncStatus, setSyncStatus] = useState({ isConnected: false, folderName: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    getBackupSyncStatus().then(setSyncStatus);
    const interval = setInterval(() => {
      getBackupSyncStatus().then(setSyncStatus);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickBackup = async () => {
    try {
      setIsSyncing(true);
      if (syncStatus.isConnected) {
        await saveBackupToFolder({ createDatedCopy: true });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        await exportDatabaseBackup();
      }
    } catch (e) {
      console.error(e);
      // Fallback para download manual se permissão precisar de renovação
      await exportDatabaseBackup();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Barra de Pesquisa Global */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente, OS ou refil..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Botao de Alerta Rapido */}
        <button
          onClick={onAlertClick}
          title="Ver alertas de manutencao"
          className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {alertCount}
            </span>
          )}
        </button>

        {/* Botao de Backup / OneDrive */}
        <button
          onClick={handleQuickBackup}
          disabled={isSyncing}
          title={
            syncStatus.isConnected 
              ? `OneDrive conectado na pasta "${syncStatus.folderName}". Clique para sincronizar agora.` 
              : 'Clique para baixar backup dos dados ou configure o OneDrive nas Configurações.'
          }
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            syncStatus.isConnected
              ? 'bg-blue-50 hover:bg-blue-100/80 text-blue-700 border-blue-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
          }`}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : syncStatus.isConnected ? (
            <div className="relative">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            </div>
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isSyncing ? 'Salvando...' : syncStatus.isConnected ? 'OneDrive OK' : 'Backup'}
          </span>
        </button>

        {showToast && (
          <div className="absolute right-8 top-16 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-lg animate-fadeIn z-50">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backup salvo no OneDrive!</span>
          </div>
        )}
      </div>
    </header>
  );
}
