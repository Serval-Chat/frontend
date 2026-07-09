import { useCallback, useEffect } from 'react';

import type { NavigateFunction } from 'react-router-dom';

import type { usePings } from '@/api/pings/pings.queries';
import type { useAppDispatch } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { wsMessages } from '@/ws';

interface UseChatConversationActionsArgs {
    dispatch: ReturnType<typeof useAppDispatch>;
    navigate: NavigateFunction;
    selectedFriendId: string | null;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    isFriendError: boolean;
    pings: ReturnType<typeof usePings>['data'];
    clearChannelPings: (channelId: string) => void;
    deletePing: (pingId: string) => void;
    messages: ProcessedChatMessage[];
}

/**
 * owns the navigation callbacks (jump-to-latest, navigate/reply to a message)
 * and the side effects that keep a conversation in sync: redirecting away from
 * a broken DM and marking the active channel/DM read (clearing its pings).
 */
export const useChatConversationActions = ({
    dispatch,
    navigate,
    selectedFriendId,
    selectedServerId,
    selectedChannelId,
    isFriendError,
    pings,
    clearChannelPings,
    deletePing,
    messages,
}: UseChatConversationActionsArgs) => {
    const handleJumpToLatest = useCallback((): void => {
        dispatch(setTargetMessageId(null));
        if (selectedServerId && selectedChannelId) {
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${selectedChannelId}`,
            );
        } else if (selectedFriendId) {
            void navigate(`/chat/@user/${selectedFriendId}`);
        }
    }, [
        dispatch,
        selectedServerId,
        selectedChannelId,
        selectedFriendId,
        navigate,
    ]);

    const handleNavigateToMessage = useCallback(
        (messageId: string): void => {
            dispatch(setTargetMessageId(messageId));
            if (selectedServerId && selectedChannelId) {
                void navigate(
                    `/chat/@server/${selectedServerId}/channel/${selectedChannelId}/message/${messageId}`,
                );
            } else if (selectedFriendId) {
                void navigate(
                    `/chat/@user/${selectedFriendId}/message/${messageId}`,
                );
            }
        },
        [
            dispatch,
            navigate,
            selectedServerId,
            selectedChannelId,
            selectedFriendId,
        ],
    );

    const handleReplyClick = useCallback(
        (messageId: string): void => {
            if (selectedServerId && selectedChannelId) {
                void navigate(
                    `/chat/@server/${selectedServerId}/channel/${selectedChannelId}/message/${messageId}`,
                );
            } else if (selectedFriendId) {
                void navigate(
                    `/chat/@user/${selectedFriendId}/message/${messageId}`,
                );
            }
        },
        [navigate, selectedServerId, selectedChannelId, selectedFriendId],
    );

    useEffect((): void => {
        if (isFriendError && selectedFriendId) {
            void navigate('/chat/@me', { replace: true });
        }
    }, [isFriendError, selectedFriendId, navigate]);

    useEffect((): void => {
        if (selectedServerId && selectedChannelId) {
            wsMessages.markChannelRead(selectedServerId, selectedChannelId);

            if (pings?.pings) {
                const hasPingsInActiveChannel = pings.pings.some(
                    (p): boolean => p.channelId === selectedChannelId,
                );
                if (hasPingsInActiveChannel) {
                    clearChannelPings(selectedChannelId);
                }
            }
        } else if (selectedFriendId) {
            wsMessages.markDmRead(selectedFriendId);
            if (pings?.pings) {
                const friendPings = pings.pings.filter(
                    (p): boolean =>
                        p.senderId === selectedFriendId && !p.serverId,
                );
                if (friendPings.length > 0) {
                    for (const p of friendPings) deletePing(p.id);
                }
            }
        }
    }, [
        selectedChannelId,
        selectedServerId,
        selectedFriendId,
        clearChannelPings,
        deletePing,
        messages,
        pings?.pings,
    ]);

    return { handleJumpToLatest, handleNavigateToMessage, handleReplyClick };
};
