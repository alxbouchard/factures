import React from 'react';

interface SaveStatusIndicatorProps {
    status: 'sauvegardé' | 'enregistrement' | 'non sauvegardé';
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
    if (status === 'enregistrement') {
        return (
            <div className="flex items-center gap-2 text-indigo-400">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Enregistrement...</span>
            </div>
        );
    }
    if (status === 'sauvegardé') {
        return (
            <div className="flex items-center gap-2 text-green-400/80">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Sauvegardé</span>
            </div>
        );
    }
    if (status === 'non sauvegardé') {
        return (
            <div className="flex items-center gap-2 text-amber-400/80">
                <div className="w-3 h-3 rounded-full bg-amber-400/80 animate-pulse"></div>
                <span>Modifications non sauvegardées</span>
            </div>
        );
    }
    return null;
};

export default SaveStatusIndicator;
