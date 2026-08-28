import { X } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';

interface ModalCloseButtonProps {
    onClick: () => void;
    className?: string;
    iconSize?: number;
}

export const ModalCloseButton = ({
    onClick,
    className,
    iconSize = 24,
}: ModalCloseButtonProps) => (
    <div className={cn('flex flex-col items-center gap-2', className)}>
        <IconButton
            className="rounded-full border-2 border-border-subtle p-2 text-muted-foreground transition-all duration-200 hover:bg-bg-subtle hover:text-foreground"
            icon={X}
            iconSize={iconSize}
            onClick={onClick}
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Esc
        </span>
    </div>
);
