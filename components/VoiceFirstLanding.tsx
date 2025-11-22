import React, { useCallback } from 'react';
import { Invoice, CompanyInfo } from '../types';
import { useInvoiceChat } from '../hooks/useInvoiceChat';

interface VoiceFirstLandingProps {
    onManualEntry: () => void;
    onInvoiceCreated: (invoice: Invoice) => void;
    currentUser: any;
    companyInfo: CompanyInfo | null;
}

const VoiceFirstLanding: React.FC<VoiceFirstLandingProps> = ({
    onManualEntry,
    onInvoiceCreated,
    currentUser,
    companyInfo
}) => {
    // Remove local modal state - now managed by App.tsx

    const handleInvoiceCreated = useCallback(async (invoiceData: any) => {
        console.log('🎯 handleInvoiceCreated called with:', invoiceData);
        try {
            const nextInvoiceNumber = String(Date.now()).slice(-3).padStart(3, '0');

            // Ensure lineItems is an array
            const lineItems = Array.isArray(invoiceData.lineItems) ? invoiceData.lineItems : [];
            if (lineItems.length === 0) {
                console.warn('⚠️ No line items found in invoice data, adding default.');
                lineItems.push({ description: 'Service', quantity: 1, price: 0 });
            }

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
                lineItems: lineItems.map((item: any, index: number) => ({
                    id: Date.now() + index,
                    description: item.description || 'Article',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                })),
            };

            console.log('📄 Created invoice object:', newInvoice);

            // 1. SHOW MODAL IMMEDIATELY (Optimistic UI)
            console.log('📤 Calling onInvoiceCreated callback');
            onInvoiceCreated(newInvoice);

            // 2. SAVE TO FIRESTORE IN BACKGROUND
            if (currentUser) {
                // Do not await this - let it run in background
                import('../services/firestore').then(async ({ saveInvoice }) => {
                    try {
                        await saveInvoice(currentUser.uid, newInvoice);
                        console.log('💾 Invoice saved to Firestore');
                    } catch (error) {
                        console.warn('⚠️ Failed to save to Firestore (offline?), but continuing...', error);
                    }
                }).catch(err => console.error("Failed to import firestore service", err));
            }

        } catch (error) {
            console.error("❌ Error creating invoice:", error);
            alert("Une erreur est survenue lors de la création de la facture. Veuillez réessayer.");
        }
    }, [currentUser, onInvoiceCreated]);

    const {
        messages,
        inputValue,
        isLoading: isThinking,
        isRecording,
        handleMicClick,
        handleSendMessage
    } = useInvoiceChat({
        onCreateInvoice: () => { }, // We handle it in onInvoiceCreated
        onInvoiceCreated: handleInvoiceCreated
    });

    // Use the last user message as the "transcript" for display if needed, 
    // but better to show the conversation history or just the input value.
    // The original design showed "transcript" in a box.
    // We can use inputValue for that.

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center p-8">
            <div className="max-w-2xl w-full">
                {/* Logo/Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        ✨ Facture Magique
                    </h1>
                    <p className="text-lg text-slate-300">
                        Créez vos factures en parlant
                    </p>
                </div>

                {/* Giant Voice Button */}
                <div className="mb-8 flex justify-center">
                    <button
                        onClick={handleMicClick}
                        className={`
              relative w-48 h-48 sm:w-64 sm:h-64 rounded-full 
              ${isRecording
                                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-[0_0_60px_-15px_rgba(239,68,68,0.6)] animate-pulse'
                                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_60px_-15px_rgba(99,102,241,0.5)]'
                            }
              transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
              hover:scale-105 hover:shadow-[0_0_80px_-10px_rgba(99,102,241,0.6)]
              active:scale-95
              group
    `}
                    >
                        {/* Inner Glow */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500 ${isRecording ? 'bg-red-400' : 'bg-white'} group-hover:opacity-60`}></div>

                        <div className="relative flex flex-col items-center justify-center h-full z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 sm:w-28 sm:h-28 text-white mb-3 drop-shadow-lg transition-transform duration-500 group-hover:scale-110">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5v-1.5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v2.25a4.5 4.5 0 0 1-9 0V12Z" />
                            </svg>
                            <p className="text-white text-xl sm:text-2xl font-bold tracking-wide drop-shadow-md">
                                {isRecording ? 'ARRÊTER' : 'PARLER'}
                            </p>
                            {isRecording && (
                                <p className="text-white/90 text-sm mt-2 font-medium animate-bounce">Cliquez pour envoyer</p>
                            )}
                        </div>

                        {/* Ring Animation */}
                        <div className={`absolute inset-0 rounded-full border-2 border-white/20 ${isRecording ? 'animate-ping' : 'scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700'}`}></div>
                    </button>


                </div>

                {/* Live transcript */}
                {inputValue && (
                    <div className="mb-4 p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-center">
                        <p className="text-indigo-200 italic">"{inputValue}"</p>
                    </div>
                )}

                {/* Conversation */}
                <div className="space-y-4 mb-8">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                            <p className="text-xl mb-2">👋 Bonjour!</p>
                            <p>Appuyez sur le bouton et dites-moi:</p>
                            <p className="text-sm mt-2">"Facture pour Jean Dupont, plomberie, 500$"</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} `}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                                    } `}>
                                    <p className="text-lg">{msg.text}</p>
                                </div>
                            </div>
                        ))
                    )}

                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-bl-none">
                                <div className="flex gap-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 rounded-full bg-pink-400 animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual entry option - always visible now */}
                <div className="text-center">
                    <button
                        onClick={onManualEntry}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        ✏️ Ou saisir manuellement
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceFirstLanding;
