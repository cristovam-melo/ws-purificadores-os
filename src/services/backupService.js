import { db } from '../db/database';

export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Retorna o handle da pasta salva no IndexedDB
export async function getStoredDirectoryHandle() {
  try {
    const record = await db.backupConfig.get('onedrive_directory_handle');
    return record?.handle || null;
  } catch (err) {
    console.warn('Erro ao obter handle da pasta de backup:', err);
    return null;
  }
}

// Verifica se temos permissão de leitura e escrita na pasta
export async function verifyDirectoryPermission(directoryHandle, requestIfDenied = true) {
  if (!directoryHandle) return false;
  try {
    const opts = { mode: 'readwrite' };
    if ((await directoryHandle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if (requestIfDenied) {
      if ((await directoryHandle.requestPermission(opts)) === 'granted') {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('Erro ao verificar permissão do diretório:', err);
    return false;
  }
}

// Abre o seletor nativo do sistema operacional para escolher a pasta do OneDrive
export async function selectBackupDirectory() {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Seu navegador não suporta a seleção direta de pastas locais. Recomendamos o Google Chrome, Microsoft Edge ou Opera.');
  }

  const handle = await window.showDirectoryPicker({
    id: 'ws_purificadores_onedrive_backup',
    mode: 'readwrite',
    startIn: 'documents'
  });

  const hasPerm = await verifyDirectoryPermission(handle, true);
  if (!hasPerm) {
    throw new Error('Permissão de gravação na pasta selecionada não foi concedida.');
  }

  await db.backupConfig.put({
    key: 'onedrive_directory_handle',
    handle: handle,
    folderName: handle.name,
    savedAt: new Date().toISOString()
  });

  return {
    handle,
    folderName: handle.name
  };
}

// Desconecta a pasta de backup
export async function disconnectBackupDirectory() {
  await db.backupConfig.delete('onedrive_directory_handle');
  await db.backupConfig.delete('last_auto_backup_info');
  return true;
}

// Obtém status e configurações da sincronização de backup
export async function getBackupSyncStatus() {
  try {
    const handleRecord = await db.backupConfig.get('onedrive_directory_handle');
    const lastBackupRecord = await db.backupConfig.get('last_auto_backup_info');
    const autoBackupPref = await db.backupConfig.get('auto_backup_enabled');

    let hasPermission = false;
    if (handleRecord?.handle) {
      hasPermission = (await handleRecord.handle.queryPermission({ mode: 'readwrite' })) === 'granted';
    }

    return {
      isSupported: isFileSystemAccessSupported(),
      isConnected: !!handleRecord?.handle,
      folderName: handleRecord?.folderName || '',
      hasPermission,
      autoBackupEnabled: autoBackupPref?.value ?? true,
      lastBackupAt: lastBackupRecord?.timestamp || null,
      lastBackupSuccess: lastBackupRecord?.success ?? null,
      lastBackupError: lastBackupRecord?.error || null,
      lastBackupFile: lastBackupRecord?.fileName || null
    };
  } catch (err) {
    console.error('Erro ao ler status de backup:', err);
    return {
      isSupported: isFileSystemAccessSupported(),
      isConnected: false,
      autoBackupEnabled: true
    };
  }
}

// Habilita ou desabilita auto-backup
export async function setAutoBackupEnabled(enabled) {
  await db.backupConfig.put({
    key: 'auto_backup_enabled',
    value: enabled
  });
}

// Gera o payload JSON completo de backup
export async function generateBackupData() {
  const clients = await db.clients.toArray();
  const serviceOrders = await db.serviceOrders.toArray();
  const settings = await db.settings.toArray();

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    appName: 'WS Purificadores - OS & Alertas',
    data: {
      clients,
      serviceOrders,
      settings
    }
  };
}

// Executa gravação direta na pasta do OneDrive
export async function saveBackupToFolder(options = { createDatedCopy: true }) {
  const handle = await getStoredDirectoryHandle();
  if (!handle) {
    throw new Error('Nenhuma pasta do OneDrive configurada.');
  }

  const hasPerm = await verifyDirectoryPermission(handle, false);
  if (!hasPerm) {
    throw new Error('Permissão de acesso à pasta expirou ou não foi concedida. Por favor, revalide a pasta nas Configurações.');
  }

  const backupData = await generateBackupData();
  const jsonContent = JSON.stringify(backupData, null, 2);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // 1. Grava o arquivo mais recente: backup-ws-purificadores.json
  const mainFileName = 'backup-ws-purificadores.json';
  const mainFileHandle = await handle.getFileHandle(mainFileName, { create: true });
  const mainWritable = await mainFileHandle.createWritable();
  await mainWritable.write(jsonContent);
  await mainWritable.close();

  // 2. Grava a cópia diária com data: backup-ws-purificadores-2026-08-31.json
  let datedFileName = null;
  if (options.createDatedCopy) {
    datedFileName = `backup-ws-purificadores-${dateStr}.json`;
    const datedFileHandle = await handle.getFileHandle(datedFileName, { create: true });
    const datedWritable = await datedFileHandle.createWritable();
    await datedWritable.write(jsonContent);
    await datedWritable.close();
  }

  // Registra metadados do último backup
  const backupInfo = {
    timestamp: now.toISOString(),
    success: true,
    fileName: mainFileName,
    clientsCount: backupData.data.clients.length,
    ordersCount: backupData.data.serviceOrders.length
  };

  await db.backupConfig.put({
    key: 'last_auto_backup_info',
    ...backupInfo
  });

  return backupInfo;
}

// Exportação manual tradicional (download de arquivo pelo navegador)
export async function exportDatabaseBackup() {
  const backupData = await generateBackupData();
  const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `backup-ws-purificadores-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);

  return true;
}

// Importação manual tradicional de arquivo JSON
export async function importDatabaseBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.data || !json.data.clients || !json.data.serviceOrders) {
          throw new Error('Arquivo de backup inválido ou incompatível.');
        }

        await db.transaction('rw', db.clients, db.serviceOrders, db.settings, async () => {
          await db.clients.clear();
          await db.serviceOrders.clear();
          await db.settings.clear();

          if (json.data.clients?.length) await db.clients.bulkAdd(json.data.clients);
          if (json.data.serviceOrders?.length) await db.serviceOrders.bulkAdd(json.data.serviceOrders);
          if (json.data.settings?.length) await db.settings.bulkAdd(json.data.settings);
        });

        resolve({ success: true, countClients: json.data.clients?.length || 0, countOS: json.data.serviceOrders?.length || 0 });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
