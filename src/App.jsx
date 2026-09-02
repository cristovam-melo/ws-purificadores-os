import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { isBefore, addDays, parseISO } from 'date-fns';
import { db, initDefaultSettings } from './db/database';
import { 
  getStoredDirectoryHandle, 
  verifyDirectoryPermission, 
  saveBackupToFolder, 
  getBackupSyncStatus 
} from './services/backupService';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { OrdersList } from './components/ServiceOrders/OrdersList';
import { OrderFormModal } from './components/ServiceOrders/OrderFormModal';
import { OrderViewModal } from './components/ServiceOrders/OrderViewModal';
import { ClientsList } from './components/Clients/ClientsList';
import { ClientModal } from './components/Clients/ClientModal';
import { AlertsManager } from './components/Alerts/AlertsManager';
import { SettingsView } from './components/Settings/SettingsView';
import { UpdateModal } from './components/UI/UpdateModal';
import { checkForUpdates } from './services/updaterService';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // Atualizações Automáticas (Tauri Updater)
  const [availableUpdate, setAvailableUpdate] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Modais de Ordem de Serviço
  const [isOSModalOpen, setIsOSModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState(null);
  const [viewingOS, setViewingOS] = useState(null);

  // Modais de Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Inicialização do Banco de Dados Local
  useEffect(() => {
    initDefaultSettings();
  }, []);

  // Checagem automática de atualizações ao abrir o sistema
  useEffect(() => {
    let isMounted = true;
    const checkUpdate = async () => {
      try {
        const update = await checkForUpdates();
        if (update && isMounted) {
          setAvailableUpdate(update);
          setIsUpdateModalOpen(true);
        }
      } catch (err) {
        console.warn('Checagem automática de atualização:', err);
      }
    };

    // Aguarda 2.5s após iniciar para não sobrecarregar o boot
    const timer = setTimeout(checkUpdate, 2500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Consultas Reativas do Dexie (IndexedDB)
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const orders = useLiveQuery(() => db.serviceOrders.toArray()) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray()) || [];
  const settings = settingsList[0] || {};

  // Sincronização automática em segundo plano para a pasta do OneDrive
  useEffect(() => {
    let timeoutId;
    const triggerAutoBackup = async () => {
      try {
        const handle = await getStoredDirectoryHandle();
        if (!handle) return;
        const status = await getBackupSyncStatus();
        if (!status.autoBackupEnabled) return;

        const hasPerm = await verifyDirectoryPermission(handle, false);
        if (hasPerm) {
          await saveBackupToFolder({ createDatedCopy: true });
        }
      } catch (err) {
        console.warn('Auto-backup OneDrive em background:', err);
      }
    };

    if (orders.length > 0 || clients.length > 0) {
      timeoutId = setTimeout(triggerAutoBackup, 2500);
    }

    return () => clearTimeout(timeoutId);
  }, [clients, orders, settingsList]);

  // Próximo Número de OS Sequencial
  const nextOSNumber = orders.length > 0 ? Math.max(...orders.map(o => o.osNumber || 0)) + 1 : 136;

  // Processamento dos Alertas de Retorno (Troca de Refil / Manutenção)
  const today = new Date();
  const alertThreshold = addDays(today, 30); // Próximos 30 dias

  const alerts = orders
    .filter(os => os.returnDate)
    .map(os => {
      const returnDateObj = parseISO(os.returnDate);
      const isOverdue = isBefore(returnDateObj, today);
      const isUpcoming = isBefore(returnDateObj, alertThreshold) && !isOverdue;

      return {
        ...os,
        isOverdue,
        isUpcoming
      };
    })
    .filter(os => os.isOverdue || os.isUpcoming)
    .sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));

  // Ações de Ordem de Serviço
  const handleSaveOS = async (osData) => {
    try {
      if (editingOS?.id) {
        await db.serviceOrders.update(editingOS.id, osData);
      } else {
        const id = await db.serviceOrders.add({
          ...osData,
          createdAt: new Date()
        });

        // Se o cliente ainda não existir na base de clientes, adiciona automaticamente
        if (osData.clientName && !osData.clientId) {
          await db.clients.add({
            name: osData.clientName,
            phone: osData.clientPhone || '',
            email: '',
            address: osData.clientAddress || '',
            createdAt: new Date()
          });
        }
      }
      setIsOSModalOpen(false);
      setEditingOS(null);
    } catch (err) {
      alert('Erro ao salvar OS: ' + err.message);
    }
  };

  const handleDeleteOS = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
      await db.serviceOrders.delete(id);
    }
  };

  // Ações de Clientes
  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient?.id) {
        await db.clients.update(editingClient.id, clientData);
      } else {
        await db.clients.add({
          ...clientData,
          createdAt: new Date()
        });
      }
      setIsClientModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      alert('Erro ao salvar cliente: ' + err.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await db.clients.delete(id);
    }
  };

  const handleNewOSForClient = (client) => {
    setEditingOS({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientAddress: client.address
    });
    setIsOSModalOpen(true);
  };

  // Ações de Configuração
  const handleSaveSettings = async (newSettings) => {
    await db.settings.put({
      id: 'default',
      ...newSettings
    });
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Painel de Controle', subtitle: 'Acompanhamento de Ordens de Serviço e Retornos' };
      case 'orders':
        return { title: 'Ordens de Serviço', subtitle: 'Emissão rápida e controle de atendimentos' };
      case 'clients':
        return { title: 'Gestão de Clientes', subtitle: 'Histórico de contato e aparelhos instalados' };
      case 'alerts':
        return { title: 'Alertas & Troca de Refil', subtitle: 'Lembretes periódicos e contato pós-venda' };
      case 'settings':
        return { title: 'Configurações do Sistema', subtitle: 'Personalização da empresa, mensagens e backup' };
      default:
        return { title: 'WS Purificadores', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Lateral */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.length}
        onNewOS={() => {
          setEditingOS(null);
          setIsOSModalOpen(true);
        }}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          alertCount={alerts.length}
          onAlertClick={() => setActiveTab('alerts')}
        />

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              orders={orders}
              clients={clients}
              alerts={alerts}
              settings={settings}
              onNavigate={(tab) => setActiveTab(tab)}
              onNewOS={() => {
                setEditingOS(null);
                setIsOSModalOpen(true);
              }}
              onViewOS={(os) => setViewingOS(os)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersList
              orders={orders}
              clients={clients}
              settings={settings}
              onNewOS={() => {
                setEditingOS(null);
                setIsOSModalOpen(true);
              }}
              onEditOS={(os) => {
                setEditingOS(os);
                setIsOSModalOpen(true);
              }}
              onViewOS={(os) => setViewingOS(os)}
              onDeleteOS={handleDeleteOS}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsList
              clients={clients}
              onNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setIsClientModalOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onNewOSForClient={handleNewOSForClient}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsManager
              alerts={alerts}
              settings={settings}
              onViewOS={(os) => setViewingOS(os)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onCheckUpdates={async () => {
                const update = await checkForUpdates();
                if (update) {
                  setAvailableUpdate(update);
                  setIsUpdateModalOpen(true);
                  return update;
                }
                return null;
              }}
            />
          )}
        </main>
      </div>

      {/* Modais da Aplicação */}
      <OrderFormModal
        isOpen={isOSModalOpen}
        onClose={() => {
          setIsOSModalOpen(false);
          setEditingOS(null);
        }}
        onSave={handleSaveOS}
        initialData={editingOS}
        clients={clients}
        settings={settings}
        nextOSNumber={nextOSNumber}
      />

      <OrderViewModal
        isOpen={!!viewingOS}
        onClose={() => setViewingOS(null)}
        os={viewingOS}
        settings={settings}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        initialData={editingClient}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        update={availableUpdate}
      />
    </div>
  );
}

export default App;
