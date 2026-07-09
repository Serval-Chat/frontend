import { Upload } from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import { Text } from '@/ui/components/common/Text';
import { ServerBannerMedia } from '@/ui/components/servers/ServerBannerMedia';

interface ServerVisualsSectionProps {
    server: Server;
    iconUrl: string | null;
    onIconClick: () => void;
    onBannerClick: () => void;
}

export const ServerVisualsSection = ({
    server,
    iconUrl,
    onIconClick,
    onBannerClick,
}: ServerVisualsSectionProps): React.ReactNode => (
    <div className="flex-shrink-0 space-y-8">
        <div className="space-y-3">
            <label
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                htmlFor="server-icon-upload"
            >
                Server Icon
            </label>
            <button
                className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-border-subtle bg-bg-subtle transition-all hover:border-primary"
                type="button"
                onClick={onIconClick}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onIconClick();
                    }
                }}
            >
                {iconUrl ? (
                    <img
                        alt={server.name}
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-40"
                        src={iconUrl}
                    />
                ) : (
                    <Text className="text-2xl font-bold">
                        {server.name.charAt(0).toUpperCase()}
                    </Text>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="mb-1 h-6 w-6 text-white" />
                    <Text
                        size="2xs"
                        transform="uppercase"
                        variant="inverse"
                        weight="bold"
                    >
                        Change Icon
                    </Text>
                </div>
            </button>
        </div>

        <div className="space-y-3">
            <label
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                htmlFor="server-banner-upload"
            >
                Server Banner
            </label>
            <button
                className="group relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-bg-subtle transition-all hover:border-primary md:w-64"
                type="button"
                onClick={onBannerClick}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onBannerClick();
                    }
                }}
            >
                {server.banner?.value ? (
                    <ServerBannerMedia
                        alt="Banner"
                        banner={server.banner}
                        className="transition-opacity group-hover:opacity-40"
                    />
                ) : (
                    <div className="p-4 text-center">
                        <Text size="xs" variant="muted">
                            No Banner Set
                        </Text>
                    </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="mb-1 h-6 w-6 text-white" />
                    <Text
                        size="2xs"
                        transform="uppercase"
                        variant="inverse"
                        weight="bold"
                    >
                        Change Banner
                    </Text>
                </div>
            </button>
        </div>
    </div>
);
