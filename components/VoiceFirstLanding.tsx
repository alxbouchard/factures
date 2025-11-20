import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from './icons';

interface VoiceFirstLandingProps {
    onStartConversation: () => void;
    onManualEntry: () => void;
}

const VoiceFirstLanding: React.FC<VoiceFirstLandingProps> = ({
    onStartConversation,
    onManualEntry
}) => {
    const [isPulsing, setIsPulsing] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center">
                {/* Logo/Title */}
                <div className="mb-12">
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                        ✨ Facture Magique
                    </h1>
                    <p className="text-2xl text-slate-300">
                        Créez vos factures en parlant
                    </p>
                </div>

                {/* Giant Voice Button */}
                <div className="mb-16">
                    <button
                        onClick={onStartConversation}
                        className={`
              relative w-64 h-64 mx-auto rounded-full 
              bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
              shadow-2xl shadow-indigo-500/50
              transform transition-all duration-300
              hover:scale-105 hover:shadow-indigo-500/70
              active:scale-95
              ${isPulsing ? 'animate-pulse' : ''}
            `}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 blur-xl opacity-50 animate-pulse"></div>

                        {/* Content */}
                        <div className="relative flex flex-col items-center justify-center h-full">
                            <MicrophoneIcon className="w-32 h-32 text-white mb-4" />
                            <p className="text-white text-2xl font-bold">
                                Appuyez pour<br />parler
                            </p>
                        </div>

                        {/* Animated ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                    </button>

                    {/* Prompt text */}
                    <div className="mt-8">
                        <p className="text-xl text-slate-300 italic">
                            "Dites-moi pour qui est cette facture..."
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Ou décrivez votre service et je m'occupe du reste ✨
                        </p>
                    </div>
                </div>

                {/* Alternative Options */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4 text-slate-400">
                        <div className="h-px flex-1 bg-slate-700"></div>
                        <span className="text-sm">ou</span>
                        <div className="h-px flex-1 bg-slate-700"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={onManualEntry}
                            className="
                bg-slate-800 hover:bg-slate-700 
                border border-slate-700 hover:border-indigo-500
                rounded-xl p-6 
                transition-all duration-200
                group
              "
                        >
                            <div className="text-4xl mb-2">✏️</div>
                            <p className="text-white font-medium mb-1">Saisir manuellement</p>
                            <p className="text-sm text-slate-400">Mode formulaire classique</p>
                        </button>

                        <button
                            className="
                bg-slate-800 hover:bg-slate-700 
                border border-slate-700 hover:border-purple-500
                rounded-xl p-6 
                transition-all duration-200
                group
                opacity-50 cursor-not-allowed
              "
                            disabled
                        >
                            <div className="text-4xl mb-2">📸</div>
                            <p className="text-white font-medium mb-1">Scanner une facture</p>
                            <p className="text-sm text-slate-400">Bientôt disponible</p>
                        </button>
                    </div>
                </div>

                {/* Quick stats or tips */}
                <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                    <div className="text-slate-400">
                        <div className="text-3xl mb-2">⚡</div>
                        <p className="text-sm">30 secondes</p>
                        <p className="text-xs text-slate-600">En moyenne</p>
                    </div>
                    <div className="text-slate-400">
                        <div className="text-3xl mb-2">💬</div>
                        <p className="text-sm">Conversation</p>
                        <p className="text-xs text-slate-600">Naturelle</p>
                    </div>
                    <div className="text-slate-400">
                        <div className="text-3xl mb-2">📧</div>
                        <p className="text-sm">Envoi auto</p>
                        <p className="text-xs text-slate-600">En 1 clic</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceFirstLanding;
