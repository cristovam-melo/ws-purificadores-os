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
      whatsappTemplateOS: 'Olá {cliente}, sua Ordem de Serviço #{osNumber} da WS Purificadores está pronta! Status: {status}. Total: R$ {total}. Qualquer dúvida estamos à disposição!',
      whatsappAppMode: 'desktop' // 'desktop' (App WhatsApp do Windows), 'web' (WhatsApp Web), 'wa_me' (wa.me)
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

  // Popula 3 clientes de teste com refil vencido para teste de alertas
  await seedMockOverdueData();
}

/**
 * Cria 3 usuários fictícios com manutenção/refil vencido para testes
 */
export async function seedMockOverdueData(force = false) {
  const existingOverdue = await db.serviceOrders
    .filter(os => {
      if (!os.returnDate) return false;
      return new Date(os.returnDate) < new Date();
    })
    .count();

  if (existingOverdue < 3 || force) {
    const mocks = [
      {
        name: 'Carlos Eduardo Menezes',
        phone: '(85) 98765-4321',
        email: 'carlos.menezes@exemplo.com',
        address: 'Av. Beira Mar, 2100, Meireles, Fortaleza - CE',
        osNumber: 137,
        equipment: 'Top Life Hexi',
        date: '2025-08-15',
        returnDate: '2026-08-15', // Vencido há ~1.5 meses
        defect: 'Prazo anual de troca atingido',
        technicalReport: 'Troca de refil alcalino e higienização geral',
        totalAmount: 290.00
      },
      {
        name: 'Ana Cláudia Ribeiro',
        phone: '(85) 99123-9876',
        email: 'ana.ribeiro@exemplo.com',
        address: 'Rua Barbosa de Freitas, 1450, Aldeota, Fortaleza - CE',
        osNumber: 138,
        equipment: 'IBBL FR600 Speciale',
        date: '2025-09-05',
        returnDate: '2026-09-05', // Vencido há ~1 mês
        defect: 'Troca periódica do elemento filtrante',
        technicalReport: 'Substituição de refil C+3 e teste de vazão',
        totalAmount: 250.00
      },
      {
        name: 'Dr. Roberto Albuquerque (Clínica Sorriso)',
        phone: '(85) 99654-1122',
        email: 'roberto.albuquerque@clinicasorriso.com.br',
        address: 'Av. Dom Luís, 500, Sl 804, Aldeota, Fortaleza - CE',
        osNumber: 139,
        equipment: 'Europa Noblesse',
        date: '2025-07-10',
        returnDate: '2026-07-10', // Vencido há quase 3 meses
        defect: 'Troca de refil bacteriológico anual',
        technicalReport: 'Manutenção preventiva e troca do elemento filtrante',
        totalAmount: 380.00
      }
    ];

    for (const mock of mocks) {
      const existingOS = await db.serviceOrders.where('osNumber').equals(mock.osNumber).first();
      if (!existingOS) {
        let client = await db.clients.where('name').equals(mock.name).first();
        let clientId = client?.id;
        if (!clientId) {
          clientId = await db.clients.add({
            name: mock.name,
            phone: mock.phone,
            email: mock.email,
            address: mock.address,
            createdAt: new Date(mock.date)
          });
        }

        await db.serviceOrders.add({
          osNumber: mock.osNumber,
          clientId: clientId,
          clientName: mock.name,
          clientPhone: mock.phone,
          clientAddress: mock.address,
          date: mock.date,
          returnDate: mock.returnDate,
          status: 'Finalizado',
          equipment: mock.equipment,
          defect: mock.defect,
          technicalReport: mock.technicalReport,
          warranty: '12 meses',
          products: [
            {
              id: '1',
              description: 'Elemento Filtrante / Refil',
              quantity: 1,
              unitPrice: mock.totalAmount,
              totalPrice: mock.totalAmount
            }
          ],
          productsTotal: mock.totalAmount,
          totalAmount: mock.totalAmount,
          notes: 'Cliente de teste com manutenção/refil vencido',
          createdAt: new Date(mock.date)
        });
      }
    }
  }
}
