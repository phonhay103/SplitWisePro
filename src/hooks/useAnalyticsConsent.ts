import { useEffect, useState } from 'react';
import {
  isAnalyticsEnabled,
  isAnalyticsOptedOut,
  setAnalyticsOptedOut,
  subscribeConsentChange,
} from '../utils/analytics';

/** Reactive consent state. Default is opt-in; user can opt out anytime. */
export function useAnalyticsConsent() {
  const [optedOut, setOptedOut] = useState<boolean>(() => isAnalyticsOptedOut());
  const [enabled] = useState<boolean>(() => isAnalyticsEnabled());

  useEffect(() => {
    const refresh = () => setOptedOut(isAnalyticsOptedOut());
    return subscribeConsentChange(refresh);
  }, []);

  return {
    /** SDK configured with a key. */
    enabled,
    /** User opted out (or DNT). */
    optedOut,
    /** Effective opt-in state. */
    optedIn: !optedOut,
    setOptOut: (v: boolean) => {
      setAnalyticsOptedOut(v);
      setOptedOut(isAnalyticsOptedOut());
    },
  };
}
