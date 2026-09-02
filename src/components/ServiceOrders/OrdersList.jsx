import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  MessageCircle,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatSimpleDate } from '../../utils/formatters';
import { sendWhatsAppMessage, generateOSWhatsAppText } from '../../services/messaging';
import { PDFImportModal } from './PDFImportModal';

export function OrdersList({ orders = [], clients = [], settings, onNewOS, onEditOS, onViewOS, onDeleteOS }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');

  const filteredOrders = orders.filter(os => {
    const matchesSearch = 
      os.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      String(os.osNumber).includes(search) ||
      os.equipment?.toLowerCase().includes(search.toLowerCase()) ||
      os.technicalReport?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || os.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Concluído':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Orçamento':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelado':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nº OS, cliente ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 shadow-2xs"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Concluído">Concluído</option>
            <option value="Orçamento">Orçamento</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Importar de PDFs</span>
          </button>

          <button
            type="button"
            onClick={onNewOS}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova OS</span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback de Importação */}
      {importFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportFeedback('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Tabela de Ordens de Serviço */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Nenhuma Ordem de Serviço encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Crie uma nova OS ou mude seus filtros de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-20">Nº OS</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Equipamento & Serviço</th>
                  <th className="py-3.5 px-4">Data Emissão</th>
                  <th className="py-3.5 px-4">Retorno (Refil)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4 text-center w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      #{os.osNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{os.clientName}</div>
                      <div className="text-xs text-slate-500">{os.clientPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{os.equipment || '---'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{os.technicalReport || os.defect || ''}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatSimpleDate(os.date)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {formatSimpleDate(os.returnDate)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(os.status)}`}>
                        {os.status || 'Pendente'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 text-right whitespace-nowrap">
                      {formatCurrency(os.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewOS(os)}
                          title="Visualizar / Gerar PDF"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const msg = generateOSWhatsAppText(os, settings);
                            sendWhatsAppMessage(os.clientPhone, msg);
                          }}
                          title="Enviar WhatsApp com dados da OS"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditOS(os)}
                          title="Editar OS"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteOS(os.id)}
                          title="Excluir OS"
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PDFImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        clients={clients}
        onImportSuccess={({ importedCount, newClientsCount }) => {
          setImportFeedback(`Sucesso! ${importedCount} Ordens de Serviço importadas e ${newClientsCount} novos clientes cadastrados.`);
          setTimeout(() => setImportFeedback(''), 8000);
        }}
      />
    </div>
  );
}