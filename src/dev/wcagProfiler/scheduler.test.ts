import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScanScheduler } from './scheduler';

const DEBOUNCE = 1000;
const MAX_WAIT = 5000;
const GRACE = 300;
const THROTTLE = 1000;

interface Harness {
    scheduler: ScanScheduler;
    onScanDue: ReturnType<typeof vi.fn>;
}

const makeHarness = (
    isHidden: () => boolean = (): boolean => false,
): Harness => {
    const onScanDue = vi.fn();
    const scheduler = new ScanScheduler({
        onScanDue,
        isHidden,
        observeRoot: document.documentElement,
        debounceMs: DEBOUNCE,
        maxWaitMs: MAX_WAIT,
        graceMs: GRACE,
        throttleMs: THROTTLE,
    });
    return { scheduler, onScanDue };
};

const mutate = (attributeName?: string): void => {
    if (attributeName) {
        document.body.setAttribute(attributeName, String(Math.random()));
        return;
    }
    const el = document.createElement('div');
    document.body.append(el);
};

const flushMutations = async (): Promise<void> => {
    // MutationObserver delivers on the microtask queue.
    await Promise.resolve();
    await Promise.resolve();
};

const mutateAndFlush = async (attributeName?: string): Promise<void> => {
    mutate(attributeName);
    await flushMutations();
};

describe('ScanScheduler', (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach((): void => {
        document.body.innerHTML = '';
        const own = Object.getOwnPropertyDescriptor(document, 'hidden');
        if (own) delete (document as { hidden?: boolean }).hidden;
        vi.useRealTimers();
    });

    it('scans once after the debounce quiet period', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        await mutateAndFlush();
        vi.advanceTimersByTime(DEBOUNCE - 1);
        expect(onScanDue).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.stop();
    });

    it('coalesces many mutations into a single scan', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        // Clear the initial scan before counting.
        vi.advanceTimersByTime(DEBOUNCE);
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE + THROTTLE);

        for (let i = 0; i < 5; i++) {
            await mutateAndFlush();
            vi.advanceTimersByTime(100);
        }
        vi.advanceTimersByTime(DEBOUNCE);
        expect(onScanDue).toHaveBeenCalledTimes(2);
        scheduler.stop();
    });

    it('forces a scan at maxWait despite continuous mutation resets', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        vi.advanceTimersByTime(DEBOUNCE); // initial scan
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE + THROTTLE);

        // Mutate every 500ms
        //  debounce alone would never fire because
        // each mutation resets it. maxWait must force a scan anyway.
        const interval = setInterval((): void => {
            mutate();
        }, 500);
        for (let i = 0; i < 12; i++) {
            vi.advanceTimersByTime(500);
            await flushMutations();
        }
        clearInterval(interval);
        expect(onScanDue).toHaveBeenCalledTimes(2);
        scheduler.stop();
    });

    it('ignores STYLE/SCRIPT node additions (axe self-injection)', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        vi.advanceTimersByTime(DEBOUNCE); // initial
        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE + THROTTLE);

        const style = document.createElement('style');
        document.head.append(style);
        await flushMutations();
        vi.advanceTimersByTime(DEBOUNCE + MAX_WAIT);
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.stop();
    });

    it('ignores style attribute mutations but observes class', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        vi.advanceTimersByTime(DEBOUNCE); // initial
        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE + THROTTLE);

        await mutateAndFlush('style');
        vi.advanceTimersByTime(DEBOUNCE + MAX_WAIT);
        expect(onScanDue).toHaveBeenCalledTimes(1);

        await mutateAndFlush('class');
        vi.advanceTimersByTime(DEBOUNCE);
        expect(onScanDue).toHaveBeenCalledTimes(2);
        scheduler.stop();
    });

    it('queues exactly one follow-up scan for mutations during a run', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        vi.advanceTimersByTime(DEBOUNCE); // initial scan now in flight
        expect(onScanDue).toHaveBeenCalledTimes(1);

        await mutateAndFlush();
        vi.advanceTimersByTime(DEBOUNCE + MAX_WAIT);
        // Still in flight
        expect(onScanDue).toHaveBeenCalledTimes(1);

        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE);
        vi.advanceTimersByTime(DEBOUNCE);
        expect(onScanDue).toHaveBeenCalledTimes(2);
        scheduler.stop();
    });

    it('defers scans while hidden and flushes on visible', async (): Promise<void> => {
        let hidden = true;
        const { scheduler, onScanDue } = makeHarness((): boolean => hidden);
        // jsdom's document.hidden is a read-only prototype getter; shadow
        // it on the instance so the visibilitychange flush can be driven
        Object.defineProperty(document, 'hidden', {
            configurable: true,
            get: (): boolean => hidden,
        });
        scheduler.start();
        await mutateAndFlush();
        vi.advanceTimersByTime(DEBOUNCE + MAX_WAIT);
        expect(onScanDue).not.toHaveBeenCalled();

        hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        vi.advanceTimersByTime(THROTTLE);
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.stop();
    });

    it('forceScan bypasses the hidden deferral', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness((): boolean => true);
        scheduler.start();
        scheduler.forceScan();
        expect(onScanDue).toHaveBeenCalledTimes(1);
        scheduler.stop();
    });

    it('respects the throttle between scan starts', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        vi.advanceTimersByTime(DEBOUNCE);
        expect(onScanDue).toHaveBeenCalledTimes(1);

        // A forced scan right after a completed one must be delayed by
        // the throttle window (debounce is bypassed, so only throttle
        // stands between the two starts).
        scheduler.notifyScanComplete();
        vi.advanceTimersByTime(GRACE);
        scheduler.forceScan();
        expect(onScanDue).toHaveBeenCalledTimes(1);
        // First scan started at T=DEBOUNCE; forceScan lands at
        // T=DEBOUNCE+GRACE, so the throttle releases GRACE short of a
        // full THROTTLE window after the forceScan call.
        vi.advanceTimersByTime(THROTTLE - GRACE - 1);
        expect(onScanDue).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1);
        expect(onScanDue).toHaveBeenCalledTimes(2);
        scheduler.stop();
    });

    it('stop() detaches the observer and clears timers', async (): Promise<void> => {
        const { scheduler, onScanDue } = makeHarness();
        scheduler.start();
        scheduler.stop();
        await mutateAndFlush();
        vi.advanceTimersByTime(DEBOUNCE + MAX_WAIT);
        expect(onScanDue).not.toHaveBeenCalled();
    });
});
