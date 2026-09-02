import React, { useRef, useState } from 'react';
import { X, Download, Printer, MessageCircle } from 'lucide-react';
import { PrintableOS } from './PrintableOS';
import { generatePDFFromElement } from '../../services/pdfGenerator';
import { sendWhatsAppMessage, generateOSWhatsAppText } from '../../services/messaging';

export function OrderViewModal({ isOpen, onClose, os, settings }) {
  const printRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !os) return null;

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      await generatePDFFromElement(printRef.current, `OS-${os.osNumber}-${os.clientName || 'cliente'}.pdf`);
    } catch (err) {
      alert('Erro ao gerar o PDF: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const msg = generateOSWhatsAppText(os, settings);
    sendWhatsAppMessage(os.clientPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Barra de Ações Superior */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visualização de Impressão</span>
            <h3 className="font-bold text-slate-800 text-base">Ordem de Serviço #{os.osNumber} - {os.clientName}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área de Visualização do Documento Impresso */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/70">
          <div className="shadow-xl rounded-sm overflow-hidden bg-white">
            <PrintableOS ref={printRef} os={os} settings={settings} />
          </div>
        </div>

      </div>
    </div>
  );
}