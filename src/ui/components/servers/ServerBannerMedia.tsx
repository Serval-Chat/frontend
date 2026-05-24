import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { resolveServerBannerUrl } from './bannerUtils';

export interface ServerBannerMediaData {
    type: 'color' | 'image' | 'gif';
    value: string;
}

interface ServerBannerMediaProps {
    banner?: ServerBannerMediaData;
    alt: string;
    className?: string;
    imageClassName?: string;
    fallbackClassName?: string;
}

export const ServerBannerMedia = ({
    banner,
    alt,
    className,
    imageClassName,
    fallbackClassName,
}: ServerBannerMediaProps): ReactNode => {
    if (banner?.type === 'image' || banner?.type === 'gif') {
        const bannerUrl = resolveServerBannerUrl(banner.value);
        if (bannerUrl) {
            return (
                <img
                    alt={alt}
                    className={cn(
                        'h-full w-full object-cover',
                        className,
                        imageClassName,
                    )}
                    src={bannerUrl}
                />
            );
        }
    }

    if (banner?.type === 'color') {
        return (
            <div
                className={cn('h-full w-full', className)}
                style={{ backgroundColor: banner.value } as CSSProperties}
            />
        );
    }

    return (
        <div
            className={cn(
                'h-full w-full bg-bg-secondary',
                className,
                fallbackClassName,
            )}
        />
    );
};
