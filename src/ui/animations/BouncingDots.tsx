import { type Variants, m } from 'framer-motion';

export interface BouncingDotsProps {
    style?: React.CSSProperties;
    color?: string;
    size?: number;
    count?: number;
}

const dotVariants: Variants = {
    animate: (i: number) => ({
        y: [0, -4, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
        },
    }),
};

export const BouncingDots = ({
    style,
    color = 'var(--primary)',
    size = 8,
    count = 3,
}: BouncingDotsProps) => (
    <div
        style={{ display: 'flex', alignItems: 'center', gap: '4px', ...style }}
    >
        {Array.from({ length: count }).map((_, i) => (
            <m.div
                animate="animate"
                custom={i}
                // eslint-disable-next-line react/no-array-index-key
                key={`dot-${i}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: color,
                    flexShrink: 0,
                }}
                variants={dotVariants}
            />
        ))}
    </div>
);
