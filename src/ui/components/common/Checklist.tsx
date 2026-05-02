import React from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/utils/cn';

interface ChecklistProps {
    checked: boolean;
    depth?: number;
    children: React.ReactNode;
}

const CHECKMARK_SPLINE = 'M 3 10 C 4.5 12 6 14.5 8 14 C 10 13.5 13 8 16 4';

const DepthConnector: React.FC<{ depth: number }> = ({ depth }) => {
    if (depth <= 0) return null;

    const SPINE_W = 16;
    const priorPx = (depth - 1) * SPINE_W;

    return (
        <>
            {priorPx > 0 && (
                <div className="shrink-0" style={{ width: `${priorPx}px` }} />
            )}

            <div
                className="h-[11px] w-[14px] shrink-0 self-start rounded-bl border-b-2 border-l-2"
                style={{ borderColor: 'var(--color-checklist-spine)' }}
            />
        </>
    );
};

export const Checklist: React.FC<ChecklistProps> = ({
    checked,
    depth = 0,
    children,
}) => (
    <div className="my-0.5 flex items-center">
        <DepthConnector depth={depth} />

        <div className="flex flex-1 items-center gap-2 pl-1">
            <motion.div
                animate={checked ? 'checked' : 'unchecked'}
                className={cn(
                    'relative flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded',
                    'transition-colors duration-200',
                    checked
                        ? 'bg-primary shadow-sm shadow-primary/40'
                        : 'border-border border bg-bg-subtle',
                )}
                initial={false}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                variants={{
                    checked: { scale: [1, 0.85, 1.05, 1] },
                    unchecked: { scale: 1 },
                }}
            >
                <svg
                    className="h-[11px] w-[11px] overflow-visible"
                    fill="none"
                    viewBox="0 0 18 18"
                >
                    <motion.path
                        animate={{
                            pathLength: checked ? 1 : 0,
                            opacity: checked ? 1 : 0,
                        }}
                        d={CHECKMARK_SPLINE}
                        initial={{ pathLength: 0, opacity: 0 }}
                        stroke="white"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.1}
                        transition={{
                            pathLength: {
                                duration: 0.32,
                                ease: [0.34, 1.56, 0.64, 1],
                            },
                            opacity: { duration: 0.08 },
                        }}
                    />
                </svg>
            </motion.div>

            <span
                className={cn(
                    'flex-1 text-sm leading-snug transition-all duration-300',
                    checked
                        ? 'text-foreground-muted decoration-foreground-muted/50 line-through'
                        : 'text-foreground',
                )}
            >
                {children}
            </span>
        </div>
    </div>
);
