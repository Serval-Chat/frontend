import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import App from '@/pages/App';
import Chat from '@/pages/Chat';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Register from '@/pages/Register';
import Showoff from '@/pages/Showoff';
import { QueryProvider } from '@/providers/QueryProvider';
import { StoreProvider } from '@/providers/StoreProvider';
import '@/styles/index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StoreProvider>
            <QueryProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/showoff" element={<Showoff />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </QueryProvider>
        </StoreProvider>
    </StrictMode>
);
