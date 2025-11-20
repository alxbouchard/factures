import React, { useState } from 'react';
import { LineItem } from '../types';
import { generateDescription } from '../services/geminiService';
import { TrashIcon, MagicIcon } from './icons';

interface LineItemRowProps {
  item: LineItem;
  onChange: (id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => void;
  onRemove: (id: number) => void;
  onDescriptionUpdate: (id: number, newDescription: string) => void;
}

const LineItemRow: React.FC<LineItemRowProps> = ({ item, onChange, onRemove, onDescriptionUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [descriptionTitle, setDescriptionTitle] = useState(item.description);

  const handleGenerateDescription = async () => {
    if (!descriptionTitle.trim()) return;
    setIsGenerating(true);
    try {
      const newDescription = await generateDescription(descriptionTitle);
      onDescriptionUpdate(item.id, newDescription);
      setDescriptionTitle(newDescription); // Update local state as well
    } catch (error) {
      console.error('Failed to generate description:', error);
      // Optionally show an error to the user
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDescriptionTitle(value); // for AI prompt
      onChange(item.id, 'description', value); // for invoice state
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-12 md:col-span-6 relative">
        <input
          type="text"
          placeholder="Description de l'article"
          value={descriptionTitle}
          onChange={handleDescriptionChange}
          className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
        />
        <button
          onClick={handleGenerateDescription}
          disabled={isGenerating}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-wait"
          title="Générer la description avec l'IA"
        >
          {isGenerating ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <MagicIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="col-span-4 md:col-span-2">
        <input
          type="number"
          placeholder="Qté"
          value={item.quantity}
          onChange={(e) => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <input
          type="number"
          placeholder="Prix"
          value={item.price}
          onChange={(e) => onChange(item.id, 'price', parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      <div className="col-span-3 md:col-span-1 text-right text-slate-400 pr-2">
        ${(item.quantity * item.price).toFixed(2)}
      </div>
      <div className="col-span-1 text-right">
        <button onClick={() => onRemove(item.id)} className="text-slate-500 hover:text-red-500 transition-colors">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LineItemRow;
