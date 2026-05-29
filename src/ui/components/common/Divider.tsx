import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface DividerProps {
    className?: string;
    fullWidth?: boolean;
}

export const Divider = ({ className, fullWidth }: DividerProps) => (
    <Box
        className={cn(
            'flex w-full items-center justify-center py-[2px]',
            !fullWidth && 'px-[12px]',
            className,
        )}
    >
        <Box className="h-[3px] w-full rounded-full bg-divider" />
    </Box>
);
