import React, { type ReactNode } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useAuth } from '@/hooks/useAuth';
import { syncWebPush } from '@/lib/pushClient';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { PushPrompt } from '@/ui/components/common/PushPrompt';
import { WsDebugger } from '@/ui/components/settings/WsDebugger';
import { useWsDebugWindowOpen } from '@/ws/debug';

export const AuthenticatedLayout = (): ReactNode => {
    const { isAuthenticated } = useAuth();
    const { data: user, isLoading } = useMe();
    const isDebugWindowOpen = useWsDebugWindowOpen();

    React.useEffect(() => {
        if (isAuthenticated && user) {
            void syncWebPush();
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <WebSocketProvider>
            <PushPrompt />
            {isDebugWindowOpen && <WsDebugger />}
            <Outlet />
        </WebSocketProvider>
    );
};
