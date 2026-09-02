import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Phone, MapPin } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';

export function OrderFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  clients = [], 
  settings, 
  nextOSNumber = 1 
}) {
  const [formData, setFormData] = useState({
    osNumber: nextOSNumber,
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    returnDate: format(addMonths(new Date(), settings?.returnMonths || 12), 'yyyy-MM-dd'),
    status: 'Aprovado',
    equipment: 'new Platinum',
    defect: 'vencido',
    technicalReport: 'troca do elemento filtrante',
    warranty: settings?.standardWarranty || '12 meses',
    products: [
      { id: '1', description: 'Elemento filtrante top life', quantity: 1, unitPrice: 300, totalPrice: 300 }
    ],
    productsTotal: 300,
    totalAmount: 300,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        products: initialData.products || []
      });
    } else {
      const today = new Date();
      setFormData({
        osNumber: nextOSNumber,
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientAddress: '',
        date: format(today, 'yyyy-MM-dd'),
        returnDate: format(addMonths(today, settings?.returnMonths || 12), 'yyyy-MM-dd'),
        status: 'Aprovado',
        equipment: 'new Platinum',
        defect: 'vencido',
        technicalReport: 'troca do elemento filtrante',
        warranty: settings?.standardWarranty || '12 meses',
        products: [
          { id: '1', description: 'Elemento filtrante top life', quantity: 1, unitPrice: 300, totalPrice: 300 }
        ],
        productsTotal: 300,
        totalAmount: 300,
        notes: ''
      });
    }
  }, [initialData, isOpen, nextOSNumber, settings]);

  if (!isOpen) return null;

  const handleClientSelect = (clientId) => {
    const selected = clients.find(c => String(c.id) === String(clientId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientPhone: selected.phone,
        clientAddress: selected.address
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientAddress: ''
      }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    const current = { ...newProducts[index] };

    if (field === 'quantity') {
      current.quantity = parseFloat(value) || 0;
      current.totalPrice = current.quantity * (current.unitPrice || 0);
    } else if (field === 'unitPrice') {
      current.unitPrice = parseFloat(value) || 0;
      current.totalPrice = (current.quantity || 0) * current.unitPrice;
    } else {
      current[field] = value;
    }

    newProducts[index] = current;
    const total = newProducts.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    setFormData(prev => ({
      ...prev,
      products: newProducts,
      productsTotal: total,
      totalAmount: total
    }));
  };

  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
      ]
    }));
  };

  const removeProductRow = (index) => {
    const newProducts = formData.products.filter((_, idx) => idx !== index);
    const total = newProducts.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    setFormData(prev => ({
      ...prev,
      products: newProducts,
      productsTotal: total,
      totalAmount: total
    }));
  };

  const handleDateChange = (newDate) => {
    try {
      const parsed = new Date(newDate + 'T12:00:00');
      const retDate = format(addMonths(parsed, settings?.returnMonths || 12), 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        date: newDate,
        returnDate: retDate
      }));
    } catch {
      setFormData(prev => ({ ...prev, date: newDate }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Por favor informe o nome do cliente');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {initialData ? `Editar Ordem de Serviço #${formData.osNumber}` : `Nova Ordem de Serviço #${formData.osNumber}`}
            </h3>
            <p className="text-xs text-slate-500">Preencha os dados da OS com agilidade</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Seção 1: Dados Gerais e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Número da OS
              </label>
              <input
                type="number"
                required
                value={formData.osNumber}
                onChange={(e) => setFormData({ ...formData, osNumber: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data de Emissão
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="Aprovado">Aprovado</option>
                <option value="Concluído">Concluído</option>
                <option value="Orçamento">Orçamento</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Seção 2: Dados do Cliente */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Dados do Cliente
              </span>

              {clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Selecionar existente:</span>
                  <select
                    value={formData.clientId || ''}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Escolha um cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(85) 99726-6035"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Endereço Completo</label>
              <input
                type="text"
                placeholder="Rua Ramos Botelho/ tv rio claro, 37, papicu, Fortaleza - CE"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Seção 3: Equipamentos, Defeitos e Relatório Técnico */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Equipamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: new Platinum, Top Life, Soft Star..."
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Defeitos Constatados
                </label>
                <input
                  type="text"
                  placeholder="Ex: vencido, vazamento, gosto estranho..."
                  value={formData.defect}
                  onChange={(e) => setFormData({ ...formData, defect: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Relatório Técnico / Serviço Realizado
              </label>
              <textarea
                rows="2"
                placeholder="Ex: troca do elemento filtrante, higienização interna e troca de mangueiras"
                value={formData.technicalReport}
                onChange={(e) => setFormData({ ...formData, technicalReport: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          {/* Seção 4: Produtos e Peças */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Produtos & Peças Utilizadas
              </span>
              <button
                type="button"
                onClick={addProductRow}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {formData.products.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Descrição do produto ou refil"
                      value={item.description}
                      onChange={(e) => handleProductChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-center text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Vl. Unit."
                        value={item.unitPrice}
                        onChange={(e) => handleProductChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 text-right text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-sm text-slate-800">
                      {formatCurrency(item.totalPrice || 0)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProductRow(idx)}
                      disabled={formData.products.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 5: Garantia, Previsão de Retorno (CRM) e Totais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prazo de Garantia
              </label>
              <input
                type="text"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="12 meses"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                Data Prevista Retorno (Alerta)
              </label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-amber-50/60 border border-amber-200 rounded-xl focus:bg-white focus:outline-none font-medium text-amber-900"
              />
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-right">
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Valor Total</span>
              <span className="text-xl font-black text-blue-700">{formatCurrency(formData.totalAmount)}</span>
            </div>
          </div>

          {/* Footer Ações */}
          <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Salvar Ordem de Serviço
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}