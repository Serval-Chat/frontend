import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
        dsn: 'http://DsFPVF8dTaad5DWTwafHWxUh@localhost:5151/895435507996517',
        debug: import.meta.env.DEV,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 1,
    });
}
