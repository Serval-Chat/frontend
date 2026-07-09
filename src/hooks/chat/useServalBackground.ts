import { useEffect } from 'react';

import type { Theme } from '@/providers/ThemeProvider';
import { useAppSelector } from '@/store/hooks';
import { applyServalBackground } from '@/utils/servalFur';

/**
 * applies the animated "serval fur" canvas background to the chat container
 * while the serval theme is active, re-running whenever the fur-tweaker
 * settings change. Extracted from MainChat to keep the effect self-contained.
 */
export const useServalBackground = (
    ref: React.RefObject<HTMLElement | null>,
    theme: Theme,
): void => {
    const { spotCount, opacity, seed, base, spotColor } = useAppSelector(
        (state) => state.furTweaker,
    );

    useEffect((): (() => void) | undefined => {
        if (theme !== 'serval' || !ref.current) return;

        const cleanup = applyServalBackground(ref.current, {
            base,
            opacity,
            spotColor,
            spotCount: spotCount || undefined,
            seed,
        });

        return (): void => {
            cleanup();
        };
    }, [theme, opacity, seed, base, spotColor, spotCount, ref]);
};
