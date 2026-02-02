import { type ReactNode } from 'react';

import { Outlet } from 'react-router-dom';

import { WebSocketProvider } from '@/providers/WebSocketProvider';

export const AuthenticatedLayout = (): ReactNode => (
    <WebSocketProvider>
        <Outlet />
    </WebSocketProvider>
);
