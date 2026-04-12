import React, { useEffect, useState } from 'react';

import {
    ControlBar,
    GridLayout,
    LiveKitRoom,
    ParticipantTile,
    RoomAudioRenderer,
    useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

import { serversApi } from '@/api/servers/servers.api';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { ChatLoadingState } from '@/ui/components/chat/ChatLoadingState';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface VoiceRoomProps {
    serverId: string;
    channelId: string;
}

const FilteredVoiceGrid: React.FC = () => {
    const blocks = useAppSelector((state) => state.blocking.blocks);
    const tracks = useTracks([
        { source: Track.Source.Camera, withPlaceholder: false },
        { source: Track.Source.ScreenShare, withPlaceholder: false },
        { source: Track.Source.Microphone, withPlaceholder: false },
    ]);

    const filteredTracks = tracks.filter((track) => {
        const userId = track.participant.identity;
        const userBlocks = blocks[userId] || 0;
        return !(userBlocks & BlockFlags.HIDE_VOICE_CHANNEL);
    });

    return (
        <Box className="relative flex flex-1 flex-col">
            <GridLayout tracks={filteredTracks}>
                <ParticipantTile />
            </GridLayout>
            <ControlBar variation="minimal" />
        </Box>
    );
};

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
                style={{
                    height: '100%',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                token={token}
                video={false}
            >
                <FilteredVoiceGrid />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </Box>
    );
};
