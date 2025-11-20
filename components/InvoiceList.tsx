import React from 'react';
import { Invoice } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface InvoiceListProps {
  invoices: Invoice[];
  selectedInvoiceId: string | null;
  onSelectInvoice: (id: string) => void;
  onNewInvoice: () => void;
  onDeleteInvoice: (id: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  selectedInvoiceId,
  onSelectInvoice,
  onNewInvoice,
  onDeleteInvoice,
}) => {
  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNewInvoice}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Nouvelle Facture
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <nav className="p-2 space-y-1">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                selectedInvoiceId === invoice.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => onSelectInvoice(invoice.id)}
            >
              <div className="truncate">
                <p
                  className={`font-semibold truncate ${
                    selectedInvoiceId === invoice.id
                      ? 'text-white'
                      : 'text-slate-200'
                  }`}
                >
                  Facture #{invoice.invoiceNumber}
                </p>
                <p className="text-sm truncate">
                  {invoice.clientInfo.name}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting the invoice
                  onDeleteInvoice(invoice.id);
                }}
                className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedInvoiceId === invoice.id
                    ? 'text-indigo-200 hover:bg-indigo-500 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-700 hover:text-red-400'
                }`}
                aria-label="Supprimer la facture"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default InvoiceList;
