import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface BouncingDotsProps {
    className?: string;
    dotClassName?: string;
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

export const BouncingDots: React.FC<BouncingDotsProps> = ({
    className,
    dotClassName,
    color = 'bg-primary',
    size = 8,
    count = 3,
}) => {
    return (
        <div className={cn('flex items-center space-x-1', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={dotVariants}
                    animate="animate"
                    className={cn('rounded-full', color, dotClassName)}
                    style={{
                        width: size,
                        height: size,
                    }}
                />
            ))}
        </div>
    );
};
