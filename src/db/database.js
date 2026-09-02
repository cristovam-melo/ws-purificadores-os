import Dexie from 'dexie';

export const db = new Dexie('WS_Purificadores_DB');

db.version(2).stores({
  clients: '++id, name, phone, email, address, createdAt',
  serviceOrders: '++id, osNumber, clientId, clientName, date, returnDate, status, equipment, totalAmount, createdAt',
  settings: 'id, companyName, phone, email, address, logo, pixKey, standardWarranty, returnMonths',
  backupConfig: 'key'
});

// Inicializa configurações padrão se não existirem
export async function initDefaultSettings() {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.add({
      id: 'default',
      companyName: 'ws purificadores de água',
      phone: '(85) 98870-2905',
      email: 'wspurificadoresdeagua@gmail.com',
      address: 'Fortaleza - CE',
      logo: '',
      pixKey: 'wspurificadoresdeagua@gmail.com',
      standardWarranty: '12 meses',
      returnMonths: 12,
      whatsappTemplateAlert: 'Olá {cliente}! Tudo bem? Verificamos aqui que faz {meses} meses desde a manutenção/troca de refil do seu purificador ({equipamento}). Para manter a água sempre pura e seu aparelho protegido, gostaria de agendar a troca do elemento filtrante?',
      whatsappTemplateOS: 'Olá {cliente}, sua Ordem de Serviço #{osNumber} da WS Purificadores está pronta! Status: {status}. Total: R$ {total}. Qualquer dúvida estamos à disposição!'
    });
  }

  // Se não houver ordens de serviço, adiciona exemplo do modelo para demonstração rápida
  const osCount = await db.serviceOrders.count();
  if (osCount === 0) {
    const clientId = await db.clients.add({
      name: 'Maria Verônica Soeiro Ferreira',
      phone: '(85) 99726-6035',
      email: 'maria.veronica@exemplo.com',
      address: 'Rua Ramos Botelho/ tv rio claro, 37, papicu, Fortaleza - CE',
      createdAt: new Date('2026-07-21T10:00:00')
    });

    await db.serviceOrders.add({
      osNumber: 136,
      clientId: clientId,
      clientName: 'Maria Verônica Soeiro Ferreira',
      clientPhone: '(85) 99726-6035',
      clientAddress: 'Rua Ramos Botelho/ tv rio claro, 37, papicu, Fortaleza - CE',
      date: '2026-07-21',
      returnDate: '2027-07-21',
      status: 'Aprovado',
      equipment: 'new Platinum',
      defect: 'vencido',
      technicalReport: 'troca do elemento filtrante',
      warranty: '12 meses',
      products: [
        {
          id: '1',
          description: 'Elemento filtrante top life',
          quantity: 1,
          unitPrice: 300.00,
          totalPrice: 300.00
        }
      ],
      productsTotal: 300.00,
      totalAmount: 300.00,
      notes: '',
      createdAt: new Date('2026-07-21T10:00:00')
    });
  }
}
