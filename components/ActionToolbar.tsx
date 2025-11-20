import React, { useState } from 'react';
import { DownloadIcon, EmailIcon, SMSIcon, MagicIcon } from './icons';
import { generateEmailBody, generateSmsBody } from '../services/geminiService';
import { ClientInfo } from '../types';

// Declare global properties from CDN scripts
declare const html2canvas: any;
declare const jspdf: { jsPDF: new (options?: any) => any };

interface ActionToolbarProps {
  invoiceNumber: string;
  clientInfo: ClientInfo;
  dueDate: string;
  total: number;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ invoiceNumber, clientInfo, dueDate, total }) => {
  const [isProcessing, setIsProcessing] = useState< 'pdf' | 'email' | 'sms' | null>(null);

  const generateAndDownloadPdf = async () => {
    const input = document.getElementById('invoice-preview');
    if (!input) {
      console.error('Invoice preview element not found');
      throw new Error("L'élément d'aperçu de la facture est introuvable");
    }

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      let finalHeight = height;
      let finalWidth = width;
      if(height > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = finalHeight * ratio;
      }

      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`facture-${invoiceNumber}.pdf`);
    } catch (err) {
        console.error("Error generating PDF", err);
        throw err; // Re-throw to be caught by callers
    }
  };
  
  const handleDownloadPdf = async () => {
    setIsProcessing('pdf');
    try {
      await generateAndDownloadPdf();
    } catch (error) {
       alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsProcessing(null);
    }
  };


  const handleSendEmail = async () => {
    setIsProcessing('email');
    try {
      // Step 1: Generate and download PDF for the user to attach
      await generateAndDownloadPdf();
      
      // Step 2: Generate AI email body
      const promptDetails = `Nom du client: ${clientInfo.name}, Numéro de facture: ${invoiceNumber}, Total: ${total.toFixed(2)}$ CAD, Date d'échéance: ${dueDate || 'S.O.'}`;
      const emailBody = await generateEmailBody(promptDetails);
      const subject = `Facture ${invoiceNumber} de votre entreprise`;
      
      // Step 3: Add instructions to the body and open the mail client
      const finalBody = `${emailBody}\n\n---\n(N'oubliez pas de joindre manuellement le fichier PDF "facture-${invoiceNumber}.pdf" qui vient d'être téléchargé.)`;
      const mailtoLink = `mailto:${clientInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
      window.open(mailtoLink, '_blank');
    } catch (error) {
      console.error('Échec de la préparation du courriel:', error);
      alert('Impossible de préparer le courriel. Le téléchargement du PDF a peut-être échoué.');
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleSendSMS = async () => {
    setIsProcessing('sms');
    try {
      const promptDetails = `Nom du client: ${clientInfo.name}, Numéro de facture: ${invoiceNumber}, Total: ${total.toFixed(2)}$ CAD, Date d'échéance: ${dueDate || 'S.O.'}`;
      const smsBody = await generateSmsBody(promptDetails);
      const smsLink = `sms:?&body=${encodeURIComponent(smsBody)}`;
      window.open(smsLink, '_blank');
    } catch (error) {
      console.error('Échec de la génération du corps du SMS:', error);
       alert('Impossible de générer le contenu du SMS. Veuillez réessayer.');
    } finally {
      setIsProcessing(null);
    }
  };

  const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; processing: boolean; aigen?: boolean }> = ({ onClick, icon, label, processing, aigen }) => (
    <button
      onClick={onClick}
      disabled={processing}
      className="flex flex-col items-center justify-center gap-2 w-28 h-28 bg-slate-800/80 backdrop-blur-sm rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
    >
      <div className="relative">
        {icon}
        {aigen && !processing && <MagicIcon className="absolute -top-1 -right-1 w-4 h-4 text-indigo-400"/>}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {processing && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-lg"><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg></div>}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <ActionButton onClick={handleDownloadPdf} icon={<DownloadIcon className="w-8 h-8" />} label="Télécharger" processing={isProcessing === 'pdf'} />
      <ActionButton onClick={handleSendEmail} icon={<EmailIcon className="w-8 h-8" />} label="Courriel" processing={isProcessing === 'email'} aigen />
      <ActionButton onClick={handleSendSMS} icon={<SMSIcon className="w-8 h-8" />} label="SMS" processing={isProcessing === 'sms'} aigen />
    </div>
  );
};

export default ActionToolbar;