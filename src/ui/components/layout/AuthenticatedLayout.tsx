import React, { type ReactNode } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useAuth } from '@/hooks/useAuth';
import { useConnectivity } from '@/hooks/useConnectivity';
import { syncWebPush } from '@/lib/pushClient';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { LoadingScreen } from '@/ui/components/common/LoadingScreen';
import { PushPrompt } from '@/ui/components/common/PushPrompt';
import { useWsDebugWindowOpen } from '@/ws/debug';

const WsDebugger = React.lazy(() =>
    import('@/ui/components/settings/WsDebugger').then((m) => ({
        default: m.WsDebugger,
    })),
);

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
            <LoadingScreen
                isVisible={isUserLoading || !isOnline || !isWsConnected}
                message={
                    !isWsConnected && isOnline
                        ? 'Sharpening claws and connecting...'
                        : undefined
                }
                type={isUserLoading ? 'loading' : 'offline'}
            />
            {!(isUserLoading || !isOnline || !isWsConnected) && <PushPrompt />}
            {isDebugWindowOpen && (
                <React.Suspense fallback={null}>
                    <WsDebugger />
                </React.Suspense>
            )}
            <Outlet />
        </WebSocketProvider>
    );
};
