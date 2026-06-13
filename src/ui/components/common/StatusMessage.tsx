import { AnimatePresence, motion } from 'framer-motion';

import { colors, fontSize, fontWeight, radius } from '@/ui/theme';
import type { StatusType } from '@/ui/types';

export interface StatusMessageProps {
    message: string;
    type: StatusType;
    style?: React.CSSProperties;
}

const typeStyles: Partial<Record<StatusType, React.CSSProperties>> = {
    error: {
        borderColor: `color-mix(in srgb, ${colors.danger} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${colors.danger} 10%, transparent)`,
        color: colors.danger,
    },
    success: {
        borderColor: `color-mix(in srgb, ${colors.success} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${colors.success} 10%, transparent)`,
        color: colors.success,
    },
};

export const StatusMessage = ({ message, type, style }: StatusMessageProps) => (
    <AnimatePresence mode="wait">
        {message && (
            <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: -10 }}
                style={{
                    display: 'flex',
                    minHeight: '2.5rem',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.md,
                    border: '1px solid',
                    paddingInline: '1rem',
                    paddingBlock: '0.5rem',
                    textAlign: 'center',
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                    ...(typeStyles[type] ?? {}),
                    ...style,
                }}
                transition={{ duration: 0.2 }}
            >
                {message}
            </motion.div>
        )}
    </AnimatePresence>
);
