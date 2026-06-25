import React, { useRef, useState } from 'react';

import { type AxiosError } from 'axios';
import { Bell, Loader2, Music, Play, Plus, Square, Trash2 } from 'lucide-react';

import {
    useDeleteNotificationSound,
    useUploadNotificationSound,
} from '@/api/notificationSounds/notificationSounds.queries';
import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Toggle } from '@/ui/components/common/Toggle';
import { Box } from '@/ui/components/layout/Box';
import { cacheSound, pruneSoundCache } from '@/utils/soundCache';

export const NotificationSettings = () => {
    const { showToast } = useToast();
    const { data: user, isLoading } = useMe();
    const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();
    const { mutate: uploadSound, isPending: isUploading } =
        useUploadNotificationSound();
    const { mutate: deleteSound } = useDeleteNotificationSound();

    React.useEffect((): void => {
        if (!user?.settings?.notificationSounds) return;
        const urls = user.settings.notificationSounds.map((s): string => s.url);
        void pruneSoundCache(urls);
        for (const url of urls) {
            void cacheSound(url);
        }
    }, [user?.settings?.notificationSounds]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localUseDefault, setLocalUseDefault] = useState<boolean | null>(
        null,
    );
    const [localEnabledMap, setLocalEnabledMap] = useState<
        Record<string, boolean>
    >({});
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const updateProgress = (): void => {
        if (audioRef.current && !audioRef.current.paused) {
            if (audioRef.current.duration) {
                setProgress(
                    (audioRef.current.currentTime / audioRef.current.duration) *
                        100,
                );
            }
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    };

    React.useEffect(
        (): (() => void) => (): void => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        },
        [],
    );

    const useDefault =
        localUseDefault !== null
            ? localUseDefault
            : user?.settings?.useDefaultSounds !== false;
    const customSounds = user?.settings?.notificationSounds || [];

    const isSoundEnabled = (id: string): boolean => {
        if (localEnabledMap[id] !== undefined) return localEnabledMap[id];
        const sound = customSounds.find((s): boolean => s.id === id);
        return sound ? sound.enabled : false;
    };

    const hasChanges =
        localUseDefault !== null || Object.keys(localEnabledMap).length > 0;

    const handleSave = (): void => {
        const updatedSounds = customSounds.map(
            (
                s,
            ): { id: string; name: string; url: string; enabled: boolean } => ({
                id: s.id,
                name: s.name,
                url: s.url,
                enabled:
                    localEnabledMap[s.id] !== undefined
                        ? localEnabledMap[s.id]
                        : s.enabled,
            }),
        );

        updateSettings(
            {
                useDefaultSounds: useDefault,
                notificationSounds: updatedSounds,
            },
            {
                onSuccess: (): void => {
                    setLocalUseDefault(null);
                    setLocalEnabledMap({});
                },
            },
        );
    };

    const handleReset = (): void => {
        setLocalUseDefault(null);
        setLocalEnabledMap({});
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            uploadSound(file, {
                onSuccess: (): void => {
                    showToast('Sound uploaded successfully!', 'success');
                },
                onError: (error: Error): void => {
                    const axiosError = error as AxiosError<{
                        message?: string;
                    }>;
                    showToast(
                        axiosError.response?.data?.message ||
                            'Failed to upload sound',
                        'error',
                    );
                },
            });
        }
    };

    const playPreview = (id: string, url: string): void => {
        if (audioRef.current && playingId === id) {
            audioRef.current.pause();
            if (animationFrameRef.current)
                cancelAnimationFrame(animationFrameRef.current);
            setPlayingId(null);
            setProgress(0);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            if (animationFrameRef.current)
                cancelAnimationFrame(animationFrameRef.current);
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingId(id);
        setProgress(0);

        audio.onplay = (): void => {
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        };

        audio.onended = (): void => {
            if (animationFrameRef.current)
                cancelAnimationFrame(animationFrameRef.current);
            setPlayingId(null);
            setProgress(0);
        };

        void audio.play().catch((): void => {
            setPlayingId(null);
        });
    };

    const toggleSound = (id: string): void => {
        setLocalEnabledMap((prev): { [x: string]: boolean } => ({
            ...prev,
            [id]: !isSoundEnabled(id),
        }));
    };

    if (isLoading) {
        return (
            <Box className="p-4">
                <Text>Loading...</Text>
            </Box>
        );
    }

    return (
        <Box className="flex flex-col gap-8 pb-24">
            <Box>
                <Heading level={3}>Notifications</Heading>
                <Text variant="muted">
                    Manage your custom notification sounds. Enable multiple to
                    randomize between them.
                </Text>
            </Box>

            <Box className="space-y-6">
                <Box>
                    <Heading className="mb-4" level={4} variant="sub">
                        General Settings
                    </Heading>
                    <Box className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-subtle p-4">
                        <Box className="flex items-center gap-3">
                            <Bell className="text-muted-foreground" size={20} />
                            <Box>
                                <Text weight="bold">Use Default Sounds</Text>
                                <br />
                                <Text size="xs" variant="muted">
                                    Include the original Serchat sounds in the
                                    randomization pool.
                                </Text>
                            </Box>
                        </Box>
                        <Toggle
                            checked={useDefault}
                            onCheckedChange={setLocalUseDefault}
                        />
                    </Box>
                </Box>

                <Box>
                    <Box className="mb-4 flex items-center justify-between">
                        <Heading level={4} variant="sub">
                            Custom Sounds ({customSounds.length}/10)
                        </Heading>
                        <Button
                            disabled={customSounds.length >= 10 || isUploading}
                            size="sm"
                            variant="primary"
                            onClick={(): void | undefined =>
                                fileInputRef.current?.click()
                            }
                        >
                            {isUploading ? (
                                <Loader2
                                    className="mr-2 animate-spin"
                                    size={16}
                                />
                            ) : (
                                <Plus className="mr-2" size={16} />
                            )}
                            {isUploading ? 'Uploading...' : 'Upload Sound'}
                        </Button>
                        <input
                            accept="audio/*"
                            aria-label="Upload notification sound"
                            className="hidden"
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                        />
                    </Box>

                    <Box className="space-y-2">
                        {customSounds.length === 0 ? (
                            <Box className="rounded-lg border border-dashed border-border-subtle p-8 text-center">
                                <Text variant="muted">
                                    No custom sounds uploaded yet.
                                </Text>
                            </Box>
                        ) : (
                            customSounds.map((sound) => (
                                <Box
                                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                                        isSoundEnabled(sound.id)
                                            ? 'border-primary/50 bg-primary/5'
                                            : 'border-border-subtle bg-bg-subtle'
                                    }`}
                                    key={sound.id}
                                >
                                    <Box className="relative flex flex-1 items-center justify-between">
                                        {playingId === sound.id && (
                                            <div
                                                className="absolute bottom-[-12px] left-[-12px] h-[2px] bg-primary"
                                                style={{
                                                    width: `calc(${progress}% + 24px)`,
                                                }}
                                            />
                                        )}
                                        <Box className="flex items-center gap-3">
                                            <Toggle
                                                checked={isSoundEnabled(
                                                    sound.id,
                                                )}
                                                onCheckedChange={(): void =>
                                                    toggleSound(sound.id)
                                                }
                                            />
                                            <Music
                                                className="text-muted-foreground"
                                                size={16}
                                            />
                                            <Text size="sm" weight="medium">
                                                {sound.name}
                                            </Text>
                                        </Box>
                                        <Box className="flex items-center gap-2">
                                            <IconButton
                                                icon={
                                                    playingId === sound.id
                                                        ? Square
                                                        : Play
                                                }
                                                size="sm"
                                                variant="ghost"
                                                onClick={(): void =>
                                                    playPreview(
                                                        sound.id,
                                                        sound.url,
                                                    )
                                                }
                                            />
                                            <IconButton
                                                className="text-danger hover:bg-danger/10"
                                                icon={Trash2}
                                                size="sm"
                                                variant="ghost"
                                                onClick={(): void =>
                                                    deleteSound(sound.id)
                                                }
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            <SettingsFloatingBar
                isPending={isSaving}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />
        </Box>
    );
};
