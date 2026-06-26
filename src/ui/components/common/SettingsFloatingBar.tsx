import type { CSSProperties } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

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
export const SettingsFloatingBar = ({
    isVisible,
    isPending = false,
    onSave,
    onReset,
    message = 'Careful! you have unsaved changes.',
    saveLabel = 'Save Changes',
    resetLabel = 'Reset',
    className,
    containerClassName,
    offset = '240px',
    isFixed = true,
}: SettingsFloatingBarProps) => (
    <AnimatePresence>
        {isVisible && (
            <m.div
                animate={{ y: 0, opacity: 1 }}
                aria-live="polite"
                className={cn(
                    isFixed ? 'fixed' : 'absolute',
                    'pointer-events-none right-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-fixed flex justify-center px-3 sm:px-4',
                    isFixed &&
                        'left-0 md:left-[var(--settings-floating-offset)]',
                    !isFixed && 'left-0',
                    className,
                )}
                exit={{ y: 100, opacity: 0 }}
                initial={{ y: 100, opacity: 0 }}
                role="alert"
                style={
                    isFixed
                        ? ({
                              '--settings-floating-offset': offset,
                          } as CSSProperties)
                        : undefined
                }
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div
                    className={cn(
                        'pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border-subtle bg-background/95 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-6 sm:p-4',
                        containerClassName,
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <AlertTriangle
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-caution"
                            size={18}
                        />
                        <Text className="min-w-0 flex-1 leading-snug" size="sm">
                            {message}
                        </Text>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
                        <Button
                            aria-label="Discard unsaved changes"
                            className="min-h-11 min-w-0 sm:min-w-[96px]"
                            variant="ghost"
                            onClick={onReset}
                        >
                            {resetLabel}
                        </Button>
                        <Button
                            aria-label="Save unsaved changes"
                            className="min-h-11 min-w-0 sm:min-w-[96px]"
                            loading={isPending}
                            variant="success"
                            onClick={onSave}
                        >
                            {saveLabel}
                        </Button>
                    </div>
                </div>
            </m.div>
        )}
    </AnimatePresence>
);
