import React from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface FeatureTileProps {
    image: string;
    title: string;
    description?: string;
    className?: string;
    width?: number;
    height?: number;
}

export const FeatureTile: React.FC<FeatureTileProps> = ({
    image,
    title,
    description,
    className,
    width,
    height,
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
                height={height}
                loading="lazy"
                src={image}
                width={width}
            />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-5">
            <Heading
                className="text-lg transition-colors group-hover:text-primary"
                level={3}
            >
                {title}
            </Heading>
            {description && (
                <Text as="p" size="sm" variant="muted">
                    {description}
                </Text>
            )}
        </div>
    </Box>
);
