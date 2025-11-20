import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CompanyInfo, Invoice, ThemeColor } from './types';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import CompanySettings from './components/CompanySettings';
import { SettingsIcon, SunIcon, MoonIcon } from './components/icons';
import ActionToolbar from './components/ActionToolbar';
import InvoiceList from './components/InvoiceList';
import ChatWidget from './components/ChatWidget';
import VoiceFirstLanding from './components/VoiceFirstLanding';
import ConversationalChat from './components/ConversationalChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import { getCompanyInfo, getInvoices, saveCompanyInfo, saveInvoice, deleteInvoice } from './services/firestore';

const createNewInvoice = (invoiceNumber: string): Invoice => ({
  id: `inv_${Date.now()}`,
  invoiceNumber,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  clientInfo: {
    name: 'Nom du Client',
    address: '123 Rue du Client, Ville, Pays',
    email: 'client@example.com',
  },
  lineItems: [{ id: 1, description: 'Service ou Produit', quantity: 1, price: 100 }],
});

const SaveStatusIndicator: React.FC<{ status: 'sauvegardé' | 'enregistrement' | 'non sauvegardé' }> = ({ status }) => {
  if (status === 'enregistrement') {
    return (
      <div className="flex items-center gap-2 text-indigo-400">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Enregistrement...</span>
      </div>
    );
  }
  if (status === 'sauvegardé') {
    return (
      <div className="flex items-center gap-2 text-green-400/80">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span>Sauvegardé</span>
      </div>
    );
  }
  if (status === 'non sauvegardé') {
    return (
      <div className="flex items-center gap-2 text-amber-400/80">
        <div className="w-3 h-3 rounded-full bg-amber-400/80 animate-pulse"></div>
        <span>Modifications non sauvegardées</span>
      </div>
    );
  }
  return null;
};

