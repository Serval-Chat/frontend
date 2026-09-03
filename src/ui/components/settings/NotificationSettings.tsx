import React, { useRef, useState } from 'react';

import type { AxiosError } from 'axios';
import {
    Bell,
    Loader2,
    Music,
    Play,
    Plus,
    Shuffle,
    Square,
    Trash2,
    Volume2,
} from 'lucide-react';

import {
    useDeleteNotificationSound,
    useUpdateNotificationSound,
    useUploadNotificationSound,
} from '@/api/notificationSounds/notificationSounds.queries';
import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import type { UserSettings } from '@/api/users/users.types';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Slider } from '@/ui/components/common/Slider';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Toggle } from '@/ui/components/common/Toggle';
import { Box } from '@/ui/components/layout/Box';
import { useNotificationSoundManager } from '@/utils/audio/useNotificationSoundManager';
import { cacheSound, pruneSoundCache } from '@/utils/soundCache';

const VOLUME_SAVE_DEBOUNCE_MS = 300;
const TEST_SOUND_ID = '__test-random-sound__';

const NotificationSoundItem = ({
    sound,
    isEnabled,
    isPlaying,
    progress,
    volumePercent,
    onToggle,
    onPlay,
    onDelete,
    onVolumeChange,
}: {
    sound: { id: string; name: string; url: string };
    isEnabled: boolean;
    isPlaying: boolean;
    progress: number;
    volumePercent: number;
    onToggle: () => void;
    onPlay: () => void;
    onDelete: () => void;
    onVolumeChange: (volumePercent: number) => void;
}) => (
    <Box
        className={`flex flex-col gap-2 rounded-lg border p-3 transition-all ${
            isEnabled
                ? 'border-primary/50 bg-primary/5'
                : 'border-border-subtle bg-bg-subtle'
        }`}
    >
        <Box className="relative flex flex-1 items-center justify-between">
            {isPlaying ? (
                <div
                    className="absolute bottom-[-8px] left-[-12px] h-[2px] bg-primary"
                    style={{ width: `calc(${progress}% + 24px)` }}
                />
            ) : null}
            <Box className="flex items-center gap-3">
                <Toggle checked={isEnabled} onCheckedChange={onToggle} />
                <Music className="text-muted-foreground" size={16} />
                <Text size="sm" weight="medium">
                    {sound.name}
                </Text>
            </Box>
            <Box className="flex items-center gap-2">
                <IconButton
                    icon={isPlaying ? Square : Play}
                    size="sm"
                    variant="ghost"
                    onClick={onPlay}
                />
                <IconButton
                    className="text-danger hover:bg-danger/10"
                    icon={Trash2}
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                />
            </Box>
        </Box>
        <Box className="flex items-center justify-end gap-2 pl-1">
            <Volume2 className="shrink-0 text-muted-foreground" size={14} />
            <Box className="w-40">
                <Slider
                    aria-label={`${sound.name} volume`}
                    max={100}
                    min={0}
                    value={volumePercent}
                    onValueChange={onVolumeChange}
                />
            </Box>
            <Text className="w-8 shrink-0 text-right" size="xs" variant="muted">
                {volumePercent}%
            </Text>
        </Box>
    </Box>
);

