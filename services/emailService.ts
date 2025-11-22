// Email service for automatic sending
import { generateEmailBody } from './geminiService';
import { generateInvoicePDF } from './pdfService';
import { Invoice, CompanyInfo } from '../types';

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
 * Share invoice via native share sheet (iOS/Android) or fallback to mailto
 */
export const shareInvoice = async (invoice: Invoice, companyInfo: CompanyInfo | null): Promise<void> => {
    try {
        // 1. Generate PDF
        const pdfFile = await generateInvoicePDF(invoice, companyInfo);

        // 2. Archive PDF to Firestore (Background)
        const reader = new FileReader();
        reader.readAsDataURL(pdfFile);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            // We need the user ID. Since this is a service, we might not have it directly.
            // We can pass it or get it from auth if we import auth.
            // Let's import auth from firebase.ts
            const { auth } = await import('../firebase');
            if (auth.currentUser) {
                const { saveInvoicePDF } = await import('./firestore');
                saveInvoicePDF(auth.currentUser.uid, invoice.id, base64data)
                    .then(() => console.log('📄 PDF Archived to DB'))
                    .catch(err => console.error('❌ Failed to archive PDF', err));
            }
        };

        // 3. Generate Email Content
        const emailData = await generateInvoiceEmail(invoice, companyInfo);

        // 3. Check for Native Share Support
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
                title: emailData.subject,
                text: emailData.body,
                files: [pdfFile]
            });
            console.log('Shared successfully via native share sheet');
        } else {
            // Fallback: Mailto (cannot attach file, but pre-fills text)
            console.warn('Native sharing not supported or files not shareable. Falling back to mailto.');
            alert("Le partage de fichier n'est pas supporté sur ce navigateur. Ouverture du client mail (sans pièce jointe).");
            await sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Error sharing invoice:', error);
        // If user cancelled share, do nothing
        if ((error as any).name !== 'AbortError') {
            alert("Erreur lors du partage de la facture.");
        }
    }
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
