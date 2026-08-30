import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { CopyFileOptions, CopyFileResult } from '@/console';
import { mergeReducer } from '@/utils/mergeReducer';

export interface CopyJob {
    fileName: string;
    from: string;
    to: string;
    progress: number;
    secondsRemaining: number;
}

interface CopyDialogState {
    job: CopyJob | null;
}

const TICK_MS = 80;
const MIN_DURATION_MS = 3500;
const MAX_DURATION_MS = 9000;
const MS_PER_CHAR = 1.2;

const durationFor = (size: number): number =>
    Math.min(
        MAX_DURATION_MS,
        Math.max(MIN_DURATION_MS, 500 + size * MS_PER_CHAR),
    );

const secondsRemainingFor = (remainingMs: number): number =>
    Math.max(1, Math.ceil(remainingMs / 1000));

export const useCopyDialog = (): {
    job: CopyJob | null;
    runCopy: (options: CopyFileOptions) => Promise<CopyFileResult>;
    cancel: () => void;
} => {
    const [state, patch] = useReducer(mergeReducer<CopyDialogState>, {
        job: null,
    });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resolveRef = useRef<((result: CopyFileResult) => void) | null>(null);

    const stop = useCallback((cancelled: boolean): void => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        patch({ job: null });
        resolveRef.current?.({ cancelled });
        resolveRef.current = null;
    }, []);

    useEffect((): (() => void) => (): void => stop(true), [stop]);

    const cancel = useCallback((): void => {
        stop(true);
    }, [stop]);

    const runCopy = useCallback(
        (options: CopyFileOptions): Promise<CopyFileResult> => {
            stop(true);
            const duration = durationFor(options.size);
            const startedAt = Date.now();

            patch({
                job: {
                    fileName: options.fileName,
                    from: options.from,
                    progress: 0,
                    secondsRemaining: secondsRemainingFor(duration),
                    to: options.to,
                },
            });

            return new Promise<CopyFileResult>((resolve): void => {
                resolveRef.current = resolve;
                intervalRef.current = setInterval((): void => {
                    const elapsed = Date.now() - startedAt;
                    const progress = Math.min(
                        100,
                        Math.round((elapsed / duration) * 100),
                    );
                    patch({
                        job: {
                            fileName: options.fileName,
                            from: options.from,
                            progress,
                            secondsRemaining: secondsRemainingFor(
                                duration - elapsed,
                            ),
                            to: options.to,
                        },
                    });
                    if (progress >= 100) stop(false);
                }, TICK_MS);
            });
        },
        [stop],
    );

    return { cancel, job: state.job, runCopy };
};
