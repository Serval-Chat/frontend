import React, { type ReactNode } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { syncWebPush } from '@/lib/pushClient';
import { BlockSyncProvider } from '@/providers/BlockSyncProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { LoadingScreen } from '@/ui/components/common/LoadingScreen';
import { PushPrompt } from '@/ui/components/common/PushPrompt';
import { WsDebugger } from '@/ui/components/settings/WsDebugger';
import { useWsDebugWindowOpen } from '@/ws/debug';

export const AuthenticatedLayout = (): ReactNode => {
    const { isAuthenticated } = useAuth();
    const { data: user, isLoading: isUserLoading } = useMe();
    const { isOnline, isWsConnected } = useConnectivity();
    const isDebugWindowOpen = useWsDebugWindowOpen();

    React.useEffect(() => {
        if (isAuthenticated && user) {
            void syncWebPush();
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    return (
        <WebSocketProvider>
            {isUserLoading || !isOnline || !isWsConnected ? (
                <LoadingScreen
                    message={
                        !isWsConnected && isOnline
                            ? 'Sharpening claws and connecting...'
                            : undefined
                    }
                    type={isUserLoading ? 'loading' : 'offline'}
                />
            ) : (
                <>
                    <BlockSyncProvider />
                    <PushPrompt />
                    {isDebugWindowOpen && <WsDebugger />}
                    <Outlet />
                </>
            )}
        </WebSocketProvider>
    );
};
