import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface SettingsFloatingBarProps {
    isVisible: boolean;
    isPending?: boolean;
    onSave: () => void;
    onReset: () => void;
    message?: string;
    saveLabel?: string;
    resetLabel?: string;
    className?: string;
    containerClassName?: string;
    offset?: string;
    isFixed?: boolean;
}

/**
 * @description A floating action bar for settings to handle unsaved changes.
 */
export const SettingsFloatingBar: React.FC<SettingsFloatingBarProps> = ({
    isVisible,
    isPending = false,
    onSave,
    onReset,
    message = 'Careful - you have unsaved changes!',
    saveLabel = 'Save Changes',
    resetLabel = 'Reset',
    className,
    containerClassName,
    offset = '240px',
    isFixed = true,
}) => (
    <AnimatePresence>
        {isVisible && (
            <motion.div
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                    isFixed ? 'fixed' : 'absolute',
                    'pointer-events-none right-0 bottom-8 z-fixed flex justify-center px-4',
                    isFixed && `left-[${offset}]`,
                    !isFixed && 'left-0',
                    className,
                )}
                exit={{ y: 100, opacity: 0 }}
                initial={{ y: 100, opacity: 0 }}
                style={isFixed ? { left: offset } : undefined}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div
                    className={cn(
                        'pointer-events-auto flex w-full max-w-2xl items-center gap-6 rounded-lg border border-border-subtle bg-background p-4 shadow-2xl backdrop-blur-md',
                        containerClassName,
                    )}
                >
                    <Text className="flex-1" size="sm">
                        {message}
                    </Text>
                    <div className="flex gap-3">
                        <Button
                            className="min-w-[96px]"
                            variant="ghost"
                            onClick={onReset}
                        >
                            {resetLabel}
                        </Button>
                        <Button
                            className="min-w-[96px]"
                            loading={isPending}
                            variant="success"
                            onClick={onSave}
                        >
                            {saveLabel}
                        </Button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);
