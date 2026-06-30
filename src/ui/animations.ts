import type { Transition, Variants } from 'framer-motion';

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

// ─── Variants ────────────────────────────────────────────────────────────────

/** Simple opacity fade — overlays, loading screens */
export const fadeVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

/** Scale + fade pop from below — modals, dropdowns, popovers, emoji picker */
export const popupVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
};

/** Scale + fade pop from above — pins drawer, context menu */
export const popupUpVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
};

/** Slide up small — loading screen text, status messages */
export const slideUpVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 },
};

/** Slide up from below — modals, notifications from bottom */
export const slideUpLargeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

/** Slide down from top — status messages, alerts */
export const slideDownVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
};

/** Expand vertically — collapsible sections, search bars, form fields */
export const expandVerticalVariants: Variants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: 'auto', opacity: 1 },
};

/** Slide in from left — nav items, panel transitions */
export const slideFromLeftVariants: Variants = {
    hidden: { opacity: 0, x: -10, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1 },
};

/** Slide in from right — member list, right-side panels */
export const slideFromRightVariants: Variants = {
    hidden: { opacity: 0, x: '100%' },
    visible: { opacity: 1, x: 0 },
};

/** Toast notification — slides up from bottom-right */
export const toastVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

/** In-app notification banner — slides down from top */
export const notificationVariants: Variants = {
    hidden: { opacity: 0, y: -18, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

/** Floating action bar — slides up from bottom */
export const floatingBarVariants: Variants = {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0 },
};

/** Loading overlay modal card */
export const loadingCardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
};
