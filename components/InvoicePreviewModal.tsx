import React from 'react';
import ReactDOM from 'react-dom';
import { Invoice, CompanyInfo } from '../types';

interface InvoicePreviewModalProps {
    invoice: Invoice;
    companyInfo: CompanyInfo | null;
    onClose: () => void;
    onSendEmail: () => void;
    onModify: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
    invoice,
    companyInfo,
    onClose,
    onSendEmail,
    onModify
}) => {
    const calculateSubtotal = () => {
        return invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const subtotal = calculateSubtotal();
    const tps = subtotal * 0.05; // 5%
    const tvq = subtotal * 0.09975; // 9.975%
    const total = subtotal + tps + tvq;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
            <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-700 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">✨ Facture Créée!</h2>
                            <p className="text-indigo-100">Vérifiez les détails ci-dessous</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6">

                    {/* Company Info */}
                    {companyInfo && (
                        <div className="mb-6 pb-6 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-indigo-400 mb-2">De:</h3>
                            <p className="text-white font-bold text-xl">{companyInfo.name}</p>
                            <p className="text-slate-300">{companyInfo.address}</p>
                            <p className="text-slate-300">{companyInfo.email}</p>
                            <p className="text-slate-300">{companyInfo.phone}</p>
                        </div>
                    )}

                    {/* Client Info */}
                    <div className="mb-6 pb-6 border-b border-slate-700">
                        <h3 className="text-lg font-bold text-purple-400 mb-2">Pour:</h3>
                        <p className="text-white font-bold text-xl">{invoice.clientInfo.name}</p>
                        {invoice.clientInfo.address && invoice.clientInfo.address !== 'N/A' && (
                            <p className="text-slate-300">{invoice.clientInfo.address}</p>
                        )}
                        {invoice.clientInfo.email && invoice.clientInfo.email !== 'N/A' && (
                            <p className="text-slate-300">{invoice.clientInfo.email}</p>
                        )}
                    </div>

                    {/* Invoice Details */}
                    <div className="mb-6 pb-6 border-b border-slate-700 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-slate-400 text-sm">Numéro de facture</p>
                            <p className="text-white font-bold">#{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Date</p>
                            <p className="text-white font-bold">{invoice.invoiceDate}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Articles/Services</h3>
                        <div className="space-y-2">
                            {invoice.lineItems.map((item) => (
                                <div key={item.id} className="bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{item.description}</p>
                                        <p className="text-slate-400 text-sm">{item.quantity} × {item.price.toFixed(2)}$</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold text-lg">
                                            {(item.quantity * item.price).toFixed(2)}$
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/30">
                        <div className="space-y-3">
                            <div className="flex justify-between text-slate-300">
                                <span>Sous-total</span>
                                <span className="font-semibold">{subtotal.toFixed(2)}$</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>TPS (5%)</span>
                                <span className="font-semibold">{tps.toFixed(2)}$</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>TVQ (9.975%)</span>
                                <span className="font-semibold">{tvq.toFixed(2)}$</span>
                            </div>
                            <div className="pt-3 border-t border-indigo-500/30 flex justify-between items-center">
                                <span className="text-white font-bold text-xl">TOTAL</span>
                                <span className="text-white font-bold text-3xl">{total.toFixed(2)}$</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                    >
                        Fermer
                    </button>
                    <button
                        onClick={onModify}
                        className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        Modifier
                    </button>
                    <button
                        onClick={onSendEmail}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                        Envoyer par Email
                    </button>
                </div>
            </div>
        </div>
    );

    // Temporarily disable Portal for debugging
    return ReactDOM.createPortal(modalContent, document.body);
};

export default InvoicePreviewModal;
