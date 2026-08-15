import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useIsMobile } from '@/hooks/useIsMobile';

type MatchMediaStub = ReturnType<typeof vi.fn> & {
    __setMatches: (matches: boolean) => void;
};

const setMatchMedia = (matches: boolean): void => {
    (globalThis.matchMedia as MatchMediaStub).__setMatches(matches);
};

describe('useIsMobile', (): void => {
    it('returns false on desktop', (): void => {
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('returns true when the mobile query matches', (): void => {
        act((): void => {
            setMatchMedia(true);
        });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('updates when the media query changes', (): void => {
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        act((): void => {
            setMatchMedia(true);
        });
        expect(result.current).toBe(true);

        act((): void => {
            setMatchMedia(false);
        });
        expect(result.current).toBe(false);
    });
});
