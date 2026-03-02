import { StrictMode } from 'react';

import 'katex/dist/katex.min.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Admin } from '@/pages/Admin';
import { App } from '@/pages/App';
import { Chat } from '@/pages/Chat';
import { ForgotPassword } from '@/pages/ForgotPassword';
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

const isTauri = (): boolean => '__TAURI__' in window;

export const WebOnly = ({
    children,
}: {
    children: React.ReactNode;
}): React.ReactNode => {
    if (isTauri()) return <Navigate replace to="/chat/@me" />;
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
                                <Route element={<AuthenticatedLayout />}>
                                    <Route path="/chat">
                                        <Route index element={<Chat />} />
                                        <Route element={<Chat />} path="@me" />
                                        <Route
                                            element={<Chat />}
                                            path="@server/:serverId"
                                        />
                                        <Route
                                            element={<Chat />}
                                            path="@server/:serverId/channel/:channelId"
                                        />
                                        <Route
                                            element={<Chat />}
                                            path="@server/:serverId/channel/:channelId/message/:messageId"
                                        />
                                        <Route
                                            element={<Chat />}
                                            path="@user/:userId"
                                        />
                                        <Route
                                            element={<Chat />}
                                            path="@setting"
                                        >
                                            <Route
                                                element={<Chat />}
                                                path="my-account"
                                            />
                                            <Route
                                                element={<Chat />}
                                                path="appearance"
                                            />
                                            <Route
                                                element={<Chat />}
                                                path="standing"
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
