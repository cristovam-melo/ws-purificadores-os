import React from 'react';
import { 
  FileText, 
  Users, 
  BellRing, 
  TrendingUp, 
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { formatCurrency, formatSimpleDate } from '../../utils/formatters';
import { sendWhatsAppMessage, generateAlertWhatsAppText } from '../../services/messaging';

export function Dashboard({ 
  orders = [], 
  clients = [], 
  alerts = [], 
  settings, 
  onNavigate, 
  onNewOS, 
  onViewOS 
}) {
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'Aprovado' || o.status === 'Concluído').length;

  const recentOrders = [...orders].reverse().slice(0, 5);
  const urgentAlerts = alerts.slice(0, 5);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Ordens</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</h3>
            <p className="text-xs text-slate-400 mt-1">{completedOrders} concluídas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Total</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Serviços & Peças</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clientes Cadastrados</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{clients.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Base ativa</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas de Troca de Refil</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{alerts.length}</h3>
            <p className="text-xs text-amber-500 font-medium mt-1">Vencendo ou vencidos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BellRing className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Seções: Alertas Recentes e Últimas OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Alertas de Manutenção / Troca de Refil */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-slate-800">Lembretes de Troca de Refil / Retorno</h4>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {urgentAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Nenhum alerta de manutenção ou troca de refil pendente no momento.
              </div>
            ) : (
              urgentAlerts.map((alert) => (
                <div key={alert.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{alert.clientName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.isOverdue 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.isOverdue ? 'Vencido' : 'Próximo (30 dias)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Equipamento: <span className="font-medium text-slate-700">{alert.equipment}</span> • Data Prevista: {formatSimpleDate(alert.returnDate)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const msg = generateAlertWhatsAppText(alert, settings);
                      sendWhatsAppMessage(alert.clientPhone, msg);
                    }}
                    title="Enviar WhatsApp de lembrete"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Avisar</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Ordens de Serviço */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-800">Últimas Ordens de Serviço</h4>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Nenhuma ordem de serviço cadastrada.
              </div>
            ) : (
              recentOrders.map((os) => (
                <div key={os.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-blue-600">#{os.osNumber}</span>
                      <span className="font-semibold text-sm text-slate-900">{os.clientName}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {os.equipment} • {formatSimpleDate(os.date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">{formatCurrency(os.totalAmount)}</div>
                    <button
                      onClick={() => onViewOS(os)}
                      className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      Ver PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}