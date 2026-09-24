import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Language, LANGUAGES, TRANSLATIONS } from '../utils/i18n';

interface LanguageDropdownProps {
  lang: Language;
  onSelect: (lang: Language) => void;
  variant?: 'header' | 'button';
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ lang, onSelect, variant = 'header' }) => {
  const [open, setOpen] = useState(false);
  const t = TRANSLATIONS[lang];
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const buttonClass =
    variant === 'header'
      ? 'px-2 py-1 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors flex items-center gap-1'
      : 'px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-xl transition-colors flex items-center gap-1.5';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={buttonClass}
        title={t.language}
      >
        <Globe className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
        <span>{current.short}</span>
        <ChevronDown className="w-3 h-3 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 py-1 w-40 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 animate-in fade-in duration-100 max-h-64 overflow-y-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                onSelect(l.code);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-xs text-left font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between gap-2 ${
                lang === l.code
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <span>{l.label}</span>
              {lang === l.code && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
