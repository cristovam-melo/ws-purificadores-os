import { cleanPhone, formatCurrency } from '../utils/formatters';

/**
 * Abre um link externo utilizando o plugin nativo do Tauri no desktop,
 * com fallback transparente para o navegador caso esteja em modo web.
 */
export async function openExternalUrl(url) {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
    return true;
  } catch (err) {
    console.warn('Abertura nativa via Tauri indisponível, usando fallback web:', err);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    return true;
  }
}

/**
 * Dispara mensagem para o WhatsApp.
 * @param {string} phone - Telefone do cliente
 * @param {string} message - Texto da mensagem
 * @param {object} options - Opções de envio ({ mode: 'desktop' | 'web' | 'wa_me' })
 */
export async function sendWhatsAppMessage(phone, message, options = {}) {
  let cleaned = cleanPhone(phone);
  if (!cleaned) return false;
  
  // Se não tiver DDI (ex: Brasil 55), adiciona se tiver 10 ou 11 dígitos
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  
  const encodedText = encodeURIComponent(message);
  const mode = options.mode || 'desktop'; // 'desktop' (abre direto app instalado), 'web' (navegador), 'wa_me' (universal)
  
  let primaryUrl;
  let fallbackUrl;

  if (mode === 'desktop') {
    primaryUrl = `whatsapp://send?phone=${cleaned}&text=${encodedText}`;
    fallbackUrl = `https://wa.me/${cleaned}?text=${encodedText}`;
  } else if (mode === 'web') {
    primaryUrl = `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`;
    fallbackUrl = primaryUrl;
  } else {
    primaryUrl = `https://wa.me/${cleaned}?text=${encodedText}`;
    fallbackUrl = primaryUrl;
  }

  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(primaryUrl);
    return true;
  } catch (err) {
    console.warn('Abertura nativa de WhatsApp falhou, usando fallback no navegador:', err);
    if (typeof window !== 'undefined') {
      window.open(fallbackUrl, '_blank');
    }
    return true;
  }
}

export async function sendTelegramMessage(text) {
  const encoded = encodeURIComponent(text);
  const url = `https://t.me/share/url?url=&text=${encoded}`;
  return openExternalUrl(url);
}

export async function sendEmail(email, subject, body) {
  if (!email) return false;
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return openExternalUrl(url);
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
