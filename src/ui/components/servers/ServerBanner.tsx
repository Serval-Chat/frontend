import React from 'react';

import type { ServerBanner as ServerBannerData } from '@/api/servers/servers.types';
import { NormalText } from '@/ui/components/common/NormalText';
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
        <div className="relative shrink-0 w-full shadow-[0_2px_10px_0_rgba(0,0,0,0.4)] z-10 bg-bg-secondary group overflow-hidden">
            {/* Banner (Image or Color) */}
            {banner && !loading && (
                <div className="w-full h-[135px] relative overflow-hidden shrink-0">
                    {banner.type === 'image' || banner.type === 'gif' ? (
                        <img
                            src={bannerUrl || ''}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500"
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
                    'flex items-center px-4 h-12 relative z-10',
                    banner && 'absolute bottom-0'
                )}
            >
                <NormalText
                    weight="bold"
                    className={cn(
                        'truncate text-[15px] drop-shadow-lg',
                        loading ? 'text-foreground-muted' : 'text-foreground'
                    )}
                >
                    {loading ? 'Loading...' : name}
                </NormalText>
            </div>
        </div>
    );
};
