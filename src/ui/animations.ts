import type { Transition } from 'framer-motion';

// ─── Transitions ─────────────────────────────────────────────────────────────

export const transitions = {
    tooltip: { duration: 0.1, ease: 'easeOut' } satisfies Transition,
    fast: { duration: 0.15, ease: 'easeOut' } satisfies Transition,
    normal: { duration: 0.2, ease: 'easeOut' } satisfies Transition,
    medium: {
        duration: 0.22,
        ease: [0.25, 0.46, 0.45, 0.94],
    } satisfies Transition,
    slow: { duration: 0.3, ease: 'easeOut' } satisfies Transition,
    spring: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
    } satisfies Transition,
    bouncy: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } satisfies Transition,
    sidebar: {
        duration: 0.22,
        ease: [0.25, 0.46, 0.45, 0.94],
    } satisfies Transition,
} as const;
