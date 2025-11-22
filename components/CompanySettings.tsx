
import React, { useState, useEffect, useRef } from 'react';
import { CompanyInfo } from '../types';
import { toBase64 } from '../utils/helpers';
import { CloseIcon, UploadIcon, SunIcon, MoonIcon } from './icons';
import { analyzeInvoice } from '../services/geminiService';

interface CompanySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: CompanyInfo) => void;
  initialInfo: CompanyInfo | null;
  onLogout: () => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  currentTheme: 'light' | 'dark';
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ isOpen, onClose, onSave, initialInfo, onLogout, onThemeChange, currentTheme }) => {
  const [info, setInfo] = useState<CompanyInfo>({
    name: '', address: '', phone: '', email: '', logo: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialInfo) {
      setInfo(initialInfo);
    }
  }, [initialInfo]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await toBase64(file);
      setInfo({ ...info, logo: base64 as string });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(info);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setAnalysisError("Type de fichier non supporté. Veuillez utiliser PNG, JPG ou PDF.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const base64File = await toBase64(file) as string;
      const fileData = {
        mimeType: file.type,
        data: base64File.split(',')[1],
      };

      const extractedData = await analyzeInvoice(fileData);

      setInfo(prev => ({
        ...prev,
        name: extractedData.name || prev.name,
        address: extractedData.address || prev.address,
        phone: extractedData.phone || prev.phone,
        email: extractedData.email || prev.email,
      }));

    } catch (error) {
      console.error(error);
      setAnalysisError("Impossible d'analyser le document. Veuillez remplir les champs manuellement.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleModalDrag = (e: React.DragEvent, isEntering: boolean) => {
    handleDragEvents(e);
    if (e.target === e.currentTarget) {
      setIsDragging(isEntering);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onDrop={handleDrop}
      onDragOver={handleDragEvents}
      onDragEnter={(e) => handleModalDrag(e, true)}
      onDragLeave={(e) => handleModalDrag(e, false)}
    >
      <div className={`bg-slate-800 rounded-lg shadow-xl w-full max-w-lg text-white transition-all duration-300 ${isDragging ? 'border-2 border-dashed border-indigo-500 scale-105' : 'border-2 border-transparent'}`} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Paramètres de l'entreprise</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Remplissage Automatique par l'IA
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center w-full h-32 px-4 text-center transition bg-slate-900 border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-slate-500 focus:outline-none ${isDragging ? 'border-indigo-400' : 'border-slate-700'}`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium text-slate-300">Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <span className="font-medium text-slate-400">
                      Glissez-déposez une facture ici
                      <span className="text-indigo-400"> ou parcourez</span>
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Image (PNG, JPG) ou PDF
                    </span>
                  </>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} accept="image/png,image/jpeg,image/webp,application/pdf" />
              </div>
              {analysisError && <p className="text-sm text-red-400 mt-2">{analysisError}</p>}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-800 px-2 text-sm text-slate-500">ou</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-slate-700 rounded-md flex items-center justify-center overflow-hidden">
                {info.logo ? (
                  <img src={info.logo} alt="Aperçu du logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 text-xs text-center">Aucun logo</span>
                )}
              </div>
              <div>
                <label htmlFor="logo-upload" className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition">
                  Télécharger le logo
                </label>
                <input id="logo-upload" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                <p className="text-xs text-slate-400 mt-2">PNG, JPG, SVG. Recommandé : 200x50px</p>
              </div>
            </div>

            <InputField name="name" label="Nom de l'entreprise" value={info.name} onChange={handleChange} />
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-400 mb-1">Adresse</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={info.address}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <InputField name="email" label="Courriel" type="email" value={info.email} onChange={handleChange} />
            <InputField name="phone" label="Téléphone" type="tel" value={info.phone} onChange={handleChange} />

            <InputField name="phone" label="Téléphone" type="tel" value={info.phone} onChange={handleChange} />

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Préférences de l'application</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white">Thème</span>
                <div className="flex bg-slate-900 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`p-2 rounded-md transition-colors ${currentTheme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <SunIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`p-2 rounded-md transition-colors ${currentTheme === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <MoonIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Se déconnecter
              </button>
            </div>

          </div>
          <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<{ name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }> = ({ name, label, value, onChange, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-slate-900 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
    />
  </div>
);

export default CompanySettings;
