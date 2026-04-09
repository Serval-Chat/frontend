import { StrictMode, Suspense, lazy } from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { teardownWebPush } from '@/lib/pushClient';
import { App } from '@/pages/App';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/index.css';
import { LoadingScreen } from '@/ui/components/common/LoadingScreen';
import { ToastProvider } from '@/ui/components/common/Toast';
import { AdminRoute } from '@/ui/components/layout/AdminRoute';
import { AuthenticatedLayout } from '@/ui/components/layout/AuthenticatedLayout';
import { NavigationSync } from '@/ui/components/layout/NavigationSync';
import { hasAuthToken } from '@/utils/authToken';

const Admin = lazy(() =>
    import('@/pages/Admin').then((m) => ({ default: m.Admin })),
);
const Chat = lazy(() =>
    import('@/pages/Chat').then((m) => ({ default: m.Chat })),
);
const Downloads = lazy(() =>
    import('@/pages/Downloads').then((m) => ({ default: m.Downloads })),
);
const EmbedBuilder = lazy(() =>
    import('@/pages/EmbedBuilder').then((m) => ({ default: m.EmbedBuilder })),
);
const ForgotPassword = lazy(() =>
    import('@/pages/ForgotPassword').then((m) => ({
        default: m.ForgotPassword,
    })),
);
const Invite = lazy(() =>
    import('@/pages/Invite').then((m) => ({ default: m.Invite })),
);
const Login = lazy(() =>
    import('@/pages/Login').then((m) => ({ default: m.Login })),
);
const NotFound = lazy(() =>
    import('@/pages/NotFound').then((m) => ({ default: m.NotFound })),
);
const Register = lazy(() =>
    import('@/pages/Register').then((m) => ({ default: m.Register })),
);
const ResetPassword = lazy(() =>
    import('@/pages/ResetPassword').then((m) => ({ default: m.ResetPassword })),
);
const Showoff = lazy(() =>
    import('@/pages/Showoff').then((m) => ({ default: m.Showoff })),
);
const TauriGateway = lazy(() =>
    import('@/pages/TauriGateway').then((m) => ({ default: m.TauriGateway })),
);

const isTauri = (): boolean => '__TAURI__' in window;
window.addEventListener('auth-change', () => {
    if (!hasAuthToken()) {
        teardownWebPush().catch(console.error);
    }
});

export const WebOnly = ({
    children,
}: {
    children: React.ReactNode;
}): React.ReactNode => {
    if (isTauri()) {
        console.warn(
            'WebOnly: Redirecting to /chat/@me because this is a desktop (Tauri) environment',
        );
        return <Navigate replace to="/chat/@me" />;
    }
    return children;
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StoreProvider>
            <ThemeProvider>
                <QueryProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <Suspense
                                fallback={<LoadingScreen type="loading" />}
                            >
                                <Routes>
                                    <Route
                                        element={
                                            <WebOnly>
                                                <App />
                                            </WebOnly>
                                        }
                                        path="/"
                                    />
                                    <Route element={<Login />} path="/login" />
                                    <Route
                                        element={<Invite />}
                                        path="/invite/:inviteId"
                                    />
                                    <Route
                                        element={<TauriGateway />}
                                        path="/gateway"
                                    />
                                    <Route
                                        element={
                                            <WebOnly>
                                                <ForgotPassword />
                                            </WebOnly>
                                        }
                                        path="/forgot-password"
                                    />
                                    <Route
                                        element={
                                            <WebOnly>
                                                <ResetPassword />
                                            </WebOnly>
                                        }
                                        path="/reset-password"
                                    />
                                    <Route
                                        element={
                                            <WebOnly>
                                                <Register />
                                            </WebOnly>
                                        }
                                        path="/register"
                                    />
                                    <Route
                                        element={<Downloads />}
                                        path="/downloads"
                                    />
                                    <Route element={<AuthenticatedLayout />}>
                                        <Route element={<Chat />} path="/chat">
                                            <Route
                                                index
                                                element={<NavigationSync />}
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@me"
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@server/:serverId"
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@server/:serverId/channel/:channelId"
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@server/:serverId/channel/:channelId/message/:messageId"
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@user/:userId"
                                            />
                                            <Route
                                                element={<NavigationSync />}
                                                path="@setting"
                                            >
                                                <Route
                                                    element={<NavigationSync />}
                                                    path="my-account"
                                                />
                                                <Route
                                                    element={<NavigationSync />}
                                                    path="appearance"
                                                />
                                                <Route
                                                    element={<NavigationSync />}
                                                    path="accessibility"
                                                />
                                                <Route
                                                    element={<NavigationSync />}
                                                    path="standing"
                                                />
                                                <Route
                                                    element={<NavigationSync />}
                                                    path="developer"
                                                />
                                            </Route>
                                        </Route>
                                        <Route
                                            element={
                                                <WebOnly>
                                                    <Showoff />
                                                </WebOnly>
                                            }
                                            path="/showoff"
                                        />
                                        <Route
                                            element={<EmbedBuilder />}
                                            path="/embed-builder"
                                        />
                                    </Route>
                                    <Route element={<AdminRoute />}>
                                        <Route
                                            element={
                                                <WebOnly>
                                                    <Admin />
                                                </WebOnly>
                                            }
                                            path="/admin"
                                        />
                                    </Route>
                                    <Route element={<NotFound />} path="*" />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </ToastProvider>
                </QueryProvider>
            </ThemeProvider>
        </StoreProvider>
    </StrictMode>,
);
