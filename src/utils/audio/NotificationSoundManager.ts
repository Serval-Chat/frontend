import type { UserSettings } from '@/api/users/users.types';
import { audioPipeline, type AudioPipeline, type PlaybackHandle } from '@/utils/audio/AudioPipeline';
import {
    DEFAULT_SOUND_COUNT,
    getDefaultSoundNormalizationGain,
    getDefaultSoundUrl,
} from '@/utils/audio/defaultNotificationSounds';

export interface SoundChoice {
    url: string;
    normalizationGain: number;
    soundVolume: number;
}

export interface NotificationSoundManagerState {
    playingId: string | null;
    progress: number;
}

type Listener = (state: NotificationSoundManagerState) => void;

const emptyState: NotificationSoundManagerState = {
    playingId: null,
    progress: 0,
};

export class NotificationSoundManager {
    private readonly pipeline: AudioPipeline;
    private state: NotificationSoundManagerState = emptyState;
    private readonly listeners = new Set<Listener>();
    private handle: PlaybackHandle | null = null;

    constructor(pipeline: AudioPipeline) {
        this.pipeline = pipeline;
    }

    private pickRandomDefault(): SoundChoice {
        const index = Math.floor(Math.random() * DEFAULT_SOUND_COUNT) + 1;
        return {
            url: getDefaultSoundUrl(index),
            normalizationGain: getDefaultSoundNormalizationGain(index),
            soundVolume: 1,
        };
    }

    pickRandom(settings: UserSettings | undefined): SoundChoice | null {
        const customSounds = settings?.notificationSounds ?? [];
        const enabledCustomSounds = customSounds.filter(
            (s): boolean => s.enabled,
        );
        const useDefault = settings?.useDefaultSounds !== false;

        if (enabledCustomSounds.length > 0) {
            const randomIndex = Math.floor(
                Math.random() *
                    (enabledCustomSounds.length + (useDefault ? 1 : 0)),
            );
            if (randomIndex < enabledCustomSounds.length) {
                const sound = enabledCustomSounds[randomIndex]!;
                return {
                    url: sound.url,
                    normalizationGain: sound.normalizationGain ?? 1,
                    soundVolume: sound.volume ?? 1,
                };
            }
            return this.pickRandomDefault();
        }

        if (useDefault) return this.pickRandomDefault();

        return null;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return (): void => {
            this.listeners.delete(listener);
        };
    }

    getState(): NotificationSoundManagerState {
        return this.state;
    }

    isPlaying(id: string): boolean {
        return this.state.playingId === id;
    }

    private setState(patch: Partial<NotificationSoundManagerState>): void {
        this.state = { ...this.state, ...patch };
        for (const listener of this.listeners) listener(this.state);
    }

    stop(): void {
        this.handle?.stop();
        this.handle = null;
        this.setState(emptyState);
    }

    play(
        id: string,
        url: string,
        normalizationGain: number,
        masterVolume: number,
        soundVolume: number,
    ): void {
        this.stop();
        this.setState({ playingId: id, progress: 0 });

        this.handle = this.pipeline.play(
            url,
            normalizationGain,
            masterVolume,
            soundVolume,
            {
                onProgress: (percent): void => {
                    if (this.state.playingId !== id) return;
                    this.setState({ progress: percent });
                },
                onEnded: (): void => {
                    if (this.state.playingId !== id) return;
                    this.handle = null;
                    this.setState(emptyState);
                },
            },
        );
    }

    toggle(
        id: string,
        url: string,
        normalizationGain: number,
        masterVolume: number,
        soundVolume: number,
    ): void {
        if (this.isPlaying(id)) {
            this.stop();
            return;
        }
        this.play(id, url, normalizationGain, masterVolume, soundVolume);
    }
}

export const notificationSoundManager = new NotificationSoundManager(
    audioPipeline,
);
