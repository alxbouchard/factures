import React, { useCallback, forwardRef, useImperativeHandle } from 'react';
import { Invoice, CompanyInfo } from '../types';
import { useInvoiceChat } from '../hooks/useInvoiceChat';

export interface VoiceFirstLandingRef {
    triggerModification: (invoice: Invoice) => void;
}

interface VoiceFirstLandingProps {
    onManualEntry: () => void;
    onInvoiceCreated: (invoice: Invoice) => void;
    currentUser: any;
    companyInfo: CompanyInfo | null;
}

const VoiceFirstLanding = forwardRef<VoiceFirstLandingRef, VoiceFirstLandingProps>(({
    onManualEntry,
    onInvoiceCreated,
    currentUser,
    companyInfo
}, ref) => {
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
        setMessages,
        inputValue,
        isLoading: isThinking,
        isRecording,
        handleMicClick,
        handleSendMessage
    } = useInvoiceChat({
        onCreateInvoice: () => { }, // We handle it in onInvoiceCreated
        onInvoiceCreated: handleInvoiceCreated
    });

    useImperativeHandle(ref, () => ({
        triggerModification: (invoice: Invoice) => {
            console.log("🔄 Triggering modification for invoice:", invoice.id);

            // 1. Add system message showing the current invoice context
            const contextMsg = {
                id: Date.now().toString(),
                role: 'model' as const,
                text: `Je suis prêt à modifier la facture #${invoice.invoiceNumber} pour ${invoice.clientInfo.name}. Dites-moi ce que vous voulez changer (ex: "Change le prix à 500$").`
            };
            setMessages(prev => [...prev, contextMsg]);

            // 2. Inject the invoice context into the chat history (hidden or system prompt)
            // Ideally, we should send this to the LLM so it knows the context.
            // For now, we'll rely on the user's next message + the fact that we can re-send the context if needed.
            // A better approach is to send a hidden message to the LLM with the JSON.

            // We can simulate a user message that sets the context, but hide it? 
            // Or just append it to the history that is sent to the API.
            // Since our `useInvoiceChat` manages state, we can just add a message.

            // Let's add a hidden system message with the JSON context
            const jsonContext = JSON.stringify(invoice);
            // We don't have a "system" role in our UI types usually, but we can add a user message that says:
            // "Voici la facture actuelle : [JSON]. Je veux la modifier."
            // And we can visually hide it or show it as "Contexte chargé".

            // For simplicity/transparency, let's just let the user know we have the context.
            // The actual "memory" depends on how `startChatAndSendMessage` works. 
            // It uses `chatSession` which keeps history. 
            // So we need to send this context to the session.

            // We can call `handleSendMessage` programmatically with the context?
            // But we don't want to show that big JSON to the user.

            // Hack: We will just rely on the user saying "Change le prix". 
            // BUT the AI doesn't know the current price unless we tell it.
            // So we MUST send the JSON.

            // Let's send a hidden message to the backend.
            // We need to expose a way to send message without adding to UI, OR add to UI and hide it.
            // For now, let's just add it to UI but maybe formatted nicely? 
            // Or just trust the user will provide details? No, user said "The AI must have access to DB and keep context".

            // We will send a message to the AI with the invoice details.
            // We can use `startChatAndSendMessage` directly if we import it, but we want to keep state in sync.
            // Let's use `handleSendMessage` but we need to bypass the UI update if possible?
            // No, `handleSendMessage` takes input from state.

            // Let's just append to messages and assume the user is okay seeing "Context loaded".
            // Actually, we can just send it to the AI and NOT add it to the `messages` state if we modify `useInvoiceChat`.
            // But `useInvoiceChat` is simple.

            // Let's just add a message "Je charge le contexte de la facture..." and then send the JSON in the background.
            import('../services/geminiService').then(async ({ startChatAndSendMessage }) => {
                await startChatAndSendMessage(`Voici le contexte de la facture actuelle (JSON): ${JSON.stringify(invoice)}. L'utilisateur va demander des modifications. Attends ses instructions.`);
            });
        }
    }));

    // Use the last user message as the "transcript" for display if needed, 
    // but better to show the conversation history or just the input value.
    // The original design showed "transcript" in a box.
    // We can use inputValue for that.

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center p-8">
            <div className="max-w-2xl w-full h-full flex flex-col">
                {/* Logo/Title */}
                <div className="mb-8 text-center flex-shrink-0">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text transparent mb-2">
                        ✨ Facture Magique
                    </h1>
                    <p className="text-lg text-slate-300">
                        Créez vos factures en parlant
                    </p>
                </div>

                <div className="w-full max-w-2xl mx-auto px-4 h-full flex flex-col">
                    {/* Chat Messages Area - Scrollable at top */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                        {/* Live transcript */}
                        {inputValue && (
                            <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-center">
                                <p className="text-indigo-200 italic">"{inputValue}"</p>
                            </div>
                        )}

                        {/* Conversation */}
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

                    {/* Giant Voice Button - Fixed at bottom */}
                    <div className="flex-shrink-0 pb-4">
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleMicClick}
                                className={`
              relative w-48 h-48 sm:w-56 sm:h-56 rounded-full 
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
                                    <img
                                        src="/ai_assistant_icon_transparent.png"
                                        alt="AI Assistant"
                                        className="w-20 h-20 sm:w-28 sm:h-28 mb-2 object-contain transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <p className="text-white text-lg sm:text-xl font-bold tracking-wide drop-shadow-md text-center leading-tight">
                                        {isRecording ? 'ARRÊTER' : 'Cliquez pour\nParler'}
                                    </p>
                                    {isRecording && (
                                        <p className="text-white/90 text-sm mt-2 font-medium animate-bounce">Cliquez pour envoyer</p>
                                    )}
                                </div>

                                {/* Ring Animation */}
                                <div className={`absolute inset-0 rounded-full border-2 border-white/20 ${isRecording ? 'animate-ping' : 'scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700'}`}></div>
                            </button>
                        </div>

                        {/* Manual entry option */}
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
            </div>
        </div>
    );
});

VoiceFirstLanding.displayName = 'VoiceFirstLanding';

export default VoiceFirstLanding;
