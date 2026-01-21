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
        <div className="relative shrink-0 w-full shadow-[0_2px_10px_0_rgba(0,0,0,0.4)] z-content bg-bg-secondary group overflow-hidden">
            {/* Banner (Image or Color) */}
            {banner && !loading && (
                <div className="w-full h-[135px] relative overflow-hidden shrink-0">
                    {banner.type === 'image' || banner.type === 'gif' ? (
                        <img
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500"
                            src={bannerUrl || ''}
                        />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{ backgroundColor: banner.value }}
                        />
                    )}
                    <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/60" />
                </div>
            )}

            <div
                className={cn(
                    'flex items-center px-4 h-12 relative z-content',
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