const MainApp: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('light');

  // NEW: Interface mode state
  const [interfaceMode, setInterfaceMode] = useState<'landing' | 'conversation' | 'classic'>('landing');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'sauvegardé' | 'enregistrement' | 'non sauvegardé'>('sauvegardé');
  const invoicesRef = useRef<Invoice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  // Memoize the current invoice to avoid re-calculating on every render
  const currentInvoice = React.useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  // Load initial data from Firestore IN BACKGROUND (non-blocking)
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      // Don't block UI - show interface immediately
      setIsLoadingData(false);

      try {
        const savedCompanyInfo = await getCompanyInfo(currentUser.uid);
        if (savedCompanyInfo) {
          setCompanyInfo(savedCompanyInfo);
        }

        const savedInvoices = await getInvoices(currentUser.uid);
        if (savedInvoices.length > 0) {
          setInvoices(savedInvoices);
          setSelectedInvoiceId(savedInvoices[0].id);
        } else {
          const newInvoice = createNewInvoice('001');
          setInvoices([newInvoice]);
          setSelectedInvoiceId(newInvoice.id);
        }
      } catch (error) {
        console.error("Failed to load data from Firestore", error);
        // Create default data if loading fails
        const newInvoice = createNewInvoice('001');
        setInvoices([newInvoice]);
        setSelectedInvoiceId(newInvoice.id);
      }
    };

    loadData();
  }, [currentUser]);

  // Auto-save logic
  useEffect(() => {
    if (!currentUser) return;

    const saveDrafts = async () => {
      if (saveStatus === 'non sauvegardé' && invoicesRef.current.length > 0) {
        setSaveStatus('enregistrement');
        try {
          // Save all modified invoices? Or just the current one?
          // For simplicity, let's save all, or we need to track dirty ones.
          // Given the structure, we might just save the current one if we knew which one it was.
          // But here we iterate. To be safe and simple, we save all.
          // Optimization: In a real app, track dirty IDs.
          // Here, let's just save everything for now, or maybe just the selected one?
          // The user might have switched invoices.
          // Let's save all for safety, Firestore writes are cheap enough for this scale.
          await Promise.all(invoicesRef.current.map(inv => saveInvoice(currentUser.uid, inv)));
          setSaveStatus('sauvegardé');
        } catch (e) {
          console.error("Error saving invoices", e);
          setSaveStatus('non sauvegardé'); // Retry next time
        }
      }
    };

    const interval = setInterval(saveDrafts, 5000); // Check every 5 seconds instead of 30 for better UX

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, saveStatus]);


  const handleCompanyInfoSave = useCallback(async (info: CompanyInfo) => {
    setCompanyInfo(info);
    if (currentUser) {
      await saveCompanyInfo(currentUser.uid, info);
    }
    setIsSettingsOpen(false);
  }, [currentUser]);

  const updateCurrentInvoice = (updatedData: Partial<Invoice>) => {
    if (!selectedInvoiceId) return;
    setSaveStatus('non sauvegardé');
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === selectedInvoiceId ? { ...inv, ...updatedData } : inv
      )
    );
  };

  const handleNewInvoice = async () => {
    if (!currentUser) return;
    setSaveStatus('non sauvegardé');
    const nextInvoiceNumber = (invoices.length > 0)
      ? String(Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber, 10))) + 1).padStart(3, '0')
      : '001';
    const newInvoice = createNewInvoice(nextInvoiceNumber);
    setInvoices(prev => [...prev, newInvoice]);
    setSelectedInvoiceId(newInvoice.id);
    // Save immediately to ensure it exists
    await saveInvoice(currentUser.uid, newInvoice);
  };

  const handleDeleteInvoice = async (idToDelete: string) => {
    if (!currentUser) return;
    if (invoices.length <= 1) {
      alert("Vous ne pouvez pas supprimer la dernière facture.");
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      setSaveStatus('non sauvegardé');
      try {
        await deleteInvoice(currentUser.uid, idToDelete);
        setInvoices(prev => prev.filter(inv => inv.id !== idToDelete));
        if (selectedInvoiceId === idToDelete) {
          const remainingInvoices = invoices.filter(inv => inv.id !== idToDelete);
          setSelectedInvoiceId(remainingInvoices.length > 0 ? remainingInvoices[0].id : null);
        }
        setSaveStatus('sauvegardé');
      } catch (e) {
        console.error("Error deleting invoice", e);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleCreateInvoiceFromChat = (invoiceData: any) => {
    setSaveStatus('non sauvegardé');
    const nextInvoiceNumber = (invoices.length > 0)
      ? String(Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber, 10))) + 1).padStart(3, '0')
      : '001';

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: nextInvoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || '',
      clientInfo: {
        name: invoiceData.clientName || 'N/A',
        address: invoiceData.clientAddress || 'N/A',
        email: invoiceData.clientEmail || 'N/A',
      },
      lineItems: invoiceData.lineItems.map((item: any, index: number) => ({
        id: Date.now() + index,
        description: item.description || 'Article',
        quantity: item.quantity || 1,
        price: item.price || 0,
      })),
    };

    setInvoices(prev => [...prev, newInvoice]);
    setSelectedInvoiceId(newInvoice.id);
  };


  const subtotal = currentInvoice?.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0) ?? 0;
  const GST_RATE = 0.05; // 5%
  const QST_RATE = 0.09975; // 9.975%
  const gstAmount = subtotal * GST_RATE;
  const qstAmount = subtotal * QST_RATE;
  const total = subtotal + gstAmount + qstAmount;

  if (!currentUser) {
    return <LoginModal />;
  }

  // SKIP loading screen - go straight to interface
  // Load data in background while user sees the UI

  // NEW: Voice-First Landing Screen
  if (interfaceMode === 'landing') {
    return (
      <VoiceFirstLanding
        onStartConversation={() => setInterfaceMode('conversation')}
        onManualEntry={() => setInterfaceMode('classic')}
        currentUser={currentUser}
        companyInfo={companyInfo}
      />
    );
  }

  // NEW: Conversational Chat Interface
  if (interfaceMode === 'conversation') {
    return (
      <ConversationalChat
        onCreateInvoice={handleCreateInvoiceFromChat}
        onExit={() => setInterfaceMode('classic')}
        autoStartVoice={true}
      />
    );
  }

  // CLASSIC: Original Interface (with improvements)

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 flex flex-col lg:flex-row antialiased">
      <CompanySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleCompanyInfoSave}
        initialInfo={companyInfo}
      />

      <InvoiceList
        invoices={invoices}
        selectedInvoiceId={selectedInvoiceId}
        onSelectInvoice={setSelectedInvoiceId}
        onNewInvoice={handleNewInvoice}
        onDeleteInvoice={handleDeleteInvoice}
      />

      {currentInvoice ? (
        <>
          {/* Form Panel */}
          <main className="flex-grow flex flex-col lg:flex-row-reverse">
            {/* Preview Panel */}
            <div className="w-full lg:w-1/2 bg-slate-950/50 p-6 lg:p-10 flex flex-col">
              <ActionToolbar
                clientInfo={currentInvoice.clientInfo}
                invoiceNumber={currentInvoice.invoiceNumber}
                dueDate={currentInvoice.dueDate}
                total={total}
              />
              <div className="flex-grow flex items-center justify-center lg:mt-0 mt-8">
                <div className="w-full max-w-2xl aspect-[1/1.414] scale-[0.9] lg:scale-100 origin-center">
                  <InvoicePreview
                    companyInfo={companyInfo}
                    clientInfo={currentInvoice.clientInfo}
                    invoiceNumber={currentInvoice.invoiceNumber}
                    invoiceDate={currentInvoice.invoiceDate}
                    dueDate={currentInvoice.dueDate}
                    lineItems={currentInvoice.lineItems}
                    subtotal={subtotal}
                    gstAmount={gstAmount}
                    qstAmount={qstAmount}
                    total={total}
                    themeColor={themeColor}
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col">
              <header className="flex justify-between items-center mb-8 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-white">Facture 2025</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm transition-all duration-300">
                    <SaveStatusIndicator status={saveStatus} />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-full">
                    <button onClick={() => setThemeColor('light')} className={`p-1.5 rounded-full transition-colors ${themeColor === 'light' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Thème clair">
                      <SunIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setThemeColor('dark')} className={`p-1.5 rounded-full transition-colors ${themeColor === 'dark' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Thème sombre">
                      <MoonIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    aria-label="Paramètres de l'entreprise"
                  >
                    <SettingsIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    aria-label="Déconnexion"
                    title="Se déconnecter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>
              </header>

              <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                <InvoiceForm
                  key={currentInvoice.id} // Re-mount form on invoice change
                  clientInfo={currentInvoice.clientInfo}
                  setClientInfo={(newInfo) => updateCurrentInvoice({ clientInfo: typeof newInfo === 'function' ? newInfo(currentInvoice.clientInfo) : newInfo })}
                  invoiceNumber={currentInvoice.invoiceNumber}
                  setInvoiceNumber={(newNum) => updateCurrentInvoice({ invoiceNumber: newNum })}
                  invoiceDate={currentInvoice.invoiceDate}
                  setInvoiceDate={(newDate) => updateCurrentInvoice({ invoiceDate: newDate })}
                  dueDate={currentInvoice.dueDate}
                  setDueDate={(newDate) => updateCurrentInvoice({ dueDate: newDate })}
                  lineItems={currentInvoice.lineItems}
                  setLineItems={(newItems) => updateCurrentInvoice({ lineItems: typeof newItems === 'function' ? newItems(currentInvoice.lineItems) : newItems })}
                />
              </div>

              <div className="mt-auto pt-6 flex-shrink-0">
                <ChatWidget onCreateInvoice={handleCreateInvoiceFromChat} />
              </div>
            </div>
          </main>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-slate-500">Aucune facture sélectionnée</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;