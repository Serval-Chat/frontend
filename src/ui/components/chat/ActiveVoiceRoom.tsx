import type { FC } from 'react';
import { useEffect } from 'react';

import { useAppSelector } from '@/store/hooks';

export const ActiveVoiceRoom: FC = () => {
    const { activeVoiceServerId, activeVoiceChannelId } = useAppSelector(
        (state) => state.voice,
    );

    useEffect(() => {
        if (activeVoiceServerId && activeVoiceChannelId) {
            console.error(
                '[ActiveVoiceRoom] Attempted to connect to voice channel but LiveKit is removed',
                {
                    serverId: activeVoiceServerId,
                    channelId: activeVoiceChannelId,
                },
            );
        }
    }, [activeVoiceServerId, activeVoiceChannelId]);

    return null;
};
