import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollSpring } from '@/utils/scrollSpring';

const frames = (count: number): void => {
    for (let i = 0; i < count; i++) vi.advanceTimersByTime(16);
};

describe('ScrollSpring', (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('animates towards the target and settles on it', (): void => {
        const write = vi.fn();
        const spring = new ScrollSpring(write, {
            tension: 200,
            friction: 35,
            mass: 2,
            clamp: true,
        });

        spring.to({ to: 1000, from: 0, animate: true });
        frames(120);

        expect(write).toHaveBeenCalled();
        expect(write.mock.calls.at(-1)?.[0]).toBe(1000);
        expect(spring.isAnimating()).toBe(false);
    });

    it('cancel() abandons the animation without landing on the target', (): void => {
        const write = vi.fn();
        const spring = new ScrollSpring(write, {
            tension: 200,
            friction: 35,
            mass: 2,
            clamp: true,
        });

        spring.to({ to: 1000, from: 0, animate: true });
        frames(3);
        expect(spring.isAnimating()).toBe(true);

        spring.cancel();
        const callsAtCancel = write.mock.calls.length;
        frames(120);

        expect(spring.isAnimating()).toBe(false);
        expect(write.mock.calls.length).toBe(callsAtCancel);
        expect(write.mock.calls.map((c): number => c[0] as number)).not.toContain(
            1000,
        );
    });

    it('cancel() drops pending settle callbacks', (): void => {
        const settled = vi.fn();
        const spring = new ScrollSpring(vi.fn(), { clamp: true });

        spring.to({ to: 500, from: 0, animate: true, callback: settled });
        frames(3);
        spring.cancel();
        frames(120);

        expect(settled).not.toHaveBeenCalled();
    });

    it('can start a fresh animation after being cancelled', (): void => {
        const write = vi.fn();
        const spring = new ScrollSpring(write, {
            tension: 200,
            friction: 35,
            mass: 2,
            clamp: true,
        });

        spring.to({ to: 1000, from: 0, animate: true });
        frames(3);
        spring.cancel();

        spring.to({ to: 200, from: 0, animate: true });
        frames(120);

        expect(write.mock.calls.at(-1)?.[0]).toBe(200);
    });
});
