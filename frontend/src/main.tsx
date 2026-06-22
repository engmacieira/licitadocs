import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { initPostHog } from './lib/posthog';
import App from './App.tsx';
import './index.css';
import './App.css';

initPostHog();

/**
 * INICIALIZAÇÃO DO SENTRY
 */
Sentry.init({
  dsn: "https://13049bcea3deebc6c49fbfb24fe5769b@o4511609001541632.ingest.us.sentry.io/4511609046368256",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Tracing
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Session Replay (Gravação da tela na hora do erro)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);