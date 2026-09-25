/**
 * Central app configuration — ONE place for per-app settings.
 *
 * Multi-app rule: every deployment sets VITE_ANALYTICS_APP_ID so events are
 * tagged with `app_id` and opt-out flags never collide between sibling apps.
 * Env vars always override the built-in defaults below (per-deploy override).
 */

function readEnv(key: string): string | undefined {
  try {
    const v = (import.meta.env as Record<string, string | undefined>)[key];
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

function cleanAppId(raw: string): string {
  const clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return clean || 'splitwisepro';
}

/** Unique id of THIS app (multi-app namespacing + `app_id` event property). */
export const APP_ID: string = cleanAppId(readEnv('VITE_ANALYTICS_APP_ID') || 'splitwisepro');

// ---------------------------------------------------------------------------
// Default PostHog project (built-in fallback — always present, even without
// env vars). `phc_` keys are publishable by design (safe to embed in client
// bundles). Set VITE_PUBLIC_POSTHOG_KEY / VITE_PUBLIC_POSTHOG_HOST to override
// per deployment (e.g. staging vs production, or one project per app).
// ---------------------------------------------------------------------------
const DEFAULT_POSTHOG_KEY = 'phc_qSPtoe3TYHvGVfqCoRaTPLkddMqqSfPDrpPWXzG8fc2T';
const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

export const POSTHOG_CONFIG = {
  key:
    readEnv('VITE_PUBLIC_POSTHOG_KEY') ||
    readEnv('VITE_POSTHOG_KEY') ||
    DEFAULT_POSTHOG_KEY,
  host:
    readEnv('VITE_PUBLIC_POSTHOG_HOST') ||
    readEnv('VITE_POSTHOG_HOST') ||
    DEFAULT_POSTHOG_HOST,
  // Pins the PostHog SDK default-behavior version (matches official snippet).
  // Our explicit finance-safe overrides below always win over these defaults.
  defaults: '2026-05-30' as const,
};

export const APP_CONFIG = {
  appId: APP_ID,
  posthog: POSTHOG_CONFIG,
} as const;
