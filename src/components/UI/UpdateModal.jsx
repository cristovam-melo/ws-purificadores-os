import React, { useState } from 'react';
import { ArrowDownCircle, CheckCircle2, Sparkles, X, RefreshCw } from 'lucide-react';
import { downloadAndInstallUpdate } from '../../services/updaterService';

export function UpdateModal({ isOpen, onClose, update }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  if (!isOpen || !update) return null;

  const handleStartUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    setProgress(0);

    try {
      await downloadAndInstallUpdate(update, (percent) => {
        setProgress(percent);
      });
    } catch (err) {
      console.error('Erro durante a atualização:', err);
      setError('Ocorreu um erro ao baixar a atualização. Tente novamente mais tarde.');
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Nova Atualização</h3>
              <p className="text-xs text-slate-500 font-medium">
                Versão <span className="font-semibold text-blue-600">v{update.version}</span> disponível
              </p>
            </div>
          </div>
          
          {!isUpdating && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Informações da Versão */}
        <div className="bg-slate-50 rounded-xl p-3.5 mb-5 border border-slate-200/60 text-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Versão Atual: <strong className="text-slate-700">v{update.currentVersion || '1.0.0'}</strong></span>
            <span>Nova: <strong className="text-emerald-600 font-bold">v{update.version}</strong></span>
          </div>

          {update.body ? (
            <div className="mt-2 text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap border-t border-slate-200/60 pt-2">
              <p className="font-semibold text-slate-700 mb-1">Novidades:</p>
              {update.body}
            </div>
          ) : (
            <p className="text-xs text-slate-600 mt-1">
              Melhorias de estabilidade, correções e novos recursos para o WS Purificadores OS.
            </p>
          )}
        </div>

        {/* Progresso de Download / Erro */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {isUpdating ? (
          <div className="space-y-3 mb-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                {progress === 100 ? 'Finalizando instalação e reiniciando...' : 'Baixando atualização...'}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              O aplicativo será reiniciado automaticamente ao concluir.
            </p>
          </div>
        ) : (
          /* Ações */
          <div className="flex items-center justify-end gap-2.5 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Lembrar mais tarde
            </button>
            <button
              onClick={handleStartUpdate}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Atualizar Agora</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
