import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { startWcagProfiler as StartWcagProfilerFn } from './index';

const startSpy = vi.fn();
const stopSpy = vi.fn();
const forceScanSpy = vi.fn();
const resetSpy = vi.fn();

vi.mock('./scheduler', () => ({
    ScanScheduler: class {
        start = startSpy;
        stop = stopSpy;
        forceScan = forceScanSpy;
        notifyScanComplete = vi.fn();
    },
}));
vi.mock('./reporter', () => ({
    Reporter: class {
        report = vi.fn();
        reset = resetSpy;
    },
}));
vi.mock('./scanner', () => ({
    scanDocument: vi.fn(async () => ({
        status: 'ok',
        durationMs: 1,
        results: { violations: [] },
    })),
}));

const importFresh = async (): Promise<{
    startWcagProfiler: typeof StartWcagProfilerFn;
}> => {
    vi.resetModules();
    return import('./index');
};

describe('startWcagProfiler', (): void => {
    beforeEach((): void => {
        startSpy.mockClear();
        stopSpy.mockClear();
        forceScanSpy.mockClear();
        resetSpy.mockClear();
        localStorage.clear();
        delete window.__wcag;
    });

    afterEach((): void => {
        delete window.__wcag;
    });

    it('does not start or attach a window handle when DEV is false', async (): Promise<void> => {
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: false });
        expect(startSpy).not.toHaveBeenCalled();
        expect(window.__wcag).toBeUndefined();
    });

    it('starts the scheduler and installs the console handle when DEV', async (): Promise<void> => {
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: true });
        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(window.__wcag).toBeDefined();
        expect(typeof window.__wcag?.scan).toBe('function');
        expect(typeof window.__wcag?.pause).toBe('function');
        expect(typeof window.__wcag?.resume).toBe('function');
        expect(typeof window.__wcag?.reset).toBe('function');
    });

    it('is idempotent — a second start does not double-scan', async (): Promise<void> => {
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: true });
        startWcagProfiler({ DEV: true });
        expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it('pause() stops the scheduler and persists; resume() restarts', async (): Promise<void> => {
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: true });

        window.__wcag?.pause();
        expect(stopSpy).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('serchat:wcag-profiler-paused')).toBe(
            'true',
        );

        window.__wcag?.resume();
        expect(startSpy).toHaveBeenCalledTimes(2);
        expect(localStorage.getItem('serchat:wcag-profiler-paused')).toBeNull();
    });

    it('stays stopped when the pause flag was persisted', async (): Promise<void> => {
        localStorage.setItem('serchat:wcag-profiler-paused', 'true');
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: true });
        expect(startSpy).not.toHaveBeenCalled();
        expect(window.__wcag).toBeDefined();
    });

    it('__wcag.scan() delegates to forceScan', async (): Promise<void> => {
        const { startWcagProfiler } = await importFresh();
        startWcagProfiler({ DEV: true });
        window.__wcag?.scan();
        expect(forceScanSpy).toHaveBeenCalledTimes(1);
    });
});
