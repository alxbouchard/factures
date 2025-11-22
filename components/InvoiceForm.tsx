import React, { useState } from 'react';
import { ClientInfo, LineItem } from '../types';
import LineItemRow from './LineItemRow';
import { UserIcon, CalendarIcon, HashtagIcon, ChevronDownIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

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

const AccordionItem: React.FC<{ title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isOpen, onToggle, children }) => (
  <div className="border border-slate-700 rounded-lg bg-slate-900/50 overflow-hidden mb-4">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
    >
      <span className="font-semibold text-white">{title}</span>
      <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
    </button>
    <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-4 border-t border-slate-700/50">
        {children}
      </div>
    </div>
  </div>
);

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  clientInfo, setClientInfo, invoiceNumber, setInvoiceNumber, invoiceDate, setInvoiceDate, dueDate, setDueDate, lineItems, setLineItems
}) => {
  const { showToast } = useToast();
  const [openSection, setOpenSection] = useState<string | null>('client');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

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
    <div className="space-y-2">
      {/* Client Information */}
      <AccordionItem title="Facturer à" isOpen={openSection === 'client'} onToggle={() => toggleSection('client')}>
        <div className="flex justify-end mb-4">
          <div className="relative">
            <input
              type="file"
              id="scan-client-input"
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  showToast("Analyse du document en cours...", "info");
                  try {
                    const { toBase64 } = await import('../utils/helpers');
                    const { analyzeClientInfo } = await import('../services/geminiService');

                    const base64 = await toBase64(file) as string;
                    const fileData = {
                      mimeType: file.type,
                      data: base64.split(',')[1],
                    };

                    const info = await analyzeClientInfo(fileData);
                    setClientInfo(prev => ({
                      ...prev,
                      name: info.name || prev.name,
                      address: info.address || prev.address,
                      email: info.email || prev.email,
                    }));
                    showToast("Infos client scannées avec succès !", "success");
                  } catch (error) {
                    console.error(error);
                    showToast("Erreur lors du scan.", "error");
                  }
                }
              }}
            />
            <button
              onClick={() => document.getElementById('scan-client-input')?.click()}
              className="text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Scanner une carte
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nom du client" value={clientInfo.name} onChange={e => handleClientInfoChange('name', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: Acme Inc." />
          <InputField label="Courriel du client" value={clientInfo.email} onChange={e => handleClientInfoChange('email', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: contact@acme.com" type="email" />
          <div className="md:col-span-2">
            <InputField label="Adresse du client" value={clientInfo.address} onChange={e => handleClientInfoChange('address', e.target.value)} icon={<UserIcon className="w-5 h-5" />} placeholder="ex: 123 rue de l'Innovation" />
          </div>
        </div>
      </AccordionItem>

      {/* Invoice Details */}
      <AccordionItem title="Détails de la facture" isOpen={openSection === 'details'} onToggle={() => toggleSection('details')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Numéro de facture" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} icon={<HashtagIcon className="w-5 h-5" />} />
          <InputField label="Date de la facture" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} icon={<CalendarIcon className="w-5 h-5" />} type="date" />
          <InputField label="Date d'échéance" value={dueDate} onChange={e => setDueDate(e.target.value)} icon={<CalendarIcon className="w-5 h-5" />} type="date" />
        </div>
      </AccordionItem>

      {/* Line Items */}
      <AccordionItem title="Articles" isOpen={openSection === 'items'} onToggle={() => toggleSection('items')}>
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
      </AccordionItem>
    </div>
  );
};

export default InvoiceForm;