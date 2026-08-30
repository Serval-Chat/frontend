import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCopyDialog } from '@/hooks/nt/useCopyDialog';

describe('useCopyDialog', (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('starts a job with zero progress and advances it over time', async (): Promise<void> => {
        const { result } = renderHook(() => useCopyDialog());
        expect(result.current.job).toBeNull();

        let pending!: Promise<{ cancelled: boolean }>;
        act((): void => {
            pending = result.current.runCopy({
                fileName: 'NOTES.TXT',
                from: 'Your Computer',
                to: 'C:\\NOTES.TXT',
                size: 500,
            });
        });

        expect(result.current.job).toEqual({
            fileName: 'NOTES.TXT',
            from: 'Your Computer',
            progress: 0,
            secondsRemaining: 4,
            to: 'C:\\NOTES.TXT',
        });

        await act(async (): Promise<void> => {
            await vi.advanceTimersByTimeAsync(100);
        });
        expect(result.current.job?.progress).toBeGreaterThan(0);
        expect(result.current.job?.progress).toBeLessThan(100);

        await act(async (): Promise<void> => {
            await vi.advanceTimersByTimeAsync(5000);
        });
        expect(result.current.job).toBeNull();
        await expect(pending).resolves.toEqual({ cancelled: false });
    });

    it('resolves as cancelled and clears the job when cancel is called mid-copy', async (): Promise<void> => {
        const { result } = renderHook(() => useCopyDialog());

        let pending!: Promise<{ cancelled: boolean }>;
        act((): void => {
            pending = result.current.runCopy({
                fileName: 'NOTES.TXT',
                from: 'Your Computer',
                to: 'C:\\NOTES.TXT',
                size: 5000,
            });
        });

        await act(async (): Promise<void> => {
            await vi.advanceTimersByTimeAsync(100);
        });
        expect(result.current.job).not.toBeNull();

        act((): void => {
            result.current.cancel();
        });

        expect(result.current.job).toBeNull();
        await expect(pending).resolves.toEqual({ cancelled: true });
    });

    it('cancels a running job when a new one starts before it finishes', async (): Promise<void> => {
        const { result } = renderHook(() => useCopyDialog());

        let first!: Promise<{ cancelled: boolean }>;
        act((): void => {
            first = result.current.runCopy({
                fileName: 'A.TXT',
                from: 'Your Computer',
                to: 'C:\\A.TXT',
                size: 5000,
            });
        });

        act((): void => {
            void result.current.runCopy({
                fileName: 'B.TXT',
                from: 'Your Computer',
                to: 'C:\\B.TXT',
                size: 5000,
            });
        });

        expect(result.current.job?.fileName).toBe('B.TXT');
        await expect(first).resolves.toEqual({ cancelled: true });
    });

    it('resolves any pending job as cancelled on unmount', async (): Promise<void> => {
        const { result, unmount } = renderHook(() => useCopyDialog());

        let pending!: Promise<{ cancelled: boolean }>;
        act((): void => {
            pending = result.current.runCopy({
                fileName: 'NOTES.TXT',
                from: 'Your Computer',
                to: 'C:\\NOTES.TXT',
                size: 5000,
            });
        });

        unmount();

        await expect(pending).resolves.toEqual({ cancelled: true });
    });
});
