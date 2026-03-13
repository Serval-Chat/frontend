import React from 'react';

import type { ServerBanner as ServerBannerData } from '@/api/servers/servers.types';
import { Text } from '@/ui/components/common/Text';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ServerBannerProps {
    name: string;
    banner?: ServerBannerData;
    loading?: boolean;
}

/**
 * @description Renders the server banner with the name.
 */
export const ServerBanner: React.FC<ServerBannerProps> = ({
    name,
    banner,
    loading,
}) => {
    const bannerUrl = resolveApiUrl(banner?.value);

    return (
        <div className="group relative z-content w-full shrink-0 overflow-hidden bg-bg-secondary shadow-[0_2px_10px_0_rgba(0,0,0,0.4)]">
            {/* Banner (Image or Color) */}
            {banner && !loading && (
                <div className="relative h-[135px] w-full shrink-0 overflow-hidden">
                    {banner.type === 'image' || banner.type === 'gif' ? (
                        <img
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-500"
                            src={bannerUrl || ''}
                        />
                    ) : (
                        <div
                            className="h-full w-full"
                            style={{ backgroundColor: banner.value }}
                        />
                    )}
                    <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/60" />
                </div>
            )}

            <div
                className={cn(
                    'relative z-content flex h-12 items-center px-4',
                    banner && 'absolute bottom-0',
                )}
            >
                <Text
                    className={cn(
                        'truncate text-[15px] drop-shadow-lg transition-colors',
                        loading
                            ? 'text-muted-foreground'
                            : banner
                              ? 'text-white'
                              : 'text-foreground',
                    )}
                    weight="bold"
                >
                    {loading ? 'Loading...' : name}
                </Text>
            </div>
        </div>
    );
};
