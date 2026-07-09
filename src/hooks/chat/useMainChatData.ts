import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import {
    useClearChannelPings,
    useDeletePing,
    usePings,
} from '@/api/pings/pings.queries';
import {
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useMemberMaps } from '@/hooks/chat/useMemberMaps';
import { usePaginatedMessages } from '@/hooks/chat/usePaginatedMessages';
import { useProcessedMessages } from '@/hooks/chat/useProcessedMessages';
import { useSlowMode } from '@/hooks/chat/useSlowMode';
import { usePermissions } from '@/hooks/usePermissions';
import { useChatWS } from '@/hooks/ws/useChatWS';

interface UseMainChatDataArgs {
    requireUrlMatch: boolean;
    selectedFriendId: string | null;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    targetMessageId: string | null;
    currentUser: User | undefined;
}

/**
 * aggregates every server/channel/DM data source MainChat renders from
 * (details, channels, members, roles, permissions, pings, paginated +
 * processed messages, live chat websocket, slow-mode). Extracted so MainChat
 * itself only wires state to the view.
 */
export const useMainChatData = ({
    requireUrlMatch,
    selectedFriendId,
    selectedServerId,
    selectedChannelId,
    targetMessageId,
    currentUser,
}: UseMainChatDataArgs) => {
    const location = useLocation();

    const { data: friendUser, isError: isFriendError } = useUserById(
        selectedFriendId ?? '',
        {
            enabled: !!selectedFriendId,
        },
    );

    const serverIdFromUrl = location.pathname
        .split('/@server/')[1]
        ?.split('/')[0];
    const isServerContextReady =
        !!selectedServerId &&
        (!requireUrlMatch ||
            (!!serverIdFromUrl && selectedServerId === serverIdFromUrl));

    const { data: serverDetails } = useServerDetails(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: channels } = useChannels(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: members } = useMembers(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: roles } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { hasPermission, isOwner, isTimedOut } = usePermissions(
        selectedServerId,
        selectedChannelId,
        { enabled: isServerContextReady },
    );
    const { data: pings } = usePings();
    const { mutate: clearChannelPings } = useClearChannelPings();
    const { mutate: deletePing } = useDeletePing();

    const canSendMessages =
        !selectedServerId || hasPermission('sendMessages') || isTimedOut;

    const selectedChannel = useMemo(
        () => channels?.find((c): boolean => c.id === selectedChannelId),
        [channels, selectedChannelId],
    );

    const memberMaps = useMemberMaps(members, roles);

    const {
        rawMessagesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isViewingOlderMessages,
    } = usePaginatedMessages(
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        targetMessageId,
    );

    const messages = useProcessedMessages(
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        memberMaps.serverMemberMap,
        memberMaps.highestRoleMap,
        memberMaps.iconRoleMap,
    );

    const { sendMessage, sendTyping, typingUsers } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined,
    );

    const canBypassSlowMode =
        !selectedServerId || hasPermission('bypassSlowmode');
    const { cooldown, setCooldown } = useSlowMode(
        selectedChannel,
        canBypassSlowMode,
    );

    return {
        friendUser,
        isFriendError,
        serverDetails,
        hasPermission,
        isOwner,
        pings,
        clearChannelPings,
        deletePing,
        canSendMessages,
        selectedChannel,
        memberMaps,
        messages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isViewingOlderMessages,
        sendMessage,
        sendTyping,
        typingUsers,
        canBypassSlowMode,
        cooldown,
        setCooldown,
    };
};
