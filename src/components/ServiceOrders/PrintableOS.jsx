import React from 'react';
import { formatCurrency, formatSimpleDate } from '../../utils/formatters';

export const PrintableOS = React.forwardRef(({ os, settings }, ref) => {
  if (!os) return null;

  return (
    <div
      ref={ref}
      id="printable-os-area"
      className="bg-white text-black p-8 max-w-[800px] mx-auto font-sans leading-tight shadow-sm print:shadow-none print:p-0 print:m-0"
      style={{ minHeight: '1050px', boxSizing: 'border-box' }}
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" className="h-14 w-auto object-contain" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-inner">
              WS
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize tracking-tight">
              {settings?.companyName || 'ws purificadores de água'}
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              {settings?.phone || '(85) 98870-2905'} | {settings?.email || 'wspurificadoresdeagua@gmail.com'}
            </p>
          </div>
        </div>

        <div className="text-right text-sm space-y-1">
          <div className="flex justify-end gap-2">
            <span className="text-gray-500 font-medium">Número da OS:</span>
            <span className="font-bold text-gray-900 text-base">#{os.osNumber}</span>
          </div>
          <div className="flex justify-end gap-2">
            <span className="text-gray-500 font-medium">Data:</span>
            <span className="text-gray-900 font-semibold">{formatSimpleDate(os.date)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="text-gray-900 font-semibold">{os.status || 'Aprovado'}</span>
          </div>
        </div>
      </div>

      {/* Título Principal */}
      <div className="text-center my-6">
        <h2 className="text-xl font-bold text-gray-800 tracking-wide">Ordem de Serviço</h2>
      </div>

      {/* Seção: Cliente */}
      <div className="mb-4">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</div>
          <div className="font-semibold text-gray-900 text-base">{os.clientName || '---'}</div>
          <div className="text-sm text-gray-700 mt-0.5">{os.clientPhone || ''}</div>
          {os.clientAddress && (
            <div className="text-sm text-gray-600 mt-0.5">{os.clientAddress}</div>
          )}
        </div>
      </div>

      {/* Seção: Equipamentos */}
      <div className="mb-4">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Equipamentos</div>
          <div className="text-sm text-gray-800 font-medium">{os.equipment || 'Nenhum informado'}</div>
        </div>
      </div>

      {/* Seção: Defeitos */}
      <div className="mb-4">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Defeitos</div>
          <div className="text-sm text-gray-800 font-medium">{os.defect || 'Nenhum informado'}</div>
        </div>
      </div>

      {/* Seção: Relatório Técnico */}
      <div className="mb-5">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Relatório Técnico</div>
          <div className="text-sm text-gray-800 font-medium whitespace-pre-line">{os.technicalReport || 'Nenhum informado'}</div>
        </div>
      </div>

      {/* Seção: Produtos / Peças */}
      <div className="mb-6">
        <div className="text-sm font-bold text-gray-800 mb-2">Produtos</div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 font-semibold">
              <th className="py-2 font-medium">Descrição</th>
              <th className="py-2 text-center font-medium w-24">Quantidade</th>
              <th className="py-2 text-right font-medium w-28">Vl. Unitário</th>
              <th className="py-2 text-right font-medium w-28">Vl. Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {os.products && os.products.length > 0 ? (
              os.products.map((item, idx) => (
                <tr key={idx} className="text-gray-800">
                  <td className="py-2.5 font-normal">{item.description}</td>
                  <td className="py-2.5 text-center font-normal">{item.quantity}</td>
                  <td className="py-2.5 text-right font-normal">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-normal">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-3 text-center text-gray-400 italic">Nenhum produto listado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Seção: Garantia e Totais */}
      <div className="flex justify-between items-start pt-2 mb-16">
        <div className="space-y-1">
          <div className="text-sm font-bold text-gray-800">Garantia</div>
          <div className="text-sm text-gray-700">{os.warranty || settings?.standardWarranty || '12 meses'}</div>
        </div>

        <div className="w-64 border border-gray-200 rounded-md overflow-hidden text-sm">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Produtos</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(os.productsTotal || os.totalAmount || 0)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5 bg-gray-100 font-bold text-base">
            <span className="text-gray-900">Total</span>
            <span className="text-blue-900">{formatCurrency(os.totalAmount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Linhas de Assinatura */}
      <div className="grid grid-cols-2 gap-12 pt-8 mt-auto">
        <div className="text-center">
          <div className="border-t border-gray-800 w-full mb-2"></div>
          <div className="text-xs font-semibold text-gray-700">Assinatura do Cliente</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 w-full mb-2"></div>
          <div className="text-xs font-semibold text-gray-700">Assinatura do Técnico</div>
        </div>
      </div>
    </div>
  );
});

PrintableOS.displayName = 'PrintableOS';
