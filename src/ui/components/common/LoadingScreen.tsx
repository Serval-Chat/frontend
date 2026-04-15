import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { BouncingDots } from '@/ui/animations/BouncingDots';
import { cn } from '@/utils/cn';

interface LoadingScreenProps {
    message?: string;
    type?: 'loading' | 'offline' | 'reconnecting';
    isVisible?: boolean;
}

const MESSAGES = [
    'Calibrating my long ears...',
    'Sharpening claws...',
    'Chasing the red dot...',
    'Finding the best spot to nap...',
    'Finding someone to bite...',
];

/**
 * @description Serchat loading and offline screen.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message,
    type = 'loading',
    isVisible = true,
}) => {
    const [randomMessage, setRandomMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        if (type === 'loading' && !message) {
            const interval = setInterval(() => {
                setRandomMessage((prev) => {
                    const filtered = MESSAGES.filter((m) => m !== prev);
                    return filtered[
                        Math.floor(Math.random() * filtered.length)
                    ];
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [type, message]);

    const displayMessage =
        message ||
        (type === 'offline'
            ? 'Serval is sleeping (Offline)'
            : type === 'reconnecting'
              ? 'Sharpening claws and reconnecting...'
              : randomMessage);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    animate={{ opacity: 1 }}
                    className={cn(
                        'fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 text-center',
                        'bg-background',
                    )}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key={type}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex flex-col items-center gap-8">
                        <div className="relative">
                            <img
                                alt="Serchat"
                                className="h-24 w-24 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] select-none"
                                src="/serval.png"
                            />
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <motion.div
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 5 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span
                                    className={cn(
                                        'text-lg font-bold tracking-tight',
                                        type === 'offline'
                                            ? 'text-danger'
                                            : type === 'reconnecting'
                                              ? 'text-warning'
                                              : 'text-primary',
                                    )}
                                >
                                    {type === 'loading'
                                        ? 'Serchat'
                                        : type === 'reconnecting'
                                          ? 'Reconnecting'
                                          : 'Offline'}
                                </span>
                            </motion.div>

                            <motion.div
                                animate={{ opacity: 1 }}
                                initial={{ opacity: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-sm font-medium text-muted-foreground opacity-80">
                                    {displayMessage}
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 flex flex-col items-center gap-2">
                        <BouncingDots color="bg-primary/30" size={6} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
