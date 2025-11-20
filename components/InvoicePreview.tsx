import React from 'react';
import { CompanyInfo, ClientInfo, LineItem, ThemeColor } from '../types';

interface InvoicePreviewProps {
  companyInfo: CompanyInfo | null;
  clientInfo: ClientInfo;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  gstAmount: number;
  qstAmount: number;
  total: number;
  themeColor: ThemeColor;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'S.O.';
    const date = new Date(dateString);
    // Add time zone offset to prevent date from changing
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(adjustedDate);
}

const themes = {
  light: {
    bg: 'bg-white',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textHeader: 'text-gray-600',
    border: 'border-gray-100',
    tableHeaderBg: 'bg-gray-100',
    totalBorder: 'border-gray-800',
  },
  dark: {
    bg: 'bg-slate-800',
    textPrimary: 'text-slate-200',
    textSecondary: 'text-slate-400',
    textHeader: 'text-slate-300',
    border: 'border-slate-700',
    tableHeaderBg: 'bg-slate-700/50',
    totalBorder: 'border-slate-300',
  }
};


const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  companyInfo, clientInfo, invoiceNumber, invoiceDate, dueDate, lineItems, subtotal, gstAmount, qstAmount, total, themeColor
}) => {
  const theme = themes[themeColor] || themes.light;
  const textColorClass = themeColor === 'dark' ? 'text-white' : 'text-black';

  return (
    <div id="invoice-preview" className={`${theme.bg} ${textColorClass} p-8 md:p-12 shadow-2xl rounded-lg h-full overflow-auto transition-colors duration-300 relative`}>
      <div className="flex justify-between items-start mb-12">
        <div>
          {companyInfo?.logo && <img src={companyInfo.logo} alt="Logo de l'entreprise" className={`h-16 mb-4 max-w-[200px] object-contain ${themeColor === 'dark' ? 'bg-white/10 rounded-md p-1' : ''}`} />}
          <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>{companyInfo?.name || 'Votre Entreprise'}</h1>
          <p className={`${theme.textSecondary} text-sm whitespace-pre-line`}>{companyInfo?.address}</p>
          <p className={`${theme.textSecondary} text-sm`}>{companyInfo?.email}</p>
          <p className={`${theme.textSecondary} text-sm`}>{companyInfo?.phone}</p>
        </div>
        <div className="text-right">
          <h2 className={`text-3xl font-bold ${theme.textPrimary} uppercase tracking-wider`}>FACTURE</h2>
          <p className={`${theme.textSecondary} mt-2`}># {invoiceNumber}</p>
        </div>
      </div>

      <div className="flex justify-between mb-12">
        <div>
          <h3 className={`font-bold ${theme.textHeader} mb-1`}>Facturer à</h3>
          <p className={`font-semibold ${theme.textPrimary}`}>{clientInfo.name}</p>
          <p className={`${theme.textSecondary} text-sm whitespace-pre-line`}>{clientInfo.address}</p>
          <p className={`${theme.textSecondary} text-sm`}>{clientInfo.email}</p>
        </div>
        <div className="text-right">
          <h3 className={`font-bold ${theme.textHeader} mb-1`}>Date</h3>
          <p className={theme.textPrimary}>{formatDate(invoiceDate)}</p>
          <h3 className={`font-bold ${theme.textHeader} mt-4 mb-1`}>Date d'échéance</h3>
          <p className={theme.textPrimary}>{dueDate ? formatDate(dueDate) : 'S.O.'}</p>
        </div>
      </div>

      <table className="w-full text-left mb-12">
        <thead>
          <tr className={theme.tableHeaderBg}>
            <th className={`p-3 font-bold ${theme.textHeader} uppercase text-sm`}>Description</th>
            <th className={`p-3 font-bold ${theme.textHeader} uppercase text-sm text-center`}>Qté</th>
            <th className={`p-3 font-bold ${theme.textHeader} uppercase text-sm text-right`}>Prix Unitaire</th>
            <th className={`p-3 font-bold ${theme.textHeader} uppercase text-sm text-right`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map(item => (
            <tr key={item.id} className={`border-b ${theme.border}`}>
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-center">{item.quantity}</td>
              <td className="p-3 text-right">{formatCurrency(item.price)}</td>
              <td className="p-3 text-right">{formatCurrency(item.quantity * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-full max-w-xs">
          <div className={`flex justify-between ${theme.textHeader}`}>
            <p>Sous-total</p>
            <p>{formatCurrency(subtotal)}</p>
          </div>
          <div className={`flex justify-between ${theme.textHeader} mt-2`}>
            <p>TPS (5%)</p>
            <p>{formatCurrency(gstAmount)}</p>
          </div>
           <div className={`flex justify-between ${theme.textHeader} mt-2`}>
            <p>TVQ (9.975%)</p>
            <p>{formatCurrency(qstAmount)}</p>
          </div>
          <div className={`mt-4 pt-4 border-t-2 ${theme.totalBorder} flex justify-between font-bold ${theme.textPrimary} text-xl`}>
            <p>Total</p>
            <p>{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
      
      <div className={`mt-16 text-center ${theme.textSecondary} text-xs`}>
          <p>Merci de faire affaire avec nous !</p>
      </div>
    </div>
  );
};

export default InvoicePreview;