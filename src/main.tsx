import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { App } from '@/pages/App';
import { Chat } from '@/pages/Chat';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Register } from '@/pages/Register';
import { Showoff } from '@/pages/Showoff';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import '@/styles/index.css';
import { ToastProvider } from '@/ui/components/common/Toast';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StoreProvider>
            <ThemeProvider>
                <QueryProvider>
                    <WebSocketProvider>
                        <ToastProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route element={<App />} path="/" />
                                    <Route element={<Login />} path="/login" />
                                    <Route
                                        element={<Register />}
                                        path="/register"
                                    />
                                    <Route element={<Chat />} path="/chat" />
                                    <Route
                                        element={<Showoff />}
                                        path="/showoff"
                                    />
                                    <Route element={<NotFound />} path="*" />
                                </Routes>
                            </BrowserRouter>
                        </ToastProvider>
                    </WebSocketProvider>
                </QueryProvider>
            </ThemeProvider>
        </StoreProvider>
    </StrictMode>,
);