export const NotificationSettings = () => {
    const { showToast } = useToast();
    const { data: user, isLoading } = useMe();
    const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();
    const { mutate: uploadSound, isPending: isUploading } =
        useUploadNotificationSound();
    const { mutate: deleteSound } = useDeleteNotificationSound();
    const { mutate: updateSound } = useUpdateNotificationSound();
    const { playingId, progress, manager } = useNotificationSoundManager();

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
    const [localVolume, setLocalVolume] = useState<number | null>(null);
    const [localEnabledMap, setLocalEnabledMap] = useState<
        Record<string, boolean>
    >({});
    const [localSoundVolumes, setLocalSoundVolumes] = useState<
        Record<string, number>
    >({});
    const volumeSaveTimersRef = useRef<Record<string, number>>({});
    const pendingVolumeFlushRef = useRef<Record<string, () => void>>({});

    React.useEffect(
        (): (() => void) => (): void => {
            manager.stop();
            for (const [id, timer] of Object.entries(
                volumeSaveTimersRef.current,
            )) {
                window.clearTimeout(timer);
                pendingVolumeFlushRef.current[id]?.();
            }
        },
        [manager],
    );

    const useDefault =
        localUseDefault === null
            ? user?.settings?.useDefaultSounds !== false
            : localUseDefault;
    const customSounds = user?.settings?.notificationSounds || [];

    const masterVolumePercent =
        localVolume ??
        Math.round((user?.settings?.notificationVolume ?? 1) * 100);
    const masterVolume = masterVolumePercent / 100;

    const isSoundEnabled = (id: string): boolean => {
        if (localEnabledMap[id] !== undefined) return localEnabledMap[id];
        const sound = customSounds.find((s): boolean => s.id === id);
        return sound ? sound.enabled : false;
    };

    const soundVolumePercent = (id: string): number => {
        if (localSoundVolumes[id] !== undefined) return localSoundVolumes[id];
        const sound = customSounds.find((s): boolean => s.id === id);
        return Math.round((sound?.volume ?? 1) * 100);
    };

    const hasChanges =
        localUseDefault !== null ||
        localVolume !== null ||
        Object.keys(localEnabledMap).length > 0;

    const handleSave = (): void => {
        const updatedSounds = customSounds.map(
            (
                s,
            ): {
                id: string;
                name: string;
                url: string;
                enabled: boolean;
            } => ({
                id: s.id,
                name: s.name,
                url: s.url,
                enabled: localEnabledMap[s.id] ?? s.enabled,
            }),
        );

        updateSettings(
            {
                useDefaultSounds: useDefault,
                notificationVolume: masterVolume,
                notificationSounds: updatedSounds,
            },
            {
                onSuccess: (): void => {
                    setLocalUseDefault(null);
                    setLocalVolume(null);
                    setLocalEnabledMap({});
                },
            },
        );
    };

    const handleReset = (): void => {
        setLocalUseDefault(null);
        setLocalVolume(null);
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

    const toggleSound = (id: string): void => {
        setLocalEnabledMap(
            (prev): Record<string, boolean> => ({
                ...prev,
                [id]: !isSoundEnabled(id),
            }),
        );
    };

    const handleSoundVolumeChange = (id: string, volumePercent: number): void => {
        setLocalSoundVolumes(
            (prev): Record<string, number> => ({ ...prev, [id]: volumePercent }),
        );

        const existingTimer = volumeSaveTimersRef.current[id];
        if (existingTimer) window.clearTimeout(existingTimer);

        const flush = (): void => {
            delete volumeSaveTimersRef.current[id];
            delete pendingVolumeFlushRef.current[id];
            updateSound(
                { id, volume: volumePercent / 100 },
                {
                    onError: (): void => {
                        setLocalSoundVolumes((prev): Record<string, number> => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                        });
                        showToast('Failed to save sound volume', 'error');
                    },
                },
            );
        };

        pendingVolumeFlushRef.current[id] = flush;
        volumeSaveTimersRef.current[id] = window.setTimeout(
            flush,
            VOLUME_SAVE_DEBOUNCE_MS,
        );
    };

    const handleTestRandomSound = (): void => {
        if (manager.isPlaying(TEST_SOUND_ID)) {
            manager.stop();
            return;
        }

        const effectiveSettings: UserSettings = {
            ...user?.settings,
            useDefaultSounds: useDefault,
            notificationVolume: masterVolume,
            notificationSounds: customSounds.map((s) => ({
                ...s,
                enabled: isSoundEnabled(s.id),
                volume: soundVolumePercent(s.id) / 100,
            })),
        };

        const choice = manager.pickRandom(effectiveSettings);
        if (!choice) {
            showToast('No notification sounds are enabled', 'error');
            return;
        }

        manager.play(
            TEST_SOUND_ID,
            choice.url,
            choice.normalizationGain,
            masterVolume,
            choice.soundVolume,
        );
    };

    if (isLoading) {
        return (
            <Box className="p-4">
                <Text>Loading...</Text>
            </Box>
        );
    }

    const isTestPlaying = playingId === TEST_SOUND_ID;

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
                    <Box className="mb-4 flex items-center justify-between">
                        <Heading level={4} variant="sub">
                            General Settings
                        </Heading>
                        <Button
                            retainSize
                            size="sm"
                            variant="ghost"
                            onClick={handleTestRandomSound}
                        >
                            {isTestPlaying ? (
                                <Square className="mr-2" size={16} />
                            ) : (
                                <Shuffle className="mr-2" size={16} />
                            )}
                            {isTestPlaying ? 'Stop' : 'Test Random Sound'}
                        </Button>
                    </Box>
                    <Box className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                        <Box className="flex items-center justify-between">
                            <Box className="flex items-center gap-3">
                                <Bell
                                    className="text-muted-foreground"
                                    size={20}
                                />
                                <Box>
                                    <Text weight="bold">
                                        Use Default Sounds
                                    </Text>
                                    <br />
                                    <Text size="xs" variant="muted">
                                        Include the original Serchat sounds in
                                        the randomization pool.
                                    </Text>
                                </Box>
                            </Box>
                            <Toggle
                                checked={useDefault}
                                onCheckedChange={setLocalUseDefault}
                            />
                        </Box>
                        <Box className="flex items-center justify-between">
                            <Box className="flex items-center gap-3">
                                <Volume2
                                    className="text-muted-foreground"
                                    size={20}
                                />
                                <Text weight="bold">Notification Volume</Text>
                            </Box>
                            <Box className="flex w-40 items-center gap-2">
                                <Slider
                                    aria-label="Notification volume"
                                    max={100}
                                    min={0}
                                    value={masterVolumePercent}
                                    onValueChange={setLocalVolume}
                                />
                                <Text
                                    className="w-8 shrink-0 text-right"
                                    size="xs"
                                    variant="muted"
                                >
                                    {masterVolumePercent}%
                                </Text>
                            </Box>
                        </Box>
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
                                <NotificationSoundItem
                                    isEnabled={isSoundEnabled(sound.id)}
                                    isPlaying={playingId === sound.id}
                                    key={sound.id}
                                    progress={progress}
                                    sound={sound}
                                    volumePercent={soundVolumePercent(sound.id)}
                                    onDelete={(): void => {
                                        deleteSound(sound.id);
                                    }}
                                    onPlay={(): void => {
                                        manager.toggle(
                                            sound.id,
                                            sound.url,
                                            sound.normalizationGain ?? 1,
                                            masterVolume,
                                            soundVolumePercent(sound.id) / 100,
                                        );
                                    }}
                                    onToggle={(): void => {
                                        toggleSound(sound.id);
                                    }}
                                    onVolumeChange={(volumePercent): void => {
                                        handleSoundVolumeChange(
                                            sound.id,
                                            volumePercent,
                                        );
                                    }}
                                />
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
