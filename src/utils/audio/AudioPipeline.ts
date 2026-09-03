import { linearToPerceptualGain } from '@/utils/audio/perceptualVolume';

const MAX_COMBINED_GAIN = 1.5;

export interface PlaybackCallbacks {
    onEnded?: () => void;
    onProgress?: (percent: number) => void;
}

export interface PlaybackHandle {
    stop: () => void;
}

export class AudioPipeline {
    private ctx: AudioContext | null = null;
    private readonly buffers = new Map<string, AudioBuffer>();

    private getContext(): AudioContext | null {
        if (typeof AudioContext === 'undefined') return null;
        this.ctx ??= new AudioContext();
        return this.ctx;
    }

    unlock(): void {
        const context = this.getContext();
        if (context?.state === 'suspended') void context.resume();
    }

    play(
        url: string,
        normalizationGain: number,
        masterVolume: number,
        soundVolume: number,
        callbacks: PlaybackCallbacks = {},
    ): PlaybackHandle {
        let stopped = false;
        let source: AudioBufferSourceNode | null = null;
        let progressFrame: number | null = null;

        const stopProgressLoop = (): void => {
            if (progressFrame !== null) {
                cancelAnimationFrame(progressFrame);
                progressFrame = null;
            }
        };

        void (async (): Promise<void> => {
            const context = this.getContext();
            if (!context) {
                callbacks.onEnded?.();
                return;
            }

            if (context.state === 'suspended') {
                try {
                    await context.resume();
                } catch {
                    callbacks.onEnded?.();
                    return;
                }
            }

            try {
                let buffer = this.buffers.get(url);
                if (!buffer) {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    buffer = await context.decodeAudioData(arrayBuffer);
                    this.buffers.set(url, buffer);
                }

                if (stopped) return;

                const newSource = context.createBufferSource();
                newSource.buffer = buffer;

                const equalizerGain = context.createGain();
                const masterGain = context.createGain();
                const soundGain = context.createGain();

                const masterGainValue = linearToPerceptualGain(masterVolume);
                const soundGainValue = linearToPerceptualGain(soundVolume);
                const rawCombined =
                    normalizationGain * masterGainValue * soundGainValue;
                const limiterScale =
                    rawCombined > MAX_COMBINED_GAIN
                        ? MAX_COMBINED_GAIN / rawCombined
                        : 1;

                equalizerGain.gain.value = normalizationGain;
                masterGain.gain.value = masterGainValue;
                soundGain.gain.value = soundGainValue * limiterScale;

                newSource.connect(equalizerGain);
                equalizerGain.connect(masterGain);
                masterGain.connect(soundGain);
                soundGain.connect(context.destination);

                newSource.onended = (): void => {
                    source = null;
                    stopProgressLoop();
                    callbacks.onEnded?.();
                };

                const startTime = context.currentTime;
                const duration = buffer.duration;

                source = newSource;
                newSource.start(0);

                if (callbacks.onProgress && duration > 0) {
                    const tick = (): void => {
                        if (!source) return;
                        const elapsed = context.currentTime - startTime;
                        callbacks.onProgress?.(
                            Math.min(100, (elapsed / duration) * 100),
                        );
                        progressFrame = requestAnimationFrame(tick);
                    };
                    progressFrame = requestAnimationFrame(tick);
                }
            } catch {
                callbacks.onEnded?.();
            }
        })();

        return {
            stop: (): void => {
                stopped = true;
                stopProgressLoop();
                try {
                    source?.stop();
                } catch {
                    // ignore
                }
                source = null;
            },
        };
    }
}

export const audioPipeline = new AudioPipeline();
