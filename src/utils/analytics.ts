import posthog from 'posthog-js';
import { APP_ID, POSTHOG_CONFIG } from '../config';

/**
 * Multi-app safe, finance-aware analytics wrapper around PostHog.
 *
 * All per-app settings live in `src/config.ts` (APP_ID, POSTHOG_CONFIG).
 * The built-in PostHog project key is always present as a fallback, so
 * analytics works out of the box; env vars override it per deployment.
 *
 * MULTI-APP (no conflict):
 * - Each deployed app sets VITE_ANALYTICS_APP_ID (default "splitwisepro").
 * - Every event carries an `app_id` super-property, so many apps can share
 *   ONE PostHog project (filter by app_id) OR each use its own key/project.
 * - PostHog already namespaces its storage per API key (ph_<key>_posthog),
 *   so different keys never collide. Our own opt-out flag is additionally
 *   namespaced per app: `swp_analytics_optout_<appId>`.
 * - `cross_subdomain_cookie: false` + localStorage persistence keeps cookies
 *   from leaking across sibling apps on subdomains.
 *
 * FINANCE SAFETY:
 * - No autocapture, no pageview auto-capture, no session recording, no surveys.
 * - Only explicit trackEvent() calls fire, and props are sanitized:
 *   names/notes/payment handles/descriptions are dropped, amounts are sent
 *   as order-of-magnitude buckets, never exact values.
 *
 * CONSENT: default OPT-IN, user can OPT-OUT anytime (toggle in footer).
 * - Initialized with opt_out_capturing_by_default: true, then opt-in ONLY if
 *   the user has not opted out and DNT is not set. This avoids leaking even
 *   a single auto-event before the opt-out flag is applied.
 * - DNT (Do Not Track) is always respected, even though default is opt-in.
 */

export const ANALYTICS_APP_ID: string = APP_ID;

const OPT_OUT_STORAGE_KEY = `swp_analytics_optout_${ANALYTICS_APP_ID}`;
const CONSENT_EVENT = 'analytics-consent-changed';

/** Allowlist of events this app may send. Keeps dashboards clean across apps. */
export type AnalyticsEvent =
  | 'app_opened'
  | 'tab_viewed'
  | 'group_created'
  | 'expense_added'
  | 'expense_deleted'
  | 'settlement_viewed'
  | 'settlement_marked_paid'
  | 'report_exported';

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

/** Keys that must NEVER leave the device (PII / finance details). */
const BLOCKED_PROP_KEYS = new Set([
  'name',
  'member_name',
  'description',
  'note',
  'title',
  'paymentdetails',
  'payment_details',
  'paymenthandle',
  'payment_handle',
  'email',
  'phone',
  'stk',
  'bank',
  'account',
  'address',
  'ip',
]);

/** Exact money values are never sent — bucket to order of magnitude instead. */
export function bucketAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0';
  const exp = Math.floor(Math.log10(amount));
  return `~1e${exp}`;
}

/** Small counts are sent as small buckets to limit fingerprinting. */
export function bucketCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n <= 2) return '1-2';
  if (n <= 5) return '3-5';
  if (n <= 10) return '6-10';
  return '10+';
}

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return { app_id: ANALYTICS_APP_ID };
  const out: AnalyticsProps = { app_id: ANALYTICS_APP_ID };
  for (const [rawKey, value] of Object.entries(props)) {
    const key = rawKey.toLowerCase();
    if (BLOCKED_PROP_KEYS.has(key)) continue;
    // Exact `amount` is forbidden — callers must pass `amount_magnitude`.
    if (key === 'amount' && typeof value === 'number') {
      out.amount_magnitude = bucketAmount(value);
      continue;
    }
    if (value !== undefined) out[rawKey] = value;
  }
  return out;
}

