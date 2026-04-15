import React, { type ReactNode } from 'react';

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useBlockProfiles, useBlocks } from '@/api/blocks/blocks.queries';
import { useFriendProfiles, useFriends } from '@/api/friends/friends.queries';
import { usePings } from '@/api/pings/pings.queries';
import {
    useMembers,
    useServers,
    useUnreadStatus,
} from '@/api/servers/servers.queries';
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
    const location = useLocation();
    const { data: user, isLoading: isUserLoading } = useMe();
    const { isLoading: isServersLoading } = useServers();
    const { isLoading: isUnreadLoading } = useUnreadStatus();
    const { isLoading: isPingsLoading } = usePings();
    const isHomeRoute = location.pathname.includes('/@me');
    const { isLoading: isFriendsLoading } = useFriends({
        enabled: isHomeRoute,
    });
    const { isLoading: isFriendProfilesLoading } = useFriendProfiles({
        enabled: isHomeRoute,
    });
    const { isLoading: isBlocksLoading } = useBlockProfiles({
        enabled: isHomeRoute,
    });
    const { isLoading: isRelationshipsLoading } = useBlocks({
        enabled: isHomeRoute,
    });

    const serverIdMatch = location.pathname.match(/@server\/([^/]+)/);
    const serverId = serverIdMatch ? serverIdMatch[1] : null;

    const isServerRoute = location.pathname.includes('/@server/');
    useMembers(serverId, {
        enabled: isAuthenticated && !!serverId && isServerRoute,
    });

    const { status } = useConnectivity();

    const isInitialDataLoading =
        isUserLoading ||
        isServersLoading ||
        isUnreadLoading ||
        isPingsLoading ||
        (isHomeRoute && isFriendsLoading) ||
        (isHomeRoute && isBlocksLoading) ||
        (isHomeRoute && isRelationshipsLoading) ||
        (isHomeRoute && isFriendProfilesLoading);
    const [showReconnecting, setShowReconnecting] = React.useState(false);
    const isDebugWindowOpen = useWsDebugWindowOpen();

    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (status === 'reconnecting' || status === 'connecting') {
            timeout = setTimeout(() => setShowReconnecting(true), 1500);
        } else {
            setShowReconnecting(false);
        }
        return () => clearTimeout(timeout);
    }, [status]);

    React.useEffect(() => {
        if (isAuthenticated && user && !isInitialDataLoading) {
            void syncWebPush();
        }
    }, [isAuthenticated, user, isInitialDataLoading]);

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    if (isInitialDataLoading || !user) {
        return (
            <LoadingScreen
                message="Synchronizing your profile and servers..."
                type="loading"
            />
        );
    }

    return (
        <WebSocketProvider>
            {(status === 'offline' || showReconnecting) && (
                <LoadingScreen
                    message={
                        status === 'offline'
                            ? 'Please check your internet connection'
                            : 'Sharpening claws and reconnecting...'
                    }
                    type={status === 'offline' ? 'offline' : 'reconnecting'}
                />
            )}
            <BlockSyncProvider />
            <PushPrompt />
            {isDebugWindowOpen && <WsDebugger />}
            <Outlet />
        </WebSocketProvider>
    );
};
