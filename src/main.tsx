import { StrictMode, Suspense } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from '@/AppRoutes';
import { teardownWebPush } from '@/lib/pushClient';
import { LimitedAnimationsProvider } from '@/providers/LimitedAnimationsProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/sentry';
import '@/styles/index.css';
import { ToastProvider } from '@/ui/components/common/Toast';
import { Seo } from '@/ui/components/seo/Seo';
import { InAppNotificationProvider } from '@/ui/notifications/InAppNotificationProvider';
import { hasAuthToken } from '@/utils/authToken';

globalThis.addEventListener('auth-change', (): void => {
    if (!hasAuthToken()) {
        teardownWebPush().catch(console.error);
    }
});

createRoot(document.querySelector('#root')!).render(
    <StrictMode>
        <LazyMotion features={domAnimation}>
            <StoreProvider>
                <QueryProvider>
                    <ThemeProvider>
                        <ToastProvider>
                            <BrowserRouter>
                                <LimitedAnimationsProvider>
                                    <InAppNotificationProvider>
                                        <Seo />
                                        <Suspense
                                            fallback={
                                                <div className="flex h-screen items-center justify-center">
                                                    Loading...
                                                </div>
                                            }
                                        >
                                            <AppRoutes />
                                        </Suspense>
                                    </InAppNotificationProvider>
                                </LimitedAnimationsProvider>
                            </BrowserRouter>
                        </ToastProvider>
                    </ThemeProvider>
                </QueryProvider>
            </StoreProvider>
        </LazyMotion>
    </StrictMode>,
);
