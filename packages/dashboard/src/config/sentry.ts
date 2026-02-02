/**
 * Sentry Error Monitoring Configuration
 *
 * Initialize Sentry for error tracking in production.
 * Set VITE_SENTRY_DSN in your environment to enable.
 */

// Sentry configuration placeholder
// To enable Sentry:
// 1. npm install @sentry/react
// 2. Set VITE_SENTRY_DSN environment variable
// 3. Uncomment the code below

/*
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] Not initialized - VITE_SENTRY_DSN not set');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out common non-errors
    beforeSend(event) {
      // Don't send events from localhost in development
      if (window.location.hostname === 'localhost' && import.meta.env.DEV) {
        return null;
      }

      // Filter out browser extension errors
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension')
      )) {
        return null;
      }

      return event;
    },

    // Ignore common errors that aren't actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; name?: string }) {
  if (!SENTRY_DSN) return;

  Sentry.setUser(user);
}

export function clearUser() {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
}

export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}) {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb(breadcrumb);
}
*/

// Stub exports for when Sentry is not installed
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    console.log('[Sentry] DSN configured but @sentry/react not installed');
    console.log('[Sentry] To enable: npm install @sentry/react');
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error('[Error]', error.message, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (level === 'warning') {
    console.warn('[Message]', message);
  } else if (level === 'error') {
    console.error('[Message]', message);
  } else {
    console.info('[Message]', message);
  }
}

export function setUser(_user: { id: string; email?: string; name?: string }) {
  // No-op when Sentry not installed
}

export function clearUser() {
  // No-op when Sentry not installed
}

export function addBreadcrumb(_breadcrumb: {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}) {
  // No-op when Sentry not installed
}
