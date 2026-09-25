import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { useAnalyticsConsent } from '../hooks/useAnalyticsConsent';

interface Props {
  lang: Language;
}

/**
 * Footer privacy toggle. Rendered only when analytics is configured.
 * Default is ON (opt-in); user can switch OFF (opt-out) anytime.
 */
export const AnalyticsConsentToggle: React.FC<Props> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const { enabled, optedOut, setOptOut } = useAnalyticsConsent();

  if (!enabled) return null;
  const on = !optedOut;

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
      <BarChart3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">{t.privacyAnalyticsTitle}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={t.privacyAnalyticsTitle}
        title={t.privacyAnalyticsDesc}
        onClick={() => setOptOut(on)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${
          on ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="font-semibold min-w-7 text-left">{on ? t.analyticsOn : t.analyticsOff}</span>
    </div>
  );
};
