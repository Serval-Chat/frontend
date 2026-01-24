import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface FeatureTileProps {
    image: string;
    title: string;
    description?: string;
    className?: string;
}

export const FeatureTile: React.FC<FeatureTileProps> = ({
    image,
    title,
    description,
    className,
}) => (
    <Box
        className={cn(
            'group relative flex h-fit flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl',
            className,
        )}
    >
        <div className="w-full overflow-hidden bg-bg-subtle">
            <img
                alt={title}
                className="h-auto w-full transition-transform duration-500 group-hover:scale-105"
                src={image}
            />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-5">
            <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    </Box>
);
