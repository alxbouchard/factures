import React from 'react';
import { ClientInfo, LineItem } from '../types';
import LineItemRow from './LineItemRow';
import { UserIcon, CalendarIcon, HashtagIcon } from './icons';

interface InvoiceFormProps {
  clientInfo: ClientInfo;
  setClientInfo: (updater: (prev: ClientInfo) => ClientInfo) => void;
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  invoiceDate: string;
  setInvoiceDate: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  lineItems: LineItem[];
  setLineItems: (updater: (prev: LineItem[]) => LineItem[]) => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; icon?: React.ReactNode; type?: string; placeholder?: string }> = ({ label, value, onChange, icon, type = 'text', placeholder }) => (
  <div>
    <label className="text-sm font-medium text-slate-400">{label}</label>
    <div className="relative mt-1">
      {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded-md shadow-sm py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 transition ${icon ? 'pl-10' : 'px-3'}`}
      />
    </div>
  </div>
);

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  clientInfo, setClientInfo, invoiceNumber, setInvoiceNumber, invoiceDate, setInvoiceDate, dueDate, setDueDate, lineItems, setLineItems
}) => {

  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const handleDescriptionUpdate = (id: number, newDescription: string) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, description: newDescription } : item));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const removeLineItem = (id: number) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Client Information */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Facturer à</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nom du client" value={clientInfo.name} onChange={e => handleClientInfoChange('name', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: Acme Inc." />
          <InputField label="Courriel du client" value={clientInfo.email} onChange={e => handleClientInfoChange('email', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: contact@acme.com" type="email" />
          <div className="md:col-span-2">
            <InputField label="Adresse du client" value={clientInfo.address} onChange={e => handleClientInfoChange('address', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: 123 rue de l'Innovation" />
          </div>
        </div>
      </section>

      {/* Invoice Details */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Détails de la facture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Numéro de facture" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} icon={<HashtagIcon className="w-5 h-5" />} />
          <InputField label="Date de la facture" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} icon={<CalendarIcon className="w-5 h-5" />} type="date" />
          <InputField label="Date d'échéance" value={dueDate} onChange={e => setDueDate(e.target.value)} icon={<CalendarIcon className="w-5 h-5" />} type="date" />
        </div>
      </section>

      {/* Line Items */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Articles</h2>
        <div className="space-y-3">
          {lineItems.map(item => (
            <LineItemRow
              key={item.id}
              item={item}
              onChange={handleLineItemChange}
              onRemove={removeLineItem}
              onDescriptionUpdate={handleDescriptionUpdate}
            />
          ))}
        </div>
        <button
          onClick={addLineItem}
          className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Ajouter un article
        </button>
      </section>
    </div>
  );
};

export default InvoiceForm;