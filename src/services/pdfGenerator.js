import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';

export async function generatePDFFromElement(element, filename = 'ordem-de-servico.pdf') {
  if (!element) return;

  try {
    const canvas = await toCanvas(element, {
      pixelRatio: 2, // Maior resolução
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 largura em mm
    const pageHeight = 297; // A4 altura em mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}
