import React, { useEffect, useState } from 'react';
import { useRef } from 'react';

import {
    LiveKitRoom,
    useLocalParticipant,
    useParticipants,
    useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { DeepFilterNoiseFilter } from 'deepfilternet3-noise-filter';
import { ConnectionQuality, Track } from 'livekit-client';

import { serversApi } from '@/api/servers/servers.api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    leaveVoiceRoom,
    setConnectionQuality,
    setSpeakingUsers,
} from '@/store/slices/voiceSlice';
import { wsMessages } from '@/ws';

const ParticipantStateSync: React.FC = () => {
    const { activeVoiceServerId, activeVoiceChannelId, isMuted, isDeafened } =
        useAppSelector((state) => state.voice);

    useEffect(() => {
        if (activeVoiceServerId && activeVoiceChannelId) {
            wsMessages.updateVoiceState(
                activeVoiceServerId,
                activeVoiceChannelId,
                isMuted,
                isDeafened,
            );
        }
    }, [isMuted, isDeafened, activeVoiceServerId, activeVoiceChannelId]);

    return null;
};

const ConnectionQualitySync: React.FC = () => {
    const { localParticipant } = useLocalParticipant();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const updateQuality = (): void => {
            let quality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';

            switch (localParticipant.connectionQuality) {
                case ConnectionQuality.Excellent:
                    quality = 'excellent';
                    break;
                case ConnectionQuality.Good:
                    quality = 'good';
                    break;
                case ConnectionQuality.Poor:
                    quality = 'poor';
                    break;
                case ConnectionQuality.Lost:
                case ConnectionQuality.Unknown:
                default:
                    quality = 'unknown';
            }

            dispatch(setConnectionQuality(quality));
        };

        const interval = setInterval(updateQuality, 2000);
        updateQuality();

        return () => clearInterval(interval);
    }, [localParticipant, dispatch]);

    return null;
};

const SpeakingStateSync: React.FC = () => {
    const participants = useParticipants();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const speakingUserIds = participants
            .filter((p) => p.isSpeaking)
            .map((p) => p.identity);
        dispatch(setSpeakingUsers(speakingUserIds));
    }, [participants, dispatch]);

    return null;
};

const NoiseFilterProcessor: React.FC = () => {
    const tracks = useTracks([Track.Source.Microphone]);
    const microphoneTrack = tracks.find(
        (t) => t.source === Track.Source.Microphone,
    );

    useEffect(() => {
        let processor: {
            destroy: () => void;
            setSuppressionLevel?: (level: number) => void;
        } | null = null;
        const currentTrack = microphoneTrack?.publication?.track;

        const setupProcessor = async (): Promise<void> => {
            if (!currentTrack || !('setProcessor' in currentTrack)) return;

            try {
                processor = DeepFilterNoiseFilter({
                    enabled: true,
                    sampleRate: 48000,
                    frameSize: 480,
                }) as unknown as {
                    destroy: () => void;
                    setSuppressionLevel?: (level: number) => void;
                };

                if (processor?.setSuppressionLevel) {
                    processor.setSuppressionLevel(75);
                }

                await (
                    currentTrack as {
                        setProcessor: (p: unknown) => Promise<void>;
                    }
                ).setProcessor(processor);
                console.warn(
                    'DeepFilterNet3 noise filter applied successfully to track:',
                    currentTrack.sid,
                );
            } catch (err) {
                console.error(
                    'Failed to apply DeepFilterNet3 noise filter:',
                    err,
                );
            }
        };

        void setupProcessor();

        return () => {
            if (processor && processor.destroy) {
                processor.destroy();
            }
        };
    }, [microphoneTrack?.publication?.track]);

    return null;
};

const RemoteTrackItem: React.FC<{
    trackRef: { publication?: { track?: Track } };
    volume: number;
}> = ({ trackRef, volume }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const track = trackRef.publication?.track;
        const currentAudioRef = audioRef.current;
        if (!track || !currentAudioRef) return;

        track.attach(currentAudioRef);

        try {
            if ('setVolume' in track) {
                (track as { setVolume: (v: number) => void }).setVolume(volume);
            }
        } catch (err) {
            console.warn('[RemoteTrackItem] Failed to set volume:', err);
        }

        return () => {
            if (currentAudioRef) {
                track.detach(currentAudioRef);
            }
        };
    }, [trackRef, volume]);

    return (
        <audio autoPlay ref={audioRef}>
            <track kind="captions" />
        </audio>
    );
};

const RemoteAudioRenderer: React.FC = () => {
    const { userVolumes, isDeafened } = useAppSelector((state) => state.voice);
    const trackReferences = useTracks([Track.Source.Microphone]);

    if (isDeafened) return null;

    return (
        <>
            {trackReferences.map((trackRef) => {
                const { participant, publication } = trackRef;
                if (participant.isLocal || !publication?.track) return null;

                const userId = participant.identity;
                const rawVolume = userVolumes[userId] ?? 1.0;
                const perceivedVolume = isNaN(rawVolume)
                    ? 1.0
                    : Math.max(0, Math.min(2, rawVolume));

                const volume = perceivedVolume * perceivedVolume;

                return (
                    <RemoteTrackItem
                        key={publication.trackSid}
                        trackRef={trackRef}
                        volume={volume}
                    />
                );
            })}
        </>
    );
};

export const ActiveVoiceRoom: React.FC = () => {
    const { activeVoiceServerId, activeVoiceChannelId, isMuted } =
        useAppSelector((state) => state.voice);
    const dispatch = useAppDispatch();

    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!activeVoiceServerId || !activeVoiceChannelId) {
            setTimeout(() => {
                setToken(null);
                setServerUrl(null);
            }, 0);
            return;
        }

        let mounted = true;

        const fetchToken = async (): Promise<void> => {
            try {
                const data = await serversApi.getVoiceToken(
                    activeVoiceServerId,
                    activeVoiceChannelId,
                );
                if (mounted) {
                    setToken(data.token);
                    setServerUrl(import.meta.env.VITE_LIVEKIT_URL || data.url);
                }
            } catch {
                if (mounted) {
                    dispatch(leaveVoiceRoom());
                }
            }
        };

        void fetchToken();

        return () => {
            mounted = false;
        };
    }, [activeVoiceServerId, activeVoiceChannelId, dispatch]);

    useEffect(() => {
        if (!activeVoiceServerId || !activeVoiceChannelId) return;

        wsMessages.joinVoice(activeVoiceServerId, activeVoiceChannelId);

        return () => {
            wsMessages.leaveVoice(activeVoiceServerId, activeVoiceChannelId);
        };
    }, [activeVoiceServerId, activeVoiceChannelId]);

    if (!token || !serverUrl) return null;

    return (
        <div style={{ display: 'none' }}>
            <LiveKitRoom
                audio={
                    isMuted
                        ? false
                        : {
                              echoCancellation: true,
                              noiseSuppression: true,
                              autoGainControl: true,
                          }
                }
                serverUrl={serverUrl}
                token={token}
                video={false}
                onDisconnected={() => {
                    dispatch(leaveVoiceRoom());
                }}
            >
                <SpeakingStateSync />
                <NoiseFilterProcessor />
                <ConnectionQualitySync />
                <RemoteAudioRenderer />
                <ParticipantStateSync />
            </LiveKitRoom>
        </div>
    );
};
