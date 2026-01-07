import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFlashGroup, useFlashText } from '@/hooks/useFlashText';

describe('useFlashText', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should flash the text and reset after duration', () => {
        const { result } = renderHook(() =>
            useFlashText('initial', 'flash', 1000)
        );

        expect(result.current[0]).toBe('initial');

        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('flash');

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current[0]).toBe('initial');
    });

    it('should use the latest initialText when resetting', () => {
        const { result, rerender } = renderHook(
            ({ initial }) => useFlashText(initial, 'flash', 1000),
            { initialProps: { initial: 'initial1' } }
        );

        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe('flash');

        rerender({ initial: 'initial2' });

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current[0]).toBe('initial2');
    });
});

describe('useFlashGroup', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const configs = {
        btn1: { initial: 'i1', flash: 'f1', duration: 1000 },
        btn2: { initial: 'i2', flash: 'f2', duration: 2000 },
    };

    it('should flash keys independently', () => {
        const { result } = renderHook(() => useFlashGroup(configs));

        expect(result.current.btn1.label).toBe('i1');
        expect(result.current.btn2.label).toBe('i2');

        act(() => {
            result.current.btn1.trigger();
        });

        expect(result.current.btn1.label).toBe('f1');
        expect(result.current.btn1.isFlashing).toBe(true);
        expect(result.current.btn2.label).toBe('i2');

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.btn1.label).toBe('i1');
        expect(result.current.btn1.isFlashing).toBe(false);
    });

    it('should cancel previous timeout on rapid triggers', () => {
        const { result } = renderHook(() => useFlashGroup(configs));

        act(() => {
            result.current.btn1.trigger();
        });

        expect(result.current.btn1.label).toBe('f1');

        act(() => {
            vi.advanceTimersByTime(500);
            result.current.btn1.trigger();
        });

        expect(result.current.btn1.label).toBe('f1');

        act(() => {
            vi.advanceTimersByTime(600); // Total 1100ms since first trigger, but only 600ms since second
        });

        // Should still be flashing because the second trigger reset the timer
        expect(result.current.btn1.label).toBe('f1');

        act(() => {
            vi.advanceTimersByTime(400); // Total 1000ms since second trigger
        });

        expect(result.current.btn1.label).toBe('i1');
    });

    it('should cleanup timeouts on unmount', () => {
        const spy = vi.spyOn(globalThis, 'clearTimeout');
        const { result, unmount } = renderHook(() => useFlashGroup(configs));

        act(() => {
            result.current.btn1.trigger();
        });

        unmount();

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
