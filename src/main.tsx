import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/styles/index.css';
import App from '@/pages/App';
import Showoff from '@/pages/Showoff';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/showoff" element={<Showoff />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
