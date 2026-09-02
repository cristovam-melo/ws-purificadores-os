import React, { useState } from 'react';
import { 
  BellRing, 
  Search, 
  MessageCircle, 
  Calendar, 
  CheckCircle2,
  FileText,
  Phone
} from 'lucide-react';
import { formatSimpleDate } from '../../utils/formatters';
import { sendWhatsAppMessage, generateAlertWhatsAppText } from '../../services/messaging';

export function AlertsManager({ alerts = [], settings, onViewOS }) {
  const [filter, setFilter] = useState('ALL'); // ALL, OVERDUE, UPCOMING
  const [search, setSearch] = useState('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      alert.equipment?.toLowerCase().includes(search.toLowerCase()) ||
      alert.clientPhone?.includes(search);

    if (filter === 'OVERDUE') return matchesSearch && alert.isOverdue;
    if (filter === 'UPCOMING') return matchesSearch && !alert.isOverdue;
    return matchesSearch;
  });

  const overdueCount = alerts.filter(a => a.isOverdue).length;
  const upcomingCount = alerts.filter(a => !a.isOverdue).length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Banner Informativo */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Central de Retorno & Troca de Refil</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Identifique clientes cujo refil completou 1 ano (ou prazo customizado) e entre em contato pelo WhatsApp com 1 clique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-center px-4 py-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-xs text-slate-500 block font-medium">Vencidos</span>
            <span className="text-lg font-bold text-rose-600">{overdueCount}</span>
          </div>
          <div className="text-center px-4 py-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-xs text-slate-500 block font-medium">Próximos 30 dias</span>
            <span className="text-lg font-bold text-amber-600">{upcomingCount}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, fone ou aparelho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'OVERDUE' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            🔴 Vencidos ({overdueCount})
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'UPCOMING' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-600'
            }`}
          >
            🟡 Próximos ({upcomingCount})
          </button>
        </div>
      </div>

      {/* Grid de Alertas */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold text-slate-700">Tudo em dia!</p>
          <p className="text-xs text-slate-400 mt-1">Nenhum alerta pendente para a seleção atual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between ${
                alert.isOverdue ? 'border-rose-200/90' : 'border-amber-200/90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      alert.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.isOverdue ? 'Refil Vencido' : 'Troca Próxima'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1.5">{alert.clientName}</h4>
                  </div>

                  <span className="text-xs font-bold text-blue-600">#{alert.osNumber}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Aparelho:</span>
                    <span className="font-medium text-slate-900">{alert.equipment || 'Purificador'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Data Prevista: <strong className={alert.isOverdue ? 'text-rose-600' : 'text-amber-700'}>{formatSimpleDate(alert.returnDate)}</strong></span>
                  </div>

                  {alert.clientPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{alert.clientPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewOS(alert)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver OS</span>
                </button>

                <button
                  onClick={() => {
                    const msg = generateAlertWhatsAppText(alert, settings);
                    sendWhatsAppMessage(alert.clientPhone, msg);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chamar no WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}