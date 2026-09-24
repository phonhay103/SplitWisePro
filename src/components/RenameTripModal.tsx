import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { Group } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { CURRENCIES, normalizeCurrencyCode } from '../utils/currency';

interface RenameTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  lang: Language;
  onSave: (newName: string, newCurrency: string) => void;
}

export const RenameTripModal: React.FC<RenameTripModalProps> = ({
  isOpen,
  onClose,
  group,
  lang,
  onSave,
}) => {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(normalizeCurrencyCode(group.currency));

  useEffect(() => {
    setName(group.name);
    setCurrency(normalizeCurrencyCode(group.currency));
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), currency);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">{t.editTripModalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {t.tripNameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {t.currencySymbolLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5 pt-1 max-h-44 overflow-y-auto">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`py-1.5 px-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    currency === c.code
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {c.code} <span className="font-normal opacity-70">({c.symbol})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-750"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              {t.saveTripDetails}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
