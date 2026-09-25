import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initAnalytics} from './utils/analytics';

// Default opt-in analytics (PostHog). No-op when unconfigured; user can
// opt out anytime via the footer toggle (per-app namespaced flag).
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
