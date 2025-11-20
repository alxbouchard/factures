// Email service for automatic sending
import { generateEmailBody } from './geminiService';

export interface EmailData {
    to: string;
    subject: string;
    body: string;
    pdfBlob?: Blob;
}

/**
 * Send email via mailto: link (opens user's email client)
 * This is a fallback approach that doesn't require a backend
 */
export const sendEmailViaMailto = async (data: EmailData): Promise<void> => {
    const { to, subject, body } = data;

    // Encode for URL
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    // Create mailto link
    const mailtoLink = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;

    // Open in new window/tab
    window.location.href = mailtoLink;

    return Promise.resolve();
};

/**
 * Generate email details for an invoice
 */
export const generateInvoiceEmail = async (invoice: any, companyInfo: any): Promise<EmailData> => {
    const invoiceDetails = `
Numéro de facture: ${invoice.invoiceNumber || 'N/A'}
Client: ${invoice.clientInfo?.name || 'N/A'}
Date: ${invoice.invoiceDate || 'N/A'}
Montant: ${calculateTotal(invoice)} CAD
  `.trim();

    const body = await generateEmailBody(invoiceDetails);

    return {
        to: invoice.clientInfo?.email || '',
        subject: `Facture ${invoice.invoiceNumber} - ${companyInfo?.name || 'Votre entreprise'}`,
        body
    };
};

/**
 * Calculate invoice total
 */
const calculateTotal = (invoice: any): string => {
    const subtotal = invoice.lineItems?.reduce((acc: number, item: any) =>
        acc + (item.quantity * item.price), 0) || 0;

    const GST_RATE = 0.05;
    const QST_RATE = 0.09975;
    const gstAmount = subtotal * GST_RATE;
    const qstAmount = subtotal * QST_RATE;
    const total = subtotal + gstAmount + qstAmount;

    return total.toFixed(2);
};

/**
 * Future: Send email via backend API
 * This would use a service like Resend, SendGrid, or AWS SES
 */
export const sendEmailViaAPI = async (data: EmailData): Promise<void> => {
    // TODO: Implement when backend is ready
    console.log('Sending email via API:', data);
    throw new Error('Backend email API not implemented yet. Use mailto instead.');
};
