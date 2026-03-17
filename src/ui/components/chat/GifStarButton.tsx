import React from 'react';

import { Star } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

interface GifStarButtonProps {
    isFavorited: boolean;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
}

export const GifStarButton: React.FC<GifStarButtonProps> = ({
    isFavorited,
    onClick,
    className,
}) => (
    <Button
        className={cn(
            'h-8 w-8 rounded-full bg-black/50 p-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70 active:scale-95',
            isFavorited ? 'text-yellow-400' : 'text-white',
            className,
        )}
        size="sm"
        variant="ghost"
        onClick={onClick}
    >
        <Star
            className={cn(
                'h-4 w-4 transition-transform',
                isFavorited ? 'fill-current' : '',
            )}
        />
    </Button>
);
