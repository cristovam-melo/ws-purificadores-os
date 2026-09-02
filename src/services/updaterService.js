import { check } from '@tauri-apps/plugin-updater';

/**
 * Verifica se há uma atualização disponível no GitHub Releases.
 * @returns {Promise<import('@tauri-apps/plugin-updater').Update | null>}
 */
export async function checkForUpdates() {
  try {
    const update = await check();
    return update;
  } catch (err) {
    console.warn('Não foi possível verificar atualizações no momento:', err);
    return null;
  }
}

/**
 * Baixa e aplica a atualização com feedback de progresso.
 * @param {import('@tauri-apps/plugin-updater').Update} update
 * @param {(percent: number) => void} onProgress
 */
export async function downloadAndInstallUpdate(update, onProgress) {
  if (!update) return;

  let totalBytes = 0;
  let downloadedBytes = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        totalBytes = event.data.contentLength || 0;
        if (onProgress) onProgress(0);
        break;
      case 'Progress':
        downloadedBytes += event.data.chunkLength;
        if (totalBytes > 0 && onProgress) {
          const percent = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
          onProgress(percent);
        }
        break;
      case 'Finished':
        if (onProgress) onProgress(100);
        break;
    }
  });
}
