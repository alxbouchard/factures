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
        const nextInvoiceNumber = String(Date.now()).slice(-3).padStart(3, '0');

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

        console.log('📄 Created invoice object:', newInvoice);

        // Save to Firestore (non-blocking - don't let errors prevent modal)
        if (currentUser) {
            try {
                const { saveInvoice } = await import('../services/firestore');
                await saveInvoice(currentUser.uid, newInvoice);
                console.log('💾 Invoice saved to Firestore');
            } catch (error) {
                console.warn('⚠️ Failed to save to Firestore (offline?), but continuing...', error);
            }
        }

        // Call parent callback to show modal
        console.log('📤 Calling onInvoiceCreated callback');
        onInvoiceCreated(newInvoice);
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
              relative w-48 h-48 rounded-full 
              ${isRecording
                                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-2xl shadow-red-500/70 animate-pulse'
                                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/50'
                            }
              transform transition-all duration-300
              hover:scale-105
              active:scale-95
    `}
                    >
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${isRecording ? 'bg-red-400' : 'bg-indigo-400'} `}></div>

                        <div className="relative flex flex-col items-center justify-center h-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-white mb-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 7.5v-1.5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v2.25a4.5 4.5 0 0 1-9 0V12Z" />
                            </svg>
                            <p className="text-white text-lg font-bold">
                                {isRecording ? 'ARRÊTER ⏹️' : 'PARLER 🎤'}
                            </p>
                            {isRecording && (
                                <p className="text-white/80 text-xs mt-1">Cliquez pour envoyer</p>
                            )}
                        </div>

                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
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
