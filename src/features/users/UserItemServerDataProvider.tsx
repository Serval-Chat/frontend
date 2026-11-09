import React, { type ReactNode, useMemo } from 'react';

import {
    useBanMember,
    useKickMember,
    useMemberByUserId,
    useServerDetails,
    useTimeoutMember,
} from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';

import type { ServerData } from './userItemContext';
import { ServerDataContext, UserItemViewportContext } from './userItemContext';

export const UserItemViewportProvider = React.memo(
    ({ children }: { children: React.ReactNode }): ReactNode => {
        const [isMobile, setIsMobile] = React.useState(
            (): boolean => window.innerWidth < 768,
        );

        React.useEffect((): (() => void) => {
            const handleResize = (): void => {
                setIsMobile(window.innerWidth < 768);
            };
            window.addEventListener('resize', handleResize);
            return (): void => {
                window.removeEventListener('resize', handleResize);
            };
        }, []);

        return (
            <UserItemViewportContext.Provider value={isMobile}>
                {children}
            </UserItemViewportContext.Provider>
        );
    },
);

UserItemViewportProvider.displayName = 'UserItemViewportProvider';

export const ServerDataInjector = React.memo(
    ({
        serverId,
        children,
    }: {
        serverId: string;
        children: (data: ServerData) => React.ReactNode;
    }): ReactNode => {
        const { mutate: kickMember } = useKickMember(serverId);
        const { mutate: banMember } = useBanMember(serverId);
        const { mutate: timeoutMember } = useTimeoutMember(serverId);
        const { data: serverDetails } = useServerDetails(serverId, {
            enabled: true,
        });
        const { data: currentUser } = useMe();
        const { data: currentUserMember } = useMemberByUserId(
            serverId,
            currentUser?.id,
            { enabled: true },
        );

        const data = useMemo(
            () => ({
                kickMember,
                banMember,
                timeoutMember,
                serverDetails,
                currentUserMember,
            }),
            [
                kickMember,
                banMember,
                timeoutMember,
                serverDetails,
                currentUserMember,
            ],
        );

        return <>{children(data)}</>;
    },
);

ServerDataInjector.displayName = 'ServerDataInjector';

export const ServerDataContextProvider = ({
    serverId,
    data,
    children,
}: {
    serverId: string;
    data: ServerData;
    children: React.ReactNode;
}): ReactNode => {
    const value = useMemo(() => ({ serverId, data }), [serverId, data]);
    return (
        <ServerDataContext.Provider value={value}>
            {children}
        </ServerDataContext.Provider>
    );
};

export const UserItemServerDataProvider = React.memo(
    ({
        serverId,
        children,
    }: {
        serverId: string;
        children: React.ReactNode;
    }): ReactNode => (
        <UserItemViewportProvider>
            {serverId ? (
                <ServerDataInjector serverId={serverId}>
                    {(data): ReactNode => (
                        <ServerDataContextProvider
                            data={data}
                            serverId={serverId}
                        >
                            {children}
                        </ServerDataContextProvider>
                    )}
                </ServerDataInjector>
            ) : (
                children
            )}
        </UserItemViewportProvider>
    ),
);

UserItemServerDataProvider.displayName = 'UserItemServerDataProvider';
