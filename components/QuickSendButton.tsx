import React from 'react';

interface QuickSendButtonProps {
    invoice: any;
    companyInfo: any;
    onSend: () => void;
    disabled?: boolean;
}

const QuickSendButton: React.FC<QuickSendButtonProps> = ({
    invoice,
    companyInfo,
    onSend,
    disabled = false
}) => {
    const clientEmail = invoice?.clientInfo?.email || '';
    const hasEmail = clientEmail && clientEmail.includes('@');

    return (
        <button
            onClick={onSend}
            disabled={disabled || !hasEmail}
            className={`
        relative group
        w-full py-6 px-8 
        rounded-2xl
        font-bold text-lg
        transition-all duration-300
        ${hasEmail && !disabled
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 active:scale-95'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }
      `}
        >
            {/* Glow effect */}
            {hasEmail && !disabled && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-teal-400 opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
            )}

            {/* Content */}
            <div className="relative flex items-center justify-center gap-3">
                <span className="text-3xl">📧</span>
                <div className="text-left">
                    <div className="text-xl">ENVOYER MAINTENANT</div>
                    <div className="text-sm opacity-80 font-normal">
                        {hasEmail ? clientEmail : 'Aucun email client'}
                    </div>
                </div>
            </div>

            {/* Animated border */}
            {hasEmail && !disabled && (
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors"></div>
            )}
        </button>
    );
};

export default QuickSendButton;