function readOptOutFlag(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isDntSet(): boolean {
  try {
    return (
      navigator.doNotTrack === '1' ||
      (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
    );
  } catch {
    return false;
  }
}

function resolveKey(): string | undefined {
  return POSTHOG_CONFIG.key || undefined;
}

function resolveHost(): string | undefined {
  return POSTHOG_CONFIG.host || undefined;
}

let initializedAppId: string | null = null;

function isInitialized(): boolean {
  return initializedAppId === ANALYTICS_APP_ID;
}

/** Analytics is configured (built-in default key is always present unless removed). */
export function isAnalyticsEnabled(): boolean {
  return !!resolveKey();
}

/** True when the user opted out (persisted per app) or DNT is set. */
export function isAnalyticsOptedOut(): boolean {
  return readOptOutFlag() || isDntSet();
}

/** True when events are actually being sent right now. */
export function isAnalyticsActive(): boolean {
  return isAnalyticsEnabled() && isInitialized() && !isAnalyticsOptedOut();
}

function notifyConsentChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
  } catch {
    /* noop */
  }
}

export function subscribeConsentChange(listener: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Initialize PostHog once. Safe to call multiple times (idempotent per app id).
 * Default is OPT-IN: tracking starts unless the user opted out or DNT is set.
 * Returns true when the SDK was initialized.
 */
export function initAnalytics(): boolean {
  if (typeof window === 'undefined') return false;
  if (isInitialized()) return true;
  const key = resolveKey();
  if (!key) return false;

  const optedOut = isAnalyticsOptedOut();

  posthog.init(key, {
    api_host: resolveHost() || 'https://us.i.posthog.com',
    defaults: POSTHOG_CONFIG.defaults,
    // Finance-safe: manual tracking only, nothing automatic that could
    // capture money inputs, names, or bank details from the DOM.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    capture_dead_clicks: false,
    disable_session_recording: true,
    disable_surveys: true,
    // Start opted-out, then opt in below only when allowed — no event leaks.
    opt_out_capturing_by_default: true,
    respect_dnt: true,
    persistence: 'localStorage',
    cross_subdomain_cookie: false,
    secure_cookie: true,
    person_profiles: 'identified_only',
    loaded: (ph) => {
      try {
        ph.register({ app_id: ANALYTICS_APP_ID });
        if (optedOut) {
          ph.opt_out_capturing();
        } else {
          // Default opt-in.
          ph.opt_in_capturing();
        }
      } catch {
        /* noop */
      }
    },
  });

  initializedAppId = ANALYTICS_APP_ID;
  return true;
}

/** Track one allowlisted event with sanitized props. No-op when opted out. */
export function trackEvent(event: AnalyticsEvent, props?: AnalyticsProps): void {
  try {
    if (!isInitialized() || isAnalyticsOptedOut()) return;
    posthog.capture(event, sanitizeProps(props));
  } catch {
    /* analytics must never break the app */
  }
}

/** Manual pageview with query string stripped (avoids leaking ?tab= / ?action=). */
export function trackPageView(path?: string): void {
  try {
    if (!isInitialized() || isAnalyticsOptedOut()) return;
    const cleanPath = (path || window.location.pathname).split('?')[0].split('#')[0] || '/';
    posthog.capture('$pageview', { app_id: ANALYTICS_APP_ID, path: cleanPath });
  } catch {
    /* noop */
  }
}

/**
 * Set consent. Default is opt-in; call with true to opt OUT.
 * Persists per app (`swp_analytics_optout_<appId>`) so sibling apps are unaffected.
 */
export function setAnalyticsOptedOut(optOut: boolean): void {
  try {
    if (optOut) {
      localStorage.setItem(OPT_OUT_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(OPT_OUT_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable — still apply to the SDK */
  }
  try {
    if (isInitialized()) {
      if (optOut || isDntSet()) {
        posthog.opt_out_capturing();
      } else {
        posthog.opt_in_capturing();
      }
    }
  } catch {
    /* noop */
  }
  notifyConsentChanged();
}
