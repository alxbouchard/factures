import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, MicrophoneIcon } from './icons';
import { startChatAndSendMessage } from '../services/geminiService';

interface ConversationalChatProps {
    onCreateInvoice: (invoiceData: any) => void;
    onExit: () => void;
    autoStartVoice?: boolean;
}

const ConversationalChat: React.FC<ConversationalChatProps> = ({
    onCreateInvoice,
    onExit,
    autoStartVoice = false
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showWaveform, setShowWaveform] = useState(false);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'initial',
                role: 'model',
                text: "👋 Bonjour! Je suis votre assistant de facturation magique.\n\nDites-moi simplement:\n• Pour qui est cette facture?\n• Quel service avez-vous rendu?\n• Combien voulez-vous charger?\n\nEt je m'occupe du reste! ✨"
            }]);

            // Disabled auto-start to prevent race condition - user will click mic
            // if (autoStartVoice) {
            //   setTimeout(() => {
            //     handleMicClick();
            //   }, 1000);
            // }
        }
    }, [messages]);

    // Speech Recognition Setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'fr-CA';

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                setInputValue(transcript);
                setShowWaveform(true);
            };

            recognition.onend = () => {
                setIsRecording(false);
                setShowWaveform(false);
                // Auto-send if we have content
                if (inputValue.trim()) {
                    handleSendMessage(new Event('submit') as any);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                setShowWaveform(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [inputValue]);

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            alert("La reconnaissance vocale n'est pas supportée par ce navigateur. Essayez Safari ou Chrome.");
            return;
        }

        if (isRecording) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
            setIsRecording(false);
            setShowWaveform(false);
        } else {
            try {
                // Make sure it's not already running
                if (recognitionRef.current) {
                    recognitionRef.current.abort(); // Abort any ongoing recognition
                }
                recognitionRef.current.start();
                setIsRecording(true);
                setShowWaveform(true);
            } catch (e) {
                console.error('Error starting recognition:', e);
                setIsRecording(false);
                setShowWaveform(false);
            }
        }
    };

    const handleSendMessage = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        }
        const userMessage = inputValue.trim();
        if (!userMessage) return;

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await startChatAndSendMessage(userMessage);

            if (response.functionCalls) {
                const call = response.functionCalls[0];
                if (call.name === 'create_invoice') {
                    onCreateInvoice(call.args);
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'model',
                        text: "✅ Parfait! J'ai créé votre facture.\n\nVoulez-vous:\n• L'envoyer par email maintenant? 📧\n• La modifier? ✏️\n• Créer une autre facture? ➕"
                    }]);
                }
            } else if (response.text) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "😅 Désolé, je n'ai pas bien compris. Pouvez-vous reformuler?"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-xl">💬</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold">Assistant Facture</h2>
                        <p className="text-sm text-slate-400">Parlez naturellement...</p>
                    </div>
                </div>
                <button
                    onClick={onExit}
                    className="text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
                >
                    Fermer ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <span className="font-bold text-white text-xl">✨</span>
                            </div>
                        )}

                        <div className={`
              max-w-2xl p-6 rounded-2xl shadow-lg
              ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                            }
            `}>
                            <p className="whitespace-pre-line text-lg leading-relaxed">{msg.text}</p>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <span className="font-bold text-white text-xl">👤</span>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white text-xl">✨</span>
                        </div>
                        <div className="max-w-2xl p-6 rounded-2xl bg-slate-800 border border-slate-700 rounded-bl-none">
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-slate-900/50 backdrop-blur-lg border-t border-slate-700 p-6">
                {showWaveform && isRecording && (
                    <div className="mb-4 flex items-center justify-center gap-1 h-12">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={handleMicClick}
                        className={`
              absolute left-4 top-1/2 -translate-y-1/2 z-10
              w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isRecording
                                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-500 hover:scale-105'
                            }
            `}
                    >
                        <MicrophoneIcon className="w-7 h-7 text-white" />
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isRecording ? "🎤 En écoute..." : "Tapez votre message ou utilisez le micro..."}
                        className="
              w-full bg-slate-800 border-2 border-slate-700 
              focus:border-indigo-500 focus:outline-none
              rounded-full py-5 pl-24 pr-20 
              text-white text-lg
              placeholder-slate-500
              transition-all duration-200
            "
                    />

                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className={`
              absolute right-4 top-1/2 -translate-y-1/2
              w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-200
              ${inputValue.trim() && !isLoading
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 hover:scale-105 shadow-lg shadow-indigo-500/50'
                                : 'bg-slate-700 cursor-not-allowed'
                            }
            `}
                    >
                        <SendIcon className="w-6 h-6 text-white" />
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-4">
                    💡 Astuce: Parlez naturellement, je comprends le français québécois!
                </p>
            </div>
        </div>
    );
};

export default ConversationalChat;
