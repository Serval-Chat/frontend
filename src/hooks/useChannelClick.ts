import React, { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { useAppDispatch } from '@/store/hooks';
import { addVoiceParticipant, joinVoiceRoom } from '@/store/slices/voiceSlice';

interface UseChannelClickArgs {
    activeItemId: string | null;
    isReordering: boolean;
    syncLock: boolean;
    selectedServerId: string | null;
    onSelectLinkChannel: (channel: Channel) => void;
}

/**
 * handles clicking a channel row: joining voice, opening/confirming link
 * channels, or navigating to a text channel. No-ops while a drag/reorder is in
 * flight so an accidental click during reordering doesn't navigate away.
 */
export const useChannelClick = ({
    activeItemId,
    isReordering,
    syncLock,
    selectedServerId,
    onSelectLinkChannel,
}: UseChannelClickArgs): ((channel: Channel) => void) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { data: me } = useMe();

    return useCallback(
        (channel: Channel): void => {
            if (activeItemId || isReordering || syncLock) return;

            if (channel.type === 'voice') {
                if (selectedServerId) {
                    dispatch(
                        joinVoiceRoom({
                            serverId: selectedServerId,
                            channelId: channel.id,
                        }),
                    );

                    if (me?.id) {
                        dispatch(
                            addVoiceParticipant({
                                channelId: channel.id,
                                userId: me.id,
                            }),
                        );
                    }
                }
                return;
            }

            if (channel.type === 'link') {
                const url = channel.link || '#';
                try {
                    const parsed = new URL(url);
                    if (
                        parsed.hostname === 'catfla.re' ||
                        parsed.hostname.endsWith('.catfla.re')
                    ) {
                        if (parsed.pathname.startsWith('/chat/@setting')) {
                            void navigate(parsed.pathname);
                            return;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                        return;
                    }
                } catch {
                    // ignore
                }
                onSelectLinkChannel(channel);
                return;
            }

            if (selectedServerId) {
                React.startTransition((): void => {
                    void navigate(
                        `/chat/@server/${selectedServerId}/channel/${channel.id}`,
                    );
                });
            }
        },
        [
            activeItemId,
            isReordering,
            syncLock,
            selectedServerId,
            dispatch,
            me,
            navigate,
            onSelectLinkChannel,
        ],
    );
};
