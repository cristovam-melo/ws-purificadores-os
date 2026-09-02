import { cleanPhone, formatCurrency } from '../utils/formatters';

export function sendWhatsAppMessage(phone, message) {
  let cleaned = cleanPhone(phone);
  if (!cleaned) return false;
  
  // Se não tiver DDI (ex: Brasil 55), adiciona se tiver 10 ou 11 dígitos
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encodedText}`;
  window.open(url, '_blank');
  return true;
}

export function sendTelegramMessage(text) {
  const encoded = encodeURIComponent(text);
  const url = `https://t.me/share/url?url=&text=${encoded}`;
  window.open(url, '_blank');
}

export function sendEmail(email, subject, body) {
  if (!email) return false;
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
  return true;
}

export function generateOSWhatsAppText(os, settings) {
  const template = settings?.whatsappTemplateOS || 
    'Olá {cliente}, sua Ordem de Serviço #{osNumber} da WS Purificadores está pronta! Status: {status}. Total: R$ {total}.';
  
  return template
    .replace('{cliente}', os.clientName || 'Cliente')
    .replace('{osNumber}', os.osNumber || '')
    .replace('{status}', os.status || 'Finalizado')
    .replace('{total}', formatCurrency(os.totalAmount || 0))
    .replace('{equipamento}', os.equipment || '');
}

export function generateAlertWhatsAppText(os, settings) {
  const template = settings?.whatsappTemplateAlert || 
    'Olá {cliente}! Tudo bem? Verificamos aqui que faz {meses} meses desde a manutenção/troca de refil do seu purificador ({equipamento}). Para manter a água sempre pura e seu aparelho protegido, gostaria de agendar a troca do elemento filtrante?';
  
  return template
    .replace('{cliente}', os.clientName || 'Cliente')
    .replace('{equipamento}', os.equipment || 'Purificador')
    .replace('{meses}', settings?.returnMonths || 12);
}
