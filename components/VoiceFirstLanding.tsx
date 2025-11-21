import React, { useState } from 'react';
import InvoicePreviewModal from './InvoicePreviewModal';
import { Invoice, CompanyInfo } from '../types';
import { useInvoiceChat } from '../hooks/useInvoiceChat';

interface VoiceFirstLandingProps {
    onStartConversation: () => void;
    onManualEntry: () => void;
    currentUser: any;
    companyInfo: CompanyInfo | null;
}

const VoiceFirstLanding: React.FC<VoiceFirstLandingProps> = ({
    onStartConversation,
    onManualEntry,
    currentUser,
    companyInfo
}) => {
    const [showModal, setShowModal] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

    const handleInvoiceCreated = async (invoiceData: any) => {
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

        // Save to Firestore
        if (currentUser) {
            const { saveInvoice } = await import('../services/firestore');
            await saveInvoice(currentUser.uid, newInvoice);
        }

        // Show the modal
        setCreatedInvoice(newInvoice);
        setShowModal(true);
    };

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

                {/* Alternative option */}
                <div className="text-center flex flex-col gap-4">
                    <button
                        onClick={onStartConversation}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
                    >
                        🤖 Passer en Mode Auto (Conversation)
                    </button>
                    <button
                        onClick={onManualEntry}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        ✏️ Ou saisir manuellement
                    </button>
                </div>
            </div>

            {/* Invoice Preview Modal */}
            {showModal && createdInvoice && (
                <InvoicePreviewModal
                    invoice={createdInvoice}
                    companyInfo={companyInfo}
                    onClose={() => setShowModal(false)}
                    onSendEmail={async () => {
                        if (createdInvoice.clientInfo.email && createdInvoice.clientInfo.email !== 'N/A') {
                            const { sendEmailViaMailto, generateInvoiceEmail } = await import('../services/emailService');
                            const emailData = await generateInvoiceEmail(createdInvoice, companyInfo);
                            await sendEmailViaMailto(emailData);
                            setShowModal(false);
                            // We can't easily add message to hook state from here without exposing setMessages
                            // But the hook adds a success message automatically.
                        } else {
                            alert("Pas d'email client disponible");
                        }
                    }}
                />
            )}
        </div>
    );
};

export default VoiceFirstLanding;
