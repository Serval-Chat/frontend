import type { CSSProperties, ReactNode } from 'react';

import { getConfiguredApiBaseUrl } from '@/utils/apiBaseUrl';
import { cn } from '@/utils/cn';

const SERVER_BANNER_PATH = '/api/v1/servers/banner/';

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

export const resolveServerBannerUrl = (
    value: string | undefined,
): string | null => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return null;

    let path = '';
    if (trimmedValue.startsWith('servers/banner/')) {
        path = `/api/v1/${trimmedValue}`;
    } else if (trimmedValue.startsWith('/servers/banner/')) {
        path = `/api/v1${trimmedValue}`;
    } else if (
        !trimmedValue.startsWith('http') &&
        !trimmedValue.startsWith('/') &&
        !trimmedValue.includes('/')
    ) {
        path = `${SERVER_BANNER_PATH}${trimmedValue}`;
    } else {
        path = trimmedValue;
    }

    if (path.startsWith('http')) {
        return path;
    }

    const apiBaseUrl = getConfiguredApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${apiBaseUrl}${normalizedPath}`;
};

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
