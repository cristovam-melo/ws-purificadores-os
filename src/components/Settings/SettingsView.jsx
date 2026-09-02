import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  Upload, 
  Save, 
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  Cloud,
  FolderOpen,
  FolderCheck,
  FolderX,
  RefreshCw,
  Sparkles,
  ArrowDownCircle
} from 'lucide-react';
import { 
  exportDatabaseBackup, 
  importDatabaseBackup, 
  selectBackupDirectory, 
  disconnectBackupDirectory, 
  getBackupSyncStatus, 
  saveBackupToFolder,
  setAutoBackupEnabled,
  isFileSystemAccessSupported
} from '../../services/backupService';

export function SettingsView({ settings, onSaveSettings, onCheckUpdates }) {
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || 'ws purificadores de água',
    phone: settings?.phone || '(85) 98870-2905',
    email: settings?.email || 'wspurificadoresdeagua@gmail.com',
    address: settings?.address || 'Fortaleza - CE',
    logo: settings?.logo || '',
    pixKey: settings?.pixKey || 'wspurificadoresdeagua@gmail.com',
    standardWarranty: settings?.standardWarranty || '12 meses',
    returnMonths: settings?.returnMonths || 12,
    whatsappTemplateAlert: settings?.whatsappTemplateAlert || 'Olá {cliente}! Tudo bem? Verificamos aqui que faz {meses} meses desde a manutenção/troca de refil do seu purificador ({equipamento}). Para manter a água sempre pura e seu aparelho protegido, gostaria de agendar a troca do elemento filtrante?',
    whatsappTemplateOS: settings?.whatsappTemplateOS || 'Olá {cliente}, sua Ordem de Serviço #{osNumber} da WS Purificadores está pronta! Status: {status}. Total: R$ {total}. Qualquer dúvida estamos à disposição!'
  });

  const [isSaved, setIsSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState({
    isSupported: isFileSystemAccessSupported(),
    isConnected: false,
    folderName: '',
    hasPermission: false,
    autoBackupEnabled: true,
    lastBackupAt: null,
    lastBackupSuccess: null
  });
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  // Estados de Atualização do App
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState('');

  const handleManualCheckUpdates = async () => {
    if (!onCheckUpdates) return;
    setIsCheckingUpdates(true);
    setUpdateFeedback('');
    try {
      const update = await onCheckUpdates();
      if (!update) {
        setUpdateFeedback('Você já está usando a versão mais recente.');
        setTimeout(() => setUpdateFeedback(''), 5000);
      }
    } catch (err) {
      setUpdateFeedback('Não foi possível verificar atualizações no momento.');
      setTimeout(() => setUpdateFeedback(''), 5000);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const loadSyncStatus = async () => {
    const status = await getBackupSyncStatus();
    setSyncStatus(status);
  };

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const handleSelectFolder = async () => {
    try {
      const result = await selectBackupDirectory();
      setBackupMsg(`Pasta "${result.folderName}" conectada com sucesso! Os backups serão gravados nela.`);
      await loadSyncStatus();
      setTimeout(() => setBackupMsg(''), 5000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('Erro ao selecionar pasta: ' + err.message);
      }
    }
  };

  const handleDisconnectFolder = async () => {
    if (window.confirm('Deseja desconectar a pasta de backup automático?')) {
      await disconnectBackupDirectory();
      await loadSyncStatus();
      setBackupMsg('Pasta desconectada.');
      setTimeout(() => setBackupMsg(''), 4000);
    }
  };

  const handleManualSyncFolder = async () => {
    try {
      setIsSyncingNow(true);
      const res = await saveBackupToFolder({ createDatedCopy: true });
      setBackupMsg(`Backup salvo com sucesso na pasta do OneDrive! (${res.clientsCount} clientes, ${res.ordersCount} OS)`);
      await loadSyncStatus();
      setTimeout(() => setBackupMsg(''), 5000);
    } catch (err) {
      alert('Erro ao sincronizar na pasta: ' + err.message);
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleToggleAutoBackup = async (enabled) => {
    await setAutoBackupEnabled(enabled);
    await loadSyncStatus();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExport = async () => {
    try {
      await exportDatabaseBackup();
      setBackupMsg('Backup baixado com sucesso!');
      setTimeout(() => setBackupMsg(''), 4000);
    } catch (err) {
      alert('Erro ao exportar backup: ' + err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('Atenção: A restauração de backup substituirá os dados atuais. Deseja continuar?')) {
      return;
    }

    try {
      const res = await importDatabaseBackup(file);
      alert(`Backup restaurado com sucesso! ${res.countClients} clientes e ${res.countOS} ordens de serviço carregadas.`);
      window.location.reload();
    } catch (err) {
      alert('Erro ao importar backup: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Seção 1: Dados da Empresa para o Cabeçalho da OS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Identificação da Empresa</h3>
              <p className="text-xs text-slate-500">Dados impressos no topo de todas as Ordens de Serviço (PDF)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Telefone de Contato
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Garantia Padrão
              </label>
              <input
                type="text"
                value={formData.standardWarranty}
                onChange={(e) => setFormData({ ...formData, standardWarranty: e.target.value })}
                placeholder="12 meses"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Upload do Logo */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Logotipo da Empresa
            </label>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50">
                  <img src={formData.logo} alt="Logo" className="h-12 w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="text-[10px] text-rose-600 block mt-1 hover:underline text-center cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="w-16 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-slate-200">
                <span>Carregar Imagem</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Seção 2: Automação & Mensagens WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Templates de Mensagens (WhatsApp)</h3>
              <p className="text-xs text-slate-500">Configure os textos enviados aos clientes com variáveis automáticas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mensagem de Alerta de Troca de Refil (Pós-Venda)
              </label>
              <textarea
                rows="3"
                value={formData.whatsappTemplateAlert}
                onChange={(e) => setFormData({ ...formData, whatsappTemplateAlert: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Variáveis disponíveis: {'{cliente}'}, {'{equipamento}'}, {'{meses}'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mensagem de Envio de OS Pronta
              </label>
              <textarea
                rows="3"
                value={formData.whatsappTemplateOS}
                onChange={(e) => setFormData({ ...formData, whatsappTemplateOS: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Variáveis disponíveis: {'{cliente}'}, {'{osNumber}'}, {'{status}'}, {'{total}'}</p>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Configurações */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isSaved && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Alterações salvas com sucesso!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>

      </form>

      {/* Seção 3: Sincronização Automática com OneDrive / Pasta Local */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Sincronização com OneDrive / Pasta Local</h3>
                {syncStatus.isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ativo & Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Não configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grave automaticamente os dados na sua pasta do OneDrive para que o Windows sincronize na nuvem
              </p>
            </div>
          </div>
        </div>

        {backupMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupMsg}</span>
          </div>
        )}

        {/* Card Principal de Conexão com a Pasta */}
        <div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-50 to-blue-50/30 border-blue-100/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-3 rounded-xl border ${syncStatus.isConnected ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                {syncStatus.isConnected ? <FolderCheck className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {syncStatus.isConnected 
                    ? `Pasta Conectada: ${syncStatus.folderName}` 
                    : 'Nenhuma pasta do OneDrive selecionada'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {syncStatus.isConnected
                    ? `Arquivos gerados: "backup-ws-purificadores.json" e cópia diária com data.`
                    : 'Escolha uma pasta dentro do seu OneDrive (ex: Documentos/Backups) para ativar a sincronização contínua.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {syncStatus.isConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleManualSyncFolder}
                    disabled={isSyncingNow}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                    <span>{isSyncingNow ? 'Salvando...' : 'Salvar Agora na Pasta'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    title="Trocar a pasta selecionada"
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Alterar Pasta</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectFolder}
                    title="Desconectar pasta de backup"
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  >
                    <FolderX className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Selecionar Pasta no OneDrive</span>
                </button>
              )}
            </div>
          </div>

          {/* Opções e Metadados quando conectado */}
          {syncStatus.isConnected && (
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncStatus.autoBackupEnabled}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">
                  Salvar automaticamente ao cadastrar ou alterar Ordens de Serviço e Clientes
                </span>
              </label>

              {syncStatus.lastBackupAt && (
                <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Último backup: <strong>{new Date(syncStatus.lastBackupAt).toLocaleString('pt-BR')}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exportação & Restauração Tradicionais de Arquivo */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
            Ferramentas Manuais de Segurança (Fallback)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-slate-800 text-xs">Baixar Cópia Manual</h5>
                <p className="text-[11px] text-slate-500">Gera download imediato do arquivo .json</p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-300 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-slate-800 text-xs">Restaurar de Arquivo</h5>
                <p className="text-[11px] text-slate-500">Recupera registros a partir de um backup .json</p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-300 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Seção 4: Atualizações do Aplicativo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Atualizações do Sistema</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Emissão automática de novas versões e melhorias via GitHub Releases
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Versão Atual: <strong>v1.0.0</strong>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Atualizações Automáticas
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              O aplicativo verifica novas versões automaticamente ao ser iniciado e avisa na tela quando houver novidades.
            </p>
            {updateFeedback && (
              <p className="text-xs font-semibold text-blue-600 mt-2 animate-fadeIn">
                {updateFeedback}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualCheckUpdates}
            disabled={isCheckingUpdates}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
            <span>{isCheckingUpdates ? 'Verificando...' : 'Verificar Atualizações Agora'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}