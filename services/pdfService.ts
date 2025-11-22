import jsPDF from 'jspdf';
import { Invoice, CompanyInfo } from '../types';

export const generateInvoicePDF = async (invoice: Invoice, companyInfo: CompanyInfo | null): Promise<File> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper for text
    const addText = (text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.text(text, x, y, { align });
    };

    // Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    addText("FACTURE", margin, 25, 24, 'bold');
    addText(`#${invoice.invoiceNumber}`, pageWidth - margin, 25, 24, 'bold', 'right');
    doc.setTextColor(0, 0, 0);

    yPos = 60;

    // Company Info (Left)
    if (companyInfo) {
        addText("DE:", margin, yPos, 10, 'bold');
        yPos += 5;
        addText(companyInfo.name, margin, yPos, 12, 'bold');
        yPos += 6;
        addText(companyInfo.address, margin, yPos);
        yPos += 5;
        addText(companyInfo.email, margin, yPos);
        yPos += 5;
        addText(companyInfo.phone, margin, yPos);
    }

    // Client Info (Right)
    let rightYPos = 60;
    addText("POUR:", pageWidth - margin, rightYPos, 10, 'bold', 'right');
    rightYPos += 5;
    addText(invoice.clientInfo.name, pageWidth - margin, rightYPos, 12, 'bold', 'right');
    rightYPos += 6;
    if (invoice.clientInfo.address && invoice.clientInfo.address !== 'N/A') {
        addText(invoice.clientInfo.address, pageWidth - margin, rightYPos, 10, 'normal', 'right');
        rightYPos += 5;
    }
    if (invoice.clientInfo.email && invoice.clientInfo.email !== 'N/A') {
        addText(invoice.clientInfo.email, pageWidth - margin, rightYPos, 10, 'normal', 'right');
    }

    yPos = Math.max(yPos, rightYPos) + 20;

    // Dates
    addText(`Date: ${invoice.invoiceDate}`, margin, yPos, 10, 'bold');
    if (invoice.dueDate) {
        addText(`Échéance: ${invoice.dueDate}`, pageWidth - margin, yPos, 10, 'bold', 'right');
    }
    yPos += 15;

    // Table Header
    doc.setFillColor(243, 244, 246); // Gray 100
    doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 10, 'F');
    addText("Description", margin + 2, yPos, 10, 'bold');
    addText("Qté", pageWidth - margin - 40, yPos, 10, 'bold', 'right');
    addText("Prix", pageWidth - margin - 20, yPos, 10, 'bold', 'right');
    addText("Total", pageWidth - margin - 2, yPos, 10, 'bold', 'right');
    yPos += 10;

    // Line Items
    let subtotal = 0;
    invoice.lineItems.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;

        // Background for alternate rows
        if (index % 2 === 1) {
            doc.setFillColor(249, 250, 251); // Gray 50
            doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 10, 'F');
        }

        addText(item.description, margin + 2, yPos);
        addText(item.quantity.toString(), pageWidth - margin - 40, yPos, 10, 'normal', 'right');
        addText(`${item.price.toFixed(2)}$`, pageWidth - margin - 20, yPos, 10, 'normal', 'right');
        addText(`${itemTotal.toFixed(2)}$`, pageWidth - margin - 2, yPos, 10, 'bold', 'right');
        yPos += 10;
    });

    yPos += 10;

    // Totals
    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
    const total = subtotal + tps + tvq;

    const drawTotalLine = (label: string, value: string, isBold: boolean = false) => {
        addText(label, pageWidth - margin - 50, yPos, 10, isBold ? 'bold' : 'normal', 'right');
        addText(value, pageWidth - margin - 2, yPos, 10, isBold ? 'bold' : 'normal', 'right');
        yPos += 7;
    };

    drawTotalLine("Sous-total:", `${subtotal.toFixed(2)}$`);
    drawTotalLine("TPS (5%):", `${tps.toFixed(2)}$`);
    drawTotalLine("TVQ (9.975%):", `${tvq.toFixed(2)}$`);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, yPos - 5, pageWidth - margin, yPos - 5);
    drawTotalLine("TOTAL:", `${total.toFixed(2)}$`, true);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Merci de votre confiance!", pageWidth / 2, pageWidth - 20, { align: 'center' });

    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], `Facture_${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
};
