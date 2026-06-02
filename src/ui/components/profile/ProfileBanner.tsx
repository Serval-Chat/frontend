import { Camera } from 'lucide-react';

import { useLimitedAnimations } from '@/providers/LimitedAnimationsProvider';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { Box } from '@/ui/components/layout/Box';
import { isAnimatedImageUrl } from '@/utils/animationPreferences';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ProfileBannerProps {
    banner?: string | null;
    bannerColor?: string | null;
    usernameGradient?: { colors: string[] };
    onBannerClick?: () => void;
    className?: string;
    height?: number | string;
    alt?: string;
}

/**
 * @description Reusable profile banner component with color calculation formula.
 */
export const ProfileBanner = ({
    banner,
    bannerColor: propsBannerColor,
    usernameGradient,
    onBannerClick,
    className,
    height = 120,
    alt = 'User Banner',
}: ProfileBannerProps) => {
    const limitedAnimations = useLimitedAnimations();
    const defaultColor = '#5865F2';
    const bannerColor =
        propsBannerColor || usernameGradient?.colors?.[0] || defaultColor;
    const bannerUrl = resolveApiUrl(banner || undefined) || '';
    const shouldShowBanner = !!bannerUrl;

    return (
        <Box
            className={cn(
                'relative w-full shrink-0 overflow-hidden bg-bg-secondary',
                onBannerClick && 'group/banner cursor-pointer',
                className,
            )}
            style={{
                backgroundColor: bannerColor,
                height,
            }}
            onClick={onBannerClick}
        >
            {shouldShowBanner && (
                <PausedAnimatedImage
                    alt={alt}
                    className="h-full w-full object-cover"
                    paused={limitedAnimations && isAnimatedImageUrl(bannerUrl)}
                    src={bannerUrl}
                />
            )}
            {onBannerClick && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-xs font-bold text-white uppercase opacity-0 transition-opacity duration-200 group-hover/banner:opacity-100">
                    <Camera size={24} />
                    <span>Change Banner</span>
                </div>
            )}
        </Box>
    );
};
