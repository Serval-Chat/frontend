import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SPINNER_SIZE_CLASSES = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
};

/**
 * @description A loading spinner
 */
export const LoadingSpinner = ({
    className,
    size = 'md',
}: LoadingSpinnerProps) => (
    <Box
        className={cn(
            'animate-spin rounded-full border-primary border-t-transparent',
            SPINNER_SIZE_CLASSES[size],
            className,
        )}
    />
);
