import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  ArrowRight,
  Database
} from 'lucide-react';
import { parseMultiplePDFs } from '../../services/pdfParserService';
import { formatCurrency, formatSimpleDate } from '../../utils/formatters';
import { db } from '../../db/database';

export function PDFImportModal({ isOpen, onClose, clients = [], onImportSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ current: 0, total: 0, filename: '' });
  const [parsedOrders, setParsedOrders] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      alert('Por favor, selecione arquivos em formato PDF.');
      return;
    }

    setIsParsing(true);
    setParseErrors([]);

    try {
      const { success, errors } = await parseMultiplePDFs(pdfFiles, (progress) => {
        setParseProgress(progress);
      });

      setParsedOrders(prev => [...prev, ...success]);
      setParseErrors(errors);
    } catch (err) {
      alert('Erro ao processar PDFs: ' + err.message);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (index) => {
    setParsedOrders(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmImport = async () => {
    if (parsedOrders.length === 0) return;
    setIsImporting(true);

    try {
      let importedCount = 0;
      let newClientsCount = 0;

      for (const os of parsedOrders) {
        let matchedClientId = null;

        // Verificar se cliente já existe pelo telefone ou nome
        if (os.clientPhone || os.clientName) {
          const cleanPhone = (os.clientPhone || '').replace(/\D/g, '');
          const existingClient = clients.find(c => {
            const cPhone = (c.phone || '').replace(/\D/g, '');
            if (cleanPhone && cPhone && cleanPhone === cPhone) return true;
            if (os.clientName && c.name && os.clientName.toLowerCase() === c.name.toLowerCase()) return true;
            return false;
          });

          if (existingClient) {
            matchedClientId = existingClient.id;
          } else if (os.clientName) {
            // Cadastrar novo cliente automaticamente
            const newId = await db.clients.add({
              name: os.clientName,
              phone: os.clientPhone || '',
              email: '',
              address: os.clientAddress || '',
              notes: `Cadastrado automaticamente via importação de PDF (OS #${os.osNumber})`,
              createdAt: new Date()
            });
            matchedClientId = newId;
            newClientsCount++;
          }
        }

        // Inserir a Ordem de Serviço
        await db.serviceOrders.add({
          osNumber: os.osNumber,
          date: os.date,
          status: os.status || 'Aprovado',
          clientId: matchedClientId,
          clientName: os.clientName || 'Cliente Importado',
          clientPhone: os.clientPhone || '',
          clientAddress: os.clientAddress || '',
          equipment: os.equipment || '',
          defect: os.defect || '',
          technicalReport: os.technicalReport || '',
          warranty: os.warranty || '12 meses',
          products: os.products || [],
          productsTotal: os.totalAmount || 0,
          totalAmount: os.totalAmount || 0,
          returnDate: os.returnDate || '',
          paymentMethod: 'Outro',
          notes: `Importado de PDF: ${os.sourceFileName}`,
          createdAt: new Date()
        });

        importedCount++;
      }

      if (onImportSuccess) {
        onImportSuccess({ importedCount, newClientsCount });
      }

      onClose();
    } catch (err) {
      alert('Erro ao gravar ordens de serviço no banco: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Importar Ordens de Serviço (PDF)</h3>
              <p className="text-xs text-slate-500">
                Selecione os PDFs de OSs antigas para registrar automaticamente clientes e atendimentos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting || isParsing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Área de Drop de Arquivos */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragOver 
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Arraste e solte seus PDFs de OS aqui, ou{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    escolha no computador
                  </button>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Você pode selecionar vários arquivos ao mesmo tempo (em lote)
                </p>
              </div>
            </div>
          </div>

          {/* Progresso de leitura */}
          {isParsing && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>
                  Lendo documento <strong>{parseProgress.current}</strong> de <strong>{parseProgress.total}</strong>: {parseProgress.filename}
                </span>
              </div>
              <span className="font-bold">
                {Math.round((parseProgress.current / parseProgress.total) * 100)}%
              </span>
            </div>
          )}

          {/* Erros ao processar */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Não foi possível extrair dados dos seguintes arquivos:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-700 pl-1">
                {parseErrors.map((err, i) => (
                  <li key={i}><strong>{err.filename}</strong>: {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lista de OSs Identificadas */}
          {parsedOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>Ordens de Serviço Identificadas</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">
                    {parsedOrders.length}
                  </span>
                </h4>

                <button
                  type="button"
                  onClick={() => setParsedOrders([])}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Limpar lista
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                {parsedOrders.map((os, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">OS #{os.osNumber}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 truncate">{os.clientName || 'Cliente não identificado'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{formatSimpleDate(os.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px] truncate">
                        <span>Tel: {os.clientPhone || '---'}</span>
                        <span>|</span>
                        <span>Aparelho: <strong>{os.equipment || 'Não informado'}</strong></span>
                        <span>|</span>
                        <span>Total: <strong className="text-blue-700">{formatCurrency(os.totalAmount)}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remover este item"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedOrders.length === 0 || isImporting || isParsing}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando para o sistema...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Confirmar e Importar {parsedOrders.length > 0 ? `(${parsedOrders.length} OS)` : ''}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
