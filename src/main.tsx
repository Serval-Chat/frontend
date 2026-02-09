import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Admin } from '@/pages/Admin';
import { App } from '@/pages/App';
import { Chat } from '@/pages/Chat';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Register } from '@/pages/Register';
import { Showoff } from '@/pages/Showoff';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/index.css';
import { ToastProvider } from '@/ui/components/common/Toast';
import { AdminRoute } from '@/ui/components/layout/AdminRoute';
import { AuthenticatedLayout } from '@/ui/components/layout/AuthenticatedLayout';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StoreProvider>
            <ThemeProvider>
                <QueryProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route element={<App />} path="/" />
                                <Route element={<Login />} path="/login" />
                                <Route
                                    element={<Register />}
                                    path="/register"
                                />
                                <Route element={<AuthenticatedLayout />}>
                                    <Route element={<Chat />} path="/chat" />
                                    <Route
                                        element={<Showoff />}
                                        path="/showoff"
                                    />
                                </Route>
                                <Route element={<AdminRoute />}>
                                    <Route element={<Admin />} path="/admin" />
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
