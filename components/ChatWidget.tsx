import React, { useRef, useEffect } from 'react';
import { SendIcon, MicrophoneIcon } from './icons';
import { useInvoiceChat } from '../hooks/useInvoiceChat';

interface ChatWidgetProps {
  onCreateInvoice: (invoiceData: any) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onCreateInvoice }) => {
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    isRecording,
    handleMicClick,
    handleSendMessage
  } = useInvoiceChat({ onCreateInvoice });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'initial',
        role: 'model',
        text: "Je suis un assistant de facturation. Je peux vous aider à créer des factures. Pourriez-vous me donner les détails de la facture ?"
      }]);
    }
  }, [messages, setMessages]);

  return (
    <div className="bg-slate-800 rounded-xl p-4 transition-all duration-300 border border-slate-700">
      <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 self-start">
                <span className="font-bold text-white text-lg">C</span>
              </div>
            )}
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700/50 text-slate-100 rounded-bl-none'}`}>
              {msg.role === 'model' && msg.id === 'initial' && <p className="font-bold mb-1 text-indigo-300">Assistant IA</p>}
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 self-start">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <div className="max-w-[85%] p-3 rounded-2xl bg-slate-700/50 text-slate-200 rounded-bl-none">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 relative">
        <button
          type="button"
          onClick={handleMicClick}
          className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-indigo-400 transition-colors"
          aria-label="Utiliser le microphone"
        >
          <MicrophoneIcon className={`w-5 h-5 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isRecording ? 'En écoute...' : 'Décrivez votre facture...'}
          className="w-full bg-slate-900 border border-slate-600 rounded-full py-3 pl-12 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
          disabled={!inputValue || isLoading}
          aria-label="Envoyer le message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
      <style>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 20px;
          border: 3px solid transparent;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;