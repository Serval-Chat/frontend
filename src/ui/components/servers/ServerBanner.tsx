import { BadgeCheck } from 'lucide-react';

import type { ServerBanner as ServerBannerData } from '@/api/servers/servers.types';
import { Text } from '@/ui/components/common/Text';
import { ServerBannerMedia } from '@/ui/components/servers/ServerBannerMedia';
import { cn } from '@/utils/cn';

interface ServerBannerProps {
    name: string;
    banner?: ServerBannerData;
    loading?: boolean;
    verified?: boolean;
}

/**
 * @description Renders the server banner with the name.
 */
export const ServerBanner = ({
    name,
    banner,
    loading,
    verified,
}: ServerBannerProps) => (
    <div className="group relative z-content w-full shrink-0 overflow-hidden bg-bg-secondary shadow-[0_2px_10px_0_rgba(0,0,0,0.4)]">
        {/* Banner (Image or Color) */}
        {banner && !loading ? (
            <div className="relative h-[135px] w-full shrink-0 overflow-hidden">
                <ServerBannerMedia
                    alt={name}
                    banner={banner}
                    imageClassName="transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30" />
            </div>
        ) : null}

        <div
            className={cn(
                'relative z-content flex h-12 items-center gap-1.5 px-4',
                banner && 'absolute inset-x-0 bottom-0',
            )}
        >
            {verified ? (
                <BadgeCheck
                    className={cn(
                        'shrink-0',
                        loading
                            ? 'text-muted-foreground'
                            : banner
                              ? 'text-white'
                              : 'text-primary',
                    )}
                    size={18}
                    strokeWidth={2.5}
                />
            ) : null}
            <Text
                className={cn(
                    'min-w-0 flex-1 truncate text-[15px] drop-shadow-lg transition-colors',
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
