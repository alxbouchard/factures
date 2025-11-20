import React, { useState } from 'react';

interface VoiceFirstLandingProps {
    onStartConversation: () => void;
    onManualEntry: () => void;
}

const VoiceFirstLanding: React.FC<VoiceFirstLandingProps> = ({
    onStartConversation,
    onManualEntry
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
    const [isThinking, setIsThinking] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    // Setup speech recognition
    React.useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-CA';

            recognition.onresult = (event: any) => {
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                setTranscript(currentTranscript);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const handleMicClick = async () => {
        if (!recognitionRef.current) {
            alert("La reconnaissance vocale n'est pas supportée. Essayez Chrome ou Safari.");
            return;
        }

        if (isRecording) {
            // Stop recording and send message
            recognitionRef.current.stop();
      setIs Recording(false);

            // Send the transcript to AI
            if (transcript.trim()) {
                setMessages(prev => [...prev, { role: 'user', text: transcript }]);
                const userMessage = transcript;
                setTranscript('');
                setIsThinking(true);

                // Call real Gemini API
                try {
                    const { startChatAndSendMessage } = await import('../services/geminiService');
                    const response = await startChatAndSendMessage(userMessage);

                    if (response.text) {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            text: response.text
                        }]);
                    } else if (response.functionCalls) {
                        // AI wants to create invoice
                        const call = response.functionCalls[0];
                        if (call.name === 'create_invoice') {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                text: "✅ Parfait! J'ai créé votre facture. Voulez-vous que je l'envoie par email maintenant?"
                            }]);
                            // TODO: Actually create the invoice with call.args
                            console.log('Invoice data:', call.args);
                        }
                    }
                } catch (error) {
                    console.error('Gemini API error:', error);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        text: "😅 Désolé, j'ai eu un problème. Pouvez-vous répéter?"
                    }]);
                } finally {
                    setIsThinking(false);
                }
            }
        } else {
            // Start recording
            try {
                if (recognitionRef.current) {
                    recognitionRef.current.abort();
                }
                setTranscript('');
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error('Error starting recognition:', e);
            }
        }
    };

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
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${isRecording ? 'bg-red-400' : 'bg-indigo-400'}`}></div>

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
                {transcript && (
                    <div className="mb-4 p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-center">
                        <p className="text-indigo-200 italic">"{transcript}"</p>
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
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                                    }`}>
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
