import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import {
    useClearChannelPings,
    useDeletePing,
    usePings,
} from '@/api/pings/pings.queries';
import {
    useCategories,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { MessagePermissionFlags } from '@/features/chat/Message/Message.types';
import { useChatWS } from '@/features/chat/hooks/useChatWS';
import { useMemberMaps } from '@/features/chat/hooks/useMemberMaps';
import { usePaginatedMessages } from '@/features/chat/hooks/usePaginatedMessages';
import { useProcessedMessages } from '@/features/chat/hooks/useProcessedMessages';
import { useSlowMode } from '@/features/chat/hooks/useSlowMode';
import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';
import { usePermissions } from '@/hooks/usePermissions';

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
    const { data: categories } = useCategories(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: members } = useMembers(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: roles } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { permissions, hasPermission, isOwner, isTimedOut } = usePermissions(
        selectedServerId,
        selectedChannelId,
        { enabled: isServerContextReady },
    );
    const messagePermissions = useMemo(
        (): MessagePermissionFlags => ({
            administrator: permissions.administrator,
            manageMessages: permissions.manageMessages,
            deleteMessagesOfOthers: permissions.deleteMessagesOfOthers,
            pinMessages: permissions.pinMessages,
            banMembers: permissions.banMembers,
            kickMembers: permissions.kickMembers,
            moderateMembers: permissions.moderateMembers,
            manageRoles: permissions.manageRoles,
            manageReactions: permissions.manageReactions,
        }),
        [
            permissions.administrator,
            permissions.manageMessages,
            permissions.deleteMessagesOfOthers,
            permissions.pinMessages,
            permissions.banMembers,
            permissions.kickMembers,
            permissions.moderateMembers,
            permissions.manageRoles,
            permissions.manageReactions,
        ],
    );
    const { quickReactions } = useFrequentlyUsedEmojis();
    const { data: pings } = usePings();
    const { mutate: clearChannelPings } = useClearChannelPings();
    const { mutate: deletePing } = useDeletePing();

    const canSendMessages =
        !selectedServerId || hasPermission('sendMessages') || isTimedOut;

    const selectedChannel = useMemo(
        () => channels?.find((c): boolean => c.id === selectedChannelId),
        [channels, selectedChannelId],
    );
    const messageChannelData = useMemo(
        () => ({ channels, categories }),
        [channels, categories],
    );

    const memberMaps = useMemberMaps(members, roles);

    const {
        rawMessagesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        fetchNewerMessages,
        isFetchingNewerMessages,
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
        serverDetails?.deletedMessageRetentionMinutes,
    );

    const {
        sendMessage,
        sendTyping,
        typingUsers,
        retryMessage,
        discardMessage,
    } = useChatWS(
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
        messagePermissions,
        quickReactions,
        isOwner,
        pings,
        clearChannelPings,
        deletePing,
        canSendMessages,
        selectedChannel,
        messageChannelData,
        memberMaps,
        messages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        fetchNewerMessages,
        isFetchingNewerMessages,
        isViewingOlderMessages,
        sendMessage,
        sendTyping,
        typingUsers,
        retryMessage,
        discardMessage,
        canBypassSlowMode,
        cooldown,
        setCooldown,
    };
};
