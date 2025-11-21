import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface EmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientEmail: string;
    subject: string;
    body: string;
    onSend: (subject: string, body: string) => void;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
    isOpen,
    onClose,
    recipientEmail,
    subject: initialSubject,
    body: initialBody,
    onSend,
}) => {
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        setSubject(initialSubject);
        setBody(initialBody);
    }, [initialSubject, initialBody]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${subject}\n\n${body}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        Prévisualisation de l'email
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">À</label>
                        <input
                            type="text"
                            value={recipientEmail}
                            disabled
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Objet</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={8}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center">
                    <button
                        onClick={handleCopy}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        {copySuccess ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                Copié !
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                </svg>
                                Copier le texte
                            </>
                        )}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => onSend(subject, body)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            Envoyer l'email
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPreviewModal;
