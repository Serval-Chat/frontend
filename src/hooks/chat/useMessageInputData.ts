import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import {
    useChannelMessages,
    useEditChannelMessage,
    useEditUserMessage,
    useUserMessages,
} from '@/api/chat/chat.queries';
import { useFriends } from '@/api/friends/friends.queries';
import { useServerCommands } from '@/api/interactions/interactions.queries';
import {
    useAllStickers,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
    useServerStickers,
    useServers,
} from '@/api/servers/servers.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import type { StickerCategory } from '@/ui/components/emoji/StickerPicker';

interface UseMessageInputDataArgs {
    selectedFriendId: string | null;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    me: User | undefined;
    showStickerPicker: boolean;
}

/**
 * aggregates every data source the composer needs (server members/roles/
 * channels, commands, stickers, custom emojis, recent messages) plus the
 * derived collections built from them. Extracted from MessageInput so the
 * component only wires state to the view.
 */
export const useMessageInputData = ({
    selectedFriendId,
    selectedServerId,
    selectedChannelId,
    me,
    showStickerPicker,
}: UseMessageInputDataArgs) => {
    const location = useLocation();
    const { customCategories } = useCustomEmojis({ enabled: true });

    const isServerRoute = location.pathname.includes('/@server/');
    const serverIdFromUrl = location.pathname
        .split('/@server/')[1]
        ?.split('/')[0];
    const isServerContextReady =
        !!selectedServerId &&
        isServerRoute &&
        selectedServerId === serverIdFromUrl;

    const { data: friendsList = [] } = useFriends();
    const { data: members = [] } = useMembers(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: roles = [] } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: channels = [] } = useChannels(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: serverDetails } = useServerDetails(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: serverCommands = [] } = useServerCommands(
        isServerContextReady ? selectedServerId : null,
    );
    const { data: serverList = [] } = useServers();
    const { data: currentServerStickers = [] } = useServerStickers(
        isServerContextReady ? selectedServerId : null,
    );
    const { data: allStickers = [] } = useAllStickers({
        enabled: showStickerPicker,
    });

    const myMember = useMemo(
        () => members.find((m): boolean => m.userId === me?.id),
        [members, me?.id],
    );

    const { data: channelMessages } = useChannelMessages(
        selectedServerId,
        selectedChannelId,
    );
    const { data: userMessages } = useUserMessages(selectedFriendId);
    const editChannelMessage = useEditChannelMessage();
    const editUserMessage = useEditUserMessage();

    const friendUsers = useMemo(
        (): User[] => friendsList as unknown as User[],
        [friendsList],
    );

    const currentChannel = useMemo(
        () => channels.find((c): boolean => c.id === selectedChannelId),
        [channels, selectedChannelId],
    );

    const allServerEmojis = useMemo(
        () =>
            customCategories.flatMap((cat) =>
                cat.emojis.map((e) => ({
                    id: e.id,
                    name: e.name,
                    imageUrl: e.url,
                    serverId: cat.id,
                    createdBy: '',
                    createdAt: '',
                })),
            ),
        [customCategories],
    );

    const stickerCategories = useMemo((): StickerCategory[] => {
        const cats: StickerCategory[] = [];

        if (isServerContextReady && serverDetails) {
            cats.push({
                id: serverDetails.id,
                name: serverDetails.name,
                icon: serverDetails.icon,
                stickers: currentServerStickers,
            });
        }

        const stickersByServer = new Map<string, typeof allStickers>();
        for (const sticker of allStickers) {
            if (selectedServerId && sticker.serverId === selectedServerId) {
                continue;
            }
            const group = stickersByServer.get(sticker.serverId);
            if (group) {
                group.push(sticker);
            } else {
                stickersByServer.set(sticker.serverId, [sticker]);
            }
        }

        for (const [sid, serverStickers] of stickersByServer.entries()) {
            if (serverStickers.length > 0) {
                const serverInfo = serverList.find(
                    (s): boolean => s.id === sid,
                );
                cats.push({
                    id: sid,
                    name: serverInfo?.name || 'Other Server',
                    icon: serverInfo?.icon,
                    stickers: serverStickers,
                });
            }
        }

        return cats;
    }, [
        isServerContextReady,
        serverDetails,
        currentServerStickers,
        allStickers,
        selectedServerId,
        serverList,
    ]);

    const findLastMyMessage = useMemo(() => {
        if (!me?.id) return null;

        const pages =
            selectedServerId && selectedChannelId
                ? channelMessages?.pages
                : selectedFriendId
                  ? userMessages?.pages
                  : undefined;

        if (!pages) return null;

        let latest: (typeof pages)[0][0] | null = null;
        for (const page of pages) {
            for (const msg of page) {
                if (
                    msg.senderId === me.id &&
                    msg.text &&
                    msg.text.trim() !== '' &&
                    (!latest || msg.createdAt > latest.createdAt)
                ) {
                    latest = msg;
                }
            }
        }

        return latest;
    }, [
        me,
        selectedServerId,
        selectedChannelId,
        selectedFriendId,
        channelMessages,
        userMessages,
    ]);

    return {
        isServerContextReady,
        isServerRoute,
        members,
        roles,
        channels,
        serverDetails,
        serverCommands,
        myMember,
        friendUsers,
        currentChannel,
        allServerEmojis,
        stickerCategories,
        customCategories,
        findLastMyMessage,
        editChannelMessage,
        editUserMessage,
    };
};
