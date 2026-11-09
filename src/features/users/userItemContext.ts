import React from 'react';

import type {
    useBanMember,
    useKickMember,
    useMemberByUserId,
    useServerDetails,
    useTimeoutMember,
} from '@/api/servers/servers.queries';

export interface ServerData {
    kickMember: ReturnType<typeof useKickMember>['mutate'];
    banMember: ReturnType<typeof useBanMember>['mutate'];
    timeoutMember: ReturnType<typeof useTimeoutMember>['mutate'];
    serverDetails: ReturnType<typeof useServerDetails>['data'];
    currentUserMember: ReturnType<typeof useMemberByUserId>['data'];
}

export const UserItemViewportContext = React.createContext<boolean | null>(
    null,
);

export const ServerDataContext = React.createContext<{
    serverId: string;
    data: ServerData;
} | null>(null);
