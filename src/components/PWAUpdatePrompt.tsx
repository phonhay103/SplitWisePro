import React from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { TRANSLATIONS } from '../utils/i18n';

/**
 * Service-worker lifecycle UI:
 * - Shows a reload banner when a new app version is ready (registerType: 'prompt').
 * - Shows a one-time "ready for offline use" toast once precaching completes.
 *
 * Fixed to English: system-level browser prompts stay consistent regardless
 * of the app's content language.
 */
export const PWAUpdatePrompt: React.FC = () => {
  const t = TRANSLATIONS.en;
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Check hourly for updates while the app stays open.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  const closeOfflineToast = () => setOfflineReady(false);
  if (!offlineReady && !needRefresh) return null;

  return (
    <>
      {offlineReady && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold px-4 py-2.5 shadow-xl border border-neutral-700 dark:border-neutral-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.offlineReadyToast}</span>
          <button
            onClick={closeOfflineToast}
            className="p-0.5 rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold pl-4 pr-2.5 py-2 shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {t.updateAvailableToast}
          </span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-2.5 py-1 text-xs font-bold bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            {t.reloadBtn}
          </button>
        </div>
      )}
    </>
  );
};
