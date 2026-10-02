import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  SkipForward, 
  Play, 
  Search, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { formatSimpleDate, cleanPhone } from '../../utils/formatters';
import { sendWhatsAppMessage } from '../../services/messaging';

export function BulkAlertModal({ isOpen, onClose, alerts = [], settings, onAlertSent }) {
  // Passos: 'select' (seleção da lista), 'sending' (fila guiada), 'done' (resumo final)
  const [step, setStep] = useState('select');
  const [filter, setFilter] = useState('ALL'); // ALL, OVERDUE, UPCOMING
  const [search, setSearch] = useState('');
  
  // Preferência de abertura do WhatsApp (herda das configurações, mas pode alternar no modal)
  const [whatsappMode, setWhatsappMode] = useState(settings?.whatsappAppMode || 'desktop');
  
  // Template customizável para a sessão de disparo
  const [template, setTemplate] = useState(
    settings?.whatsappTemplateAlert || 
    'Olá {cliente}! Tudo bem? Verificamos aqui que faz {meses} meses desde a manutenção/troca de refil do seu purificador ({equipamento}). Para manter a água sempre pura e seu aparelho protegido, gostaria de agendar a troca do elemento filtrante?'
  );

  // Conjunto de IDs selecionados
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  
  // Estado da fila de disparo
  const [queueIndex, setQueueIndex] = useState(0);
  const [sentRecords, setSentRecords] = useState({}); // { [alertId]: 'sent' | 'skipped' }
  const [editedCurrentPhone, setEditedCurrentPhone] = useState('');

  // Sincroniza seleção inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setQueueIndex(0);
      setSentRecords({});
      setWhatsappMode(settings?.whatsappAppMode || 'desktop');
      setTemplate(
        settings?.whatsappTemplateAlert || 
        'Olá {cliente}! Tudo bem? Verificamos aqui que faz {meses} meses desde a manutenção/troca de refil do seu purificador ({equipamento}). Para manter a água sempre pura e seu aparelho protegido, gostaria de agendar a troca do elemento filtrante?'
      );

      // Pré-seleciona todos os alertas que possuem telefone válido
      const validIds = alerts
        .filter(a => cleanPhone(a.clientPhone).length >= 10)
        .map(a => a.id);
      setSelectedIds(new Set(validIds));
    }
  }, [isOpen, alerts, settings]);

  // Lista filtrada para exibição
  const eligibleAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = 
        alert.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        alert.equipment?.toLowerCase().includes(search.toLowerCase()) ||
        alert.clientPhone?.includes(search);

      if (filter === 'OVERDUE') return matchesSearch && alert.isOverdue;
      if (filter === 'UPCOMING') return matchesSearch && !alert.isOverdue;
      return matchesSearch;
    });
  }, [alerts, search, filter]);

  // Lista ordenada de clientes na fila de envio
  const queuedAlerts = useMemo(() => {
    return alerts.filter(a => selectedIds.has(a.id));
  }, [alerts, selectedIds]);

  const currentQueueItem = queuedAlerts[queueIndex] || null;

  // Atualiza telefone temporário editável ao mudar de cliente na fila
  useEffect(() => {
    if (currentQueueItem) {
      setEditedCurrentPhone(currentQueueItem.clientPhone || '');
    }
  }, [queueIndex, currentQueueItem]);

  // Funções de Seleção
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const validEligible = eligibleAlerts.filter(a => cleanPhone(a.clientPhone).length >= 10);
    const allSelected = validEligible.every(a => selectedIds.has(a.id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        validEligible.forEach(a => next.delete(a.id));
      } else {
        validEligible.forEach(a => next.add(a.id));
      }
      return next;
    });
  };

  // Montagem do texto personalizado
  const renderMessageForAlert = useCallback((alertItem, customTpl) => {
    if (!alertItem) return '';
    const tpl = customTpl || template;
    return tpl
      .replace('{cliente}', alertItem.clientName || 'Cliente')
      .replace('{equipamento}', alertItem.equipment || 'Purificador')
      .replace('{meses}', settings?.returnMonths || 12);
  }, [template, settings]);

  const advanceQueue = useCallback(() => {
    if (queueIndex + 1 < queuedAlerts.length) {
      setQueueIndex(prev => prev + 1);
    } else {
      setStep('done');
    }
  }, [queueIndex, queuedAlerts.length]);

  // Enviar para o cliente atual e ir para o próximo
  const handleSendCurrentAndNext = useCallback(async () => {
    if (!currentQueueItem) return;

    const phoneToUse = editedCurrentPhone || currentQueueItem.clientPhone;
    const msg = renderMessageForAlert(currentQueueItem, template);

    // Dispara via WhatsApp com o modo selecionado
    await sendWhatsAppMessage(phoneToUse, msg, { mode: whatsappMode });

    // Registra envio
    setSentRecords(prev => ({
      ...prev,
      [currentQueueItem.id]: 'sent'
    }));

    if (onAlertSent) {
      onAlertSent(currentQueueItem);
    }

    advanceQueue();
  }, [currentQueueItem, editedCurrentPhone, renderMessageForAlert, template, whatsappMode, onAlertSent, advanceQueue]);

  // Pular cliente atual
  const handleSkipCurrent = useCallback(() => {
    if (!currentQueueItem) return;

    setSentRecords(prev => ({
      ...prev,
      [currentQueueItem.id]: 'skipped'
    }));

    advanceQueue();
  }, [currentQueueItem, advanceQueue]);

  // Atalhos de teclado no modal (Escape para fechar, Espaço ou Enter no modo de disparo)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (step === 'sending') {
        // Ignora se estiver digitando em um input ou textarea
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleSendCurrentAndNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleSendCurrentAndNext, onClose]);

  // Iniciar Envio
  const handleStartQueue = () => {
    if (queuedAlerts.length === 0) return;
    setQueueIndex(0);
    setSentRecords({});
    setStep('sending');
  };

  // Estatísticas de Resumo
  const totalSent = Object.values(sentRecords).filter(v => v === 'sent').length;
  const totalSkipped = Object.values(sentRecords).filter(v => v === 'skipped').length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Disparo em Lote de Alertas (WhatsApp)
              </h3>
              <p className="text-xs text-slate-500">
                Notificação de manutenção e troca de refil para clientes selecionados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* ========================================================= */}
          {/* PASSO 1: SELEÇÃO E CONFIGURAÇÃO DA LISTA                  */}
          {/* ========================================================= */}
          {step === 'select' && (
            <div className="space-y-6">

              {/* Banner de Opção de Abertura */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-950">
                    Método de abertura do WhatsApp:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={whatsappMode}
                    onChange={(e) => setWhatsappMode(e.target.value)}
                    className="text-xs font-semibold bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  >
                    <option value="desktop">App WhatsApp Desktop (Windows)</option>
                    <option value="web">WhatsApp Web (Navegador)</option>
                    <option value="wa_me">Página Oficial (wa.me)</option>
                  </select>
                </div>
              </div>

              {/* Prévia da Mensagem que será disparada */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mensagem que será enviada aos clientes
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Personalizada automaticamente para cada cliente
                  </span>
                </div>
                <textarea
                  rows="3"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-500">
                  Variáveis suportadas: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{'{cliente}'}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{'{equipamento}'}</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">{'{meses}'}</code>
                </p>
              </div>

              {/* Filtros da Lista de Alertas */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, fone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({alerts.length})
                  </button>
                  <button
                    onClick={() => setFilter('OVERDUE')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      filter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    Vencidos ({alerts.filter(a => a.isOverdue).length})
                  </button>
                  <button
                    onClick={() => setFilter('UPCOMING')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      filter === 'UPCOMING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:text-amber-600'
                    }`}
                  >
                    Próximos ({alerts.filter(a => !a.isOverdue).length})
                  </button>
                </div>
              </div>

              {/* Barra de Selecionar Todos */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-100/80 rounded-xl text-xs">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      eligibleAlerts.filter(a => cleanPhone(a.clientPhone).length >= 10).length > 0 &&
                      eligibleAlerts.filter(a => cleanPhone(a.clientPhone).length >= 10).every(a => selectedIds.has(a.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Selecionar todos os clientes listados</span>
                </label>

                <span className="font-bold text-slate-600">
                  {selectedIds.size} de {alerts.length} selecionados
                </span>
              </div>

              {/* Tabela / Lista de Clientes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {eligibleAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Nenhum cliente encontrado para este filtro.
                  </div>
                ) : (
                  eligibleAlerts.map(alert => {
                    const hasValidPhone = cleanPhone(alert.clientPhone).length >= 10;
                    const isSelected = selectedIds.has(alert.id);

                    return (
                      <div
                        key={alert.id}
                        onClick={() => hasValidPhone && toggleSelect(alert.id)}
                        className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                          !hasValidPhone 
                            ? 'bg-slate-50/60 opacity-60 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/50 cursor-pointer' 
                              : 'hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            disabled={!hasValidPhone}
                            checked={isSelected}
                            onChange={() => toggleSelect(alert.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">
                                {alert.clientName}
                              </span>
                              <span className="text-[10px] font-bold text-blue-600">
                                #{alert.osNumber}
                              </span>
                              {alert.lastAlertSentAt && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  Notificado em {formatSimpleDate(alert.lastAlertSentAt)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{alert.equipment || 'Purificador'}</span>
                              <span>•</span>
                              <span>Vencimento: <strong>{formatSimpleDate(alert.returnDate)}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {hasValidPhone ? (
                            <span className="text-slate-600 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {alert.clientPhone}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Sem telefone válido
                            </span>
                          )}

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            alert.isOverdue 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.isOverdue ? 'Vencido' : 'Próximo'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* PASSO 2: ASSISTENTE DE DISPARO GUIADO                      */}
          {/* ========================================================= */}
          {step === 'sending' && currentQueueItem && (
            <div className="space-y-6">

              {/* Barra de Progresso Superior */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>
                    Fila de Disparo: <strong>{queueIndex + 1}</strong> de <strong>{queuedAlerts.length}</strong> clientes
                  </span>
                  <span className="text-emerald-700 font-bold">
                    {Math.round(((queueIndex + 1) / queuedAlerts.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${((queueIndex + 1) / queuedAlerts.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Cartão do Cliente Atual */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 font-bold text-xl flex items-center justify-center shrink-0 border border-emerald-200">
                      {currentQueueItem.clientName?.charAt(0) || 'C'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900">
                          {currentQueueItem.clientName}
                        </h4>
                        <span className="text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">
                          OS #{currentQueueItem.osNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentQueueItem.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {currentQueueItem.isOverdue ? 'Refil Vencido' : 'Próxima Troca'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Aparelho: <strong className="text-slate-700">{currentQueueItem.equipment || 'Purificador'}</strong></span>
                        <span>•</span>
                        <span>Data Prevista: <strong className="text-slate-700">{formatSimpleDate(currentQueueItem.returnDate)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campo de Telefone (editável caso falte DDD ou algo do tipo) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Telefone / WhatsApp do Cliente
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editedCurrentPhone}
                        onChange={(e) => setEditedCurrentPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Canal de Envio
                    </label>
                    <div className="py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between">
                      <span>
                        {whatsappMode === 'desktop' ? 'WhatsApp Desktop (App Instalado)' : whatsappMode === 'web' ? 'WhatsApp Web (Navegador)' : 'Página wa.me'}
                      </span>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold">Ativo</span>
                    </div>
                  </div>
                </div>

                {/* Balão de Pré-visualização da Mensagem */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mensagem que será aberta no WhatsApp
                  </label>
                  <div className="bg-emerald-500/10 border border-emerald-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed relative">
                    <p className="whitespace-pre-line">
                      {renderMessageForAlert(currentQueueItem, template)}
                    </p>
                  </div>
                </div>

              </div>

              {/* Botões de Ação do Disparo */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Pausar / Voltar à lista
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSkipCurrent}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Pular Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCurrentAndNext}
                    className="flex-2 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer transform active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar no WhatsApp e Próximo</span>
                    <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono">
                      Espaço / Enter
                    </span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* PASSO 3: RESUMO E CONCLUSÃO                               */}
          {/* ========================================================= */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  Disparo em Lote Concluído!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Todas as conversas selecionadas foram processadas no WhatsApp com os respectivos textos personalizados.
                </p>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 max-w-sm mx-auto gap-4 pt-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-xs text-emerald-700 font-semibold block">Enviados</span>
                  <span className="text-2xl font-bold text-emerald-800">{totalSent}</span>
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs text-slate-600 font-semibold block">Pulados</span>
                  <span className="text-2xl font-bold text-slate-700">{totalSkipped}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setQueueIndex(0);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Novo Disparo</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal (Apenas no Passo 1) */}
        {step === 'select' && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleStartQueue}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Disparo em Fila ({selectedIds.size} clientes)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
