import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { startChatAndSendMessage } from '../services/geminiService';

interface UseInvoiceChatProps {
    onCreateInvoice: (invoiceData: any) => void;
    onInvoiceCreated?: (invoice: any) => void; // Optional callback for specific UI actions
}

export const useInvoiceChat = ({ onCreateInvoice, onInvoiceCreated }: UseInvoiceChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showWaveform, setShowWaveform] = useState(false);

    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const prevIsRecording = useRef(false);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Enable continuous recording
            recognition.interimResults = true;
            recognition.lang = 'fr-CA';

            recognition.onresult = (event: any) => {
                // Clear existing timer on new input
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }

                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                setInputValue(transcript);
                setShowWaveform(true);

                // Set new timer to stop after 3 seconds of silence
                silenceTimerRef.current = setTimeout(() => {
                    recognition.stop();
                }, 3000);
            };

            recognition.onend = () => {
                setIsRecording(false);
                setShowWaveform(false);
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
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
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, []);

    const handleMicClick = useCallback(() => {
        if (!recognitionRef.current) {
            alert("La reconnaissance vocale n'est pas supportée. Essayez Chrome ou Safari.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            // isRecording will be set to false in onend
        } else {
            try {
                if (recognitionRef.current) recognitionRef.current.abort();
                setInputValue(''); // Clear previous input
                recognitionRef.current.start();
                setIsRecording(true);
                setShowWaveform(true);
            } catch (e) {
                console.error("Error starting recognition", e);
            }
        }
    }, [isRecording]);

    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (isRecording) {
            recognitionRef.current?.stop();
            // Let onend handle the state update, but we continue to send
            setIsRecording(false);
        }

        const userMessage = inputValue.trim();
        if (!userMessage) return;

        // Add user message
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await startChatAndSendMessage(userMessage);

            if (response.functionCalls) {
                const call = response.functionCalls[0];
                if (call.name === 'create_invoice') {
                    const invoiceData = call.args;
                    console.log("🤖 AI called create_invoice with:", invoiceData);

                    try {
                        onCreateInvoice(invoiceData);

                        const successMsg = "✅ Parfait! J'ai créé votre facture.";
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'model',
                            text: successMsg
                        }]);

                        if (onInvoiceCreated) {
                            onInvoiceCreated(invoiceData);
                        }
                    } catch (err) {
                        console.error("❌ Error in onCreateInvoice callback:", err);
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'model',
                            text: "⚠️ J'ai compris les détails, mais une erreur technique m'a empêché de créer la facture."
                        }]);
                    }
                }
            } else if (response.text) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "😅 Désolé, j'ai eu un petit problème technique. Pouvez-vous répéter?"
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isRecording, onCreateInvoice, onInvoiceCreated]);

    // Auto-send when recording stops (either manually or via silence timeout)
    useEffect(() => {
        if (prevIsRecording.current && !isRecording) {
            // Recording just stopped
            if (inputValue.trim()) {
                handleSendMessage();
            }
        }
        prevIsRecording.current = isRecording;
    }, [isRecording, inputValue, handleSendMessage]);

    return {
        messages,
        setMessages,
        inputValue,
        setInputValue,
        isLoading,
        isRecording,
        showWaveform,
        handleMicClick,
        handleSendMessage
    };
};
