import { act } from 'react';

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSwipeGesture } from '@/hooks/useSwipeGesture';

const makeTouchEvent = (
    type: string,
    clientX: number,
    clientY: number,
): TouchEvent => {
    const touch = { clientX, clientY } as Touch;
    return new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true,
    });
};

describe('useSwipeGesture', () => {
    let el: HTMLDivElement;

    beforeEach(() => {
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.removeChild(el);
        vi.restoreAllMocks();
    });

    /**
     * Renders the hook and immediately attaches the callback ref to `el`.
     * Because useSwipeGesture returns a callback ref (not a RefObject), calling
     * result.current.ref(el) synchronously registers the touch listeners.
     */
    const setup = (
        options: Parameters<typeof useSwipeGesture>[0],
    ): { current: ReturnType<typeof useSwipeGesture> } => {
        const { result } = renderHook(() => useSwipeGesture(options));
        result.current.ref(el);
        return result;
    };

    it('calls onSwipeRight when finger moves far enough to the right', () => {
        const onSwipeRight = vi.fn();
        setup({ onSwipeRight });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 50, 100));
            el.dispatchEvent(makeTouchEvent('touchmove', 80, 104));
            el.dispatchEvent(makeTouchEvent('touchend', 130, 108));
        });

        expect(onSwipeRight).toHaveBeenCalledOnce();
    });

    it('calls onSwipeLeft when finger moves far enough to the left', () => {
        const onSwipeLeft = vi.fn();
        setup({ onSwipeLeft });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 200, 100));
            el.dispatchEvent(makeTouchEvent('touchmove', 170, 104));
            el.dispatchEvent(makeTouchEvent('touchend', 120, 108));
        });

        expect(onSwipeLeft).toHaveBeenCalledOnce();
    });

    it('does NOT fire when horizontal distance is below threshold', () => {
        const onSwipeLeft = vi.fn();
        const onSwipeRight = vi.fn();
        setup({ onSwipeLeft, onSwipeRight, threshold: 60 });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 100, 100));
            el.dispatchEvent(makeTouchEvent('touchend', 130, 100));
        });

        expect(onSwipeRight).not.toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('does NOT fire when vertical drift exceeds maxVerticalDrift (scroll detection)', () => {
        const onSwipeRight = vi.fn();
        setup({ onSwipeRight, threshold: 50, maxVerticalDrift: 80 });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 50, 100));
            el.dispatchEvent(makeTouchEvent('touchmove', 80, 200));
            el.dispatchEvent(makeTouchEvent('touchend', 130, 210));
        });

        expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('does NOT fire when vertical drift on touchend exceeds limit (no touchmove)', () => {
        const onSwipeLeft = vi.fn();
        setup({ onSwipeLeft, threshold: 50, maxVerticalDrift: 80 });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 200, 100));
            el.dispatchEvent(makeTouchEvent('touchend', 100, 200));
        });

        expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('does NOT call callbacks when enabled is false', () => {
        const onSwipeRight = vi.fn();
        const onSwipeLeft = vi.fn();
        setup({ onSwipeRight, onSwipeLeft, enabled: false });

        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 50, 100));
            el.dispatchEvent(makeTouchEvent('touchend', 150, 104));
        });

        expect(onSwipeRight).not.toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('handles multiple sequential swipes correctly', () => {
        const onSwipeRight = vi.fn();
        setup({ onSwipeRight });

        // First swipe
        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 50, 100));
            el.dispatchEvent(makeTouchEvent('touchend', 150, 104));
        });

        // Second swipe
        act(() => {
            el.dispatchEvent(makeTouchEvent('touchstart', 50, 200));
            el.dispatchEvent(makeTouchEvent('touchend', 160, 205));
        });

        expect(onSwipeRight).toHaveBeenCalledTimes(2);
    });
});
