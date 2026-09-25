import React, { useEffect, useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Palette,
  ShieldCheck,
  Database,
  Download,
  Upload,
  Globe,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { LanguageDropdown } from './LanguageDropdown';
import { AnalyticsConsentToggle } from './AnalyticsConsentToggle';
import {
  getStorageStatus,
  requestPersistentStorage,
  StorageStatus,
} from '../utils/persistentStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSetLanguage: (lang: Language) => void;
  onExportAllJson: () => void;
  onImportJson: (jsonData: string) => void;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
      {icon}
      <span>{children}</span>
    </div>
  );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  theme,
  onToggleTheme,
  onSetLanguage,
  onExportAllJson,
  onImportJson,
}) => {
  const t = TRANSLATIONS[lang];
  const [storage, setStorage] = useState<StorageStatus | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getStorageStatus().then(setStorage).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleEnablePersist = async () => {
    await requestPersistentStorage();
    getStorageStatus().then(setStorage).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">{t.settingsTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped sections */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Appearance: theme + language */}
          <section className="space-y-3">
            <SectionTitle icon={<Palette className="w-3.5 h-3.5" />}>{t.settingsAppearance}</SectionTitle>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.theme}</span>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
                <button
                  onClick={() => theme !== 'light' && onToggleTheme()}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'bg-white dark:bg-neutral-900 shadow-2xs text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                  title={t.switchToLight}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => theme !== 'dark' && onToggleTheme()}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-neutral-900 shadow-2xs text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                  title={t.switchToDark}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                {t.language}
              </span>
              <LanguageDropdown lang={lang} onSelect={onSetLanguage} variant="button" />
            </div>
          </section>

          {/* 2. Privacy & analytics (opt-in by default, opt-out anytime) */}
          <section className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <SectionTitle icon={<ShieldCheck className="w-3.5 h-3.5" />}>{t.settingsPrivacy}</SectionTitle>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {t.privacyAnalyticsDesc}
            </p>
            <div className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2.5">
              <AnalyticsConsentToggle lang={lang} />
            </div>
          </section>

          {/* 3. Data & storage: backup/restore + persistence */}
          <section className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <SectionTitle icon={<Database className="w-3.5 h-3.5" />}>{t.settingsData}</SectionTitle>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportAllJson}
                className="p-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{t.backupJsonBtn}</span>
              </button>
              <label className="p-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{t.importJsonBtn}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.storageTitle}
                </span>
                {storage && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      storage.isPersistent
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                        : 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {storage.isPersistent ? t.persistentBadge : t.standardBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.storageDesc}
              </p>
              {storage && !storage.isPersistent && (
                <button
                  onClick={handleEnablePersist}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  {t.enablePersistBtn}
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
