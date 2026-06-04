import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
        dsn: 'http://9WV1-H-cICJrw1F-mApuEw:6KwjExzyZ2Sex899YwGmbw@localhost:5151/api/cdkLdNTE-FPioIsq/envelope/',
        debug: import.meta.env.DEV,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 1.0,
    });
}
