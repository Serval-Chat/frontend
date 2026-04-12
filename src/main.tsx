import { StrictMode } from 'react';

import 'katex/dist/katex.min.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { teardownWebPush } from '@/lib/pushClient';
import { Admin } from '@/pages/Admin';
import { App } from '@/pages/App';
import { Chat } from '@/pages/Chat';
import { Downloads } from '@/pages/Downloads';
import { EmbedBuilder } from '@/pages/EmbedBuilder';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Invite } from '@/pages/Invite';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Register } from '@/pages/Register';
import { ResetPassword } from '@/pages/ResetPassword';
import { Showoff } from '@/pages/Showoff';
import { TauriGateway } from '@/pages/TauriGateway';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/index.css';
import { ToastProvider } from '@/ui/components/common/Toast';
import { AdminRoute } from '@/ui/components/layout/AdminRoute';
import { AuthenticatedLayout } from '@/ui/components/layout/AuthenticatedLayout';
import { NavigationSync } from '@/ui/components/layout/NavigationSync';
import { hasAuthToken } from '@/utils/authToken';

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
                                            <Route
                                                element={<NavigationSync />}
                                                path="blocking"
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
                        </BrowserRouter>
                    </ToastProvider>
                </QueryProvider>
            </ThemeProvider>
        </StoreProvider>
    </StrictMode>,
);
