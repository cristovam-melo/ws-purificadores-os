import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { addMonths, format, parse } from 'date-fns';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Converte data DD/MM/AAAA para YYYY-MM-DD
 */
function parseBrazilianDate(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Converte string de valor monetário ("300,00" ou "1.250,50") para número float
 */
function parseCurrency(valStr) {
  if (!valStr) return 0;
  const clean = valStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extrai todo o texto de um arquivo PDF
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = textContent.items
      .map(item => item.str)
      .filter(str => str !== undefined);
    fullText += pageLines.join('\n') + '\n';
  }

  return fullText;
}

/**
 * Analisa o texto extraído do PDF e monta o objeto da Ordem de Serviço
 * @param {string} text
 * @param {string} filename
 * @returns {object}
 */
export function parseOSText(text, filename = '') {
  // Normalizar quebras de linha e espaços múltiplos
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Número da OS
  const osMatch = text.match(/(?:Número da OS|N[ºo]\.?\s*da\s*OS)[:\s]*#?\s*(\d+)/i);
  const osNumber = osMatch ? parseInt(osMatch[1], 10) : 0;

  // 2. Data
  const dateMatch = text.match(/(?:Data)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const rawDate = dateMatch ? dateMatch[1] : '';
  const date = parseBrazilianDate(rawDate) || format(new Date(), 'yyyy-MM-dd');

  // 3. Status
  const statusMatch = text.match(/(?:Status)[:\s]*([A-Za-zÀ-ÿ\s]+?)(?=\n|Ordem|Cliente|#|$)/i);
  const status = statusMatch ? statusMatch[1].trim() : 'Aprovado';

  // Helper para buscar texto entre seções
  const extractBetween = (startKeyword, endKeywords) => {
    const startIdx = rawLines.findIndex(l => l.toLowerCase() === startKeyword.toLowerCase());
    if (startIdx === -1) return [];

    const result = [];
    for (let i = startIdx + 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (endKeywords.some(end => line.toLowerCase().startsWith(end.toLowerCase()))) {
        break;
      }
      result.push(line);
    }
    return result;
  };

  // 4. Seção Cliente (Nome, Telefone, Endereço)
  const clientLines = extractBetween('Cliente', ['Equipamentos', 'Equipamento', 'Defeitos']);
  let clientName = '';
  let clientPhone = '';
  let clientAddress = '';

  if (clientLines.length > 0) {
    clientName = clientLines[0];
    
    // Procura por telefone nas linhas subsequentes
    const phoneRegex = /(?:\(?\d{2}\)?\s*)?\d{4,5}-?\d{4}/;
    const phoneIdx = clientLines.findIndex((l, idx) => idx > 0 && phoneRegex.test(l));
    
    if (phoneIdx !== -1) {
      clientPhone = clientLines[phoneIdx];
      // O que estiver depois do telefone é considerado endereço
      const addressLines = clientLines.filter((_, idx) => idx !== 0 && idx !== phoneIdx);
      clientAddress = addressLines.join(', ');
    } else if (clientLines.length > 1) {
      clientAddress = clientLines.slice(1).join(', ');
    }
  }

  // 5. Equipamentos
  const equipLines = extractBetween('Equipamentos', ['Defeitos', 'Defeito', 'Relatório']);
  const equipment = equipLines.join(' ').replace(/^nenhum informado$/i, '') || '';

  // 6. Defeitos
  const defectLines = extractBetween('Defeitos', ['Relatório Técnico', 'Relatório', 'Produtos']);
  const defect = defectLines.join(' ').replace(/^nenhum informado$/i, '') || '';

  // 7. Relatório Técnico
  const reportLines = extractBetween('Relatório Técnico', ['Produtos', 'Garantia']);
  const technicalReport = reportLines.join('\n').replace(/^nenhum informado$/i, '') || '';

  // 8. Garantia
  const warrantyLines = extractBetween('Garantia', ['Produtos', 'Total', 'Assinatura']);
  const warranty = warrantyLines[0] || '12 meses';

  // 9. Total
  const totalMatch = text.match(/(?:Total)[:\s]*R\$\s*([\d\.,]+)/i);
  const totalAmount = totalMatch ? parseCurrency(totalMatch[1]) : 0;

  // 10. Produtos
  const productLines = extractBetween('Produtos', ['Garantia', 'Total', 'Assinatura']);
  const products = [];
  
  // Regex para linha de produto: Descrição Quantidade R$ Unitário R$ Total
  const prodRegex = /^(.*?)(?:\s+(\d+))?\s+R\$\s*([\d\.,]+)(?:\s+R\$\s*([\d\.,]+))?$/i;

  for (const line of productLines) {
    if (/descrição|quantidade|vl\.\s*unitário/i.test(line)) continue;
    if (/nenhum produto listado/i.test(line)) continue;

    const match = line.match(prodRegex);
    if (match) {
      const desc = match[1].trim();
      const qty = match[2] ? parseInt(match[2], 10) : 1;
      const unit = parseCurrency(match[3]);
      const tot = match[4] ? parseCurrency(match[4]) : unit * qty;
      products.push({
        description: desc,
        quantity: qty,
        unitPrice: unit,
        totalPrice: tot
      });
    } else if (line.length > 2 && !/produtos|total/i.test(line)) {
      // Linha simples de produto
      products.push({
        description: line,
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount
      });
    }
  }

  // 11. Calcular data de retorno prevista (Troca de Refil)
  // Baseado na garantia ou padrão 12 meses
  let returnMonths = 12;
  const warrantyMonthMatch = warranty.match(/(\d+)\s*mes/i);
  if (warrantyMonthMatch) {
    returnMonths = parseInt(warrantyMonthMatch[1], 10);
  }

  let returnDate = '';
  try {
    const baseDate = parse(date, 'yyyy-MM-dd', new Date());
    returnDate = format(addMonths(baseDate, returnMonths), 'yyyy-MM-dd');
  } catch {
    returnDate = '';
  }

  return {
    osNumber: osNumber || Math.floor(100 + Math.random() * 900),
    date,
    status,
    clientName: clientName.trim(),
    clientPhone: clientPhone.trim(),
    clientAddress: clientAddress.trim(),
    equipment: equipment.trim(),
    defect: defect.trim(),
    technicalReport: technicalReport.trim(),
    warranty: warranty.trim(),
    products: products.length > 0 ? products : [
      {
        description: technicalReport || 'Serviço de Manutenção / Troca de Refil',
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount
      }
    ],
    totalAmount,
    returnDate,
    sourceFileName: filename
  };
}

/**
 * Lê e analisa múltiplos arquivos PDF
 * @param {FileList | File[]} files
 * @param {(progress: { current: number, total: number, filename: string }) => void} onProgress
 * @returns {Promise<{ success: object[], errors: { filename: string, error: string }[] }>}
 */
export async function parseMultiplePDFs(files, onProgress) {
  const fileArray = Array.from(files);
  const success = [];
  const errors = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (onProgress) {
      onProgress({ current: i + 1, total: fileArray.length, filename: file.name });
    }

    try {
      const text = await extractTextFromPDF(file);
      const parsedOS = parseOSText(text, file.name);
      success.push(parsedOS);
    } catch (err) {
      console.error(`Erro ao analisar ${file.name}:`, err);
      errors.push({ filename: file.name, error: err.message || 'Falha ao ler PDF' });
    }
  }

  return { success, errors };
}
