import React, { useEffect, useState } from 'react';

import {
    LiveKitRoom,
    RoomAudioRenderer,
    VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';

import { serversApi } from '@/api/servers/servers.api';
import { ChatLoadingState } from '@/ui/components/chat/ChatLoadingState';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface VoiceRoomProps {
    serverId: string;
    channelId: string;
}

export const VoiceRoom: React.FC<VoiceRoomProps> = ({
    serverId,
    channelId,
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchToken = async (): Promise<void> => {
            try {
                const data = await serversApi.getVoiceToken(
                    serverId,
                    channelId,
                );
                if (mounted) {
                    setToken(data.token);
                    setServerUrl(data.url);
                }
            } catch (err: unknown) {
                if (mounted) {
                    const e = err as Error;
                    setError(
                        e.message || 'Failed to connect to voice channel.',
                    );
                }
            }
        };

        void fetchToken();

        return () => {
            mounted = false;
        };
    }, [serverId, channelId]);

    if (error) {
        return (
            <Box className="flex flex-1 items-center justify-center p-8">
                <Text className="text-destructive font-bold">{error}</Text>
            </Box>
        );
    }

    if (!token || !serverUrl) {
        return <ChatLoadingState />;
    }

    return (
        <Box className="flex flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
            <LiveKitRoom
                audio
                data-lk-theme="default"
                serverUrl={serverUrl}
                style={{ height: '100%', flex: 1, display: 'flex' }}
                token={token}
                video={false}
            >
                <VideoConference />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </Box>
    );
};
