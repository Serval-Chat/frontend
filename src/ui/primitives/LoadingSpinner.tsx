import { Box } from '@/ui/primitives/Box';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    tone?: 'primary' | 'muted' | 'current';
}

const SPINNER_SIZE_CLASSES = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
};

const SPINNER_TONE_CLASSES = {
    primary: 'border-primary',
    muted: 'border-muted-foreground',
    current: 'border-current',
};

/**
 * @description A loading spinner
 */
export const LoadingSpinner = ({
    className,
    size = 'md',
    tone = 'primary',
}: LoadingSpinnerProps) => (
    <Box
        className={cn(
            'animate-spin rounded-full',
            SPINNER_TONE_CLASSES[tone],
            'border-t-transparent',
            SPINNER_SIZE_CLASSES[size],
            className,
        )}
    />
);
