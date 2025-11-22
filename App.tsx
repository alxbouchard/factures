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
import InvoicePreviewModal from './components/InvoicePreviewModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import SaveStatusIndicator from './components/SaveStatusIndicator';
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



const MainApp: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('light');

  // Interface mode: 'voice' (default, with big PARLER button) or 'classic' (manual form)
  const [interfaceMode, setInterfaceMode] = useState<'voice' | 'classic'>('voice');

  // Modal state - lifted to App level to persist across re-renders
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

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

  // Force voice mode on initial load
  useEffect(() => {
    setInterfaceMode('voice');
  }, []);

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
      } catch (error: any) {
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
          console.log("Mode hors ligne: Utilisation des données locales ou par défaut.");
        } else {
          console.error("Erreur lors du chargement des données:", error);
        }
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

  // Ref for VoiceFirstLanding to trigger modification
  const voiceLandingRef = useRef<import('./components/VoiceFirstLanding').VoiceFirstLandingRef>(null);

  // Voice Mode: Big PARLER button, AI conversation, invoice creation
  if (interfaceMode === 'voice') {
    return (
      <>
        <VoiceFirstLanding
          ref={voiceLandingRef}
          onManualEntry={() => setInterfaceMode('classic')}
          currentUser={currentUser}
          companyInfo={companyInfo}
          onInvoiceCreated={(invoice) => {
            console.log('📨 App received invoice:', invoice);
            setCreatedInvoice(invoice);
            setShowInvoiceModal(true);
          }}
        />

        {/* Modal rendered at App level - persists across re-renders */}
        {showInvoiceModal && createdInvoice && (
          <InvoicePreviewModal
            invoice={createdInvoice}
            companyInfo={companyInfo}
            onClose={() => setShowInvoiceModal(false)}
            onModify={() => {
              setShowInvoiceModal(false);
              // Trigger modification flow in VoiceFirstLanding
              if (voiceLandingRef.current) {
                voiceLandingRef.current.triggerModification(createdInvoice);
              }
            }}
            onSendEmail={async () => {
              const { shareInvoice } = await import('./services/emailService');
              await shareInvoice(createdInvoice, companyInfo);
              setShowInvoiceModal(false);
            }}
          />
        )}
      </>
    );
  }

  // CLASSIC: Manual form interface

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
                    <button onClick={() => setInterfaceMode('landing')} className="p-1.5 rounded-full text-slate-400 hover:bg-indigo-500 hover:text-white transition-colors" aria-label="Mode Vocal" title="Retour au mode vocal">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5v-1.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v2.25a4.5 4.5 0 0 1-9 0V12Z" />
                      </svg>
                    </button>
                    <button
                      id="btn-mode-auto"
                      onClick={() => setInterfaceMode('landing')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
                    >
                      <span>🎤 Assistant Vocal</span>
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
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

          {/* Floating Voice Mode Button */}
          <button
            onClick={() => setInterfaceMode('landing')}
            className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg shadow-indigo-500/40 hover:scale-110 transition-transform duration-200 group"
            title="Ouvrir l'Assistant Vocal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5v-1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v2.25a4.5 4.5 0 0 1-9 0V12Z" />
            </svg>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Mode Vocal
            </span>
          </button>
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
      <ToastProvider>
        <Layout>
          <MainApp />
        </Layout>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;