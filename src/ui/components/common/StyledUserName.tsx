import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { Text } from './Text';

interface StyledUserNameProps {
    user?: User;
    role?: Role;
    children: React.ReactNode;
    className?: string;
    disableCustomFonts?: boolean;
}

export const StyledUserName: React.FC<StyledUserNameProps> = ({
    user,
    role,
    children,
    className,
    disableCustomFonts,
}) => {
    if (!user && !role) {
        return (
            <Text className={cn('font-medium truncate text-sm', className)}>
                {children}
            </Text>
        );
    }

    // Determine basic styling from user or role
    const usernameFont = disableCustomFonts ? undefined : user?.usernameFont;
    const usernameGlow = user?.usernameGlow;

    // Gradients
    let gradientFunction = 'linear-gradient';
    let gradientArgs = '90deg, transparent, transparent';
    let hasGradient = false;
    let solidColor = '';

    // If role is provided and has colors, use it
    if (role) {
        if (role.colors && role.colors.length > 0) {
            const uniqueColors = new Set(role.colors);
            if (uniqueColors.size === 1) {
                solidColor = role.colors[0];
            } else {
                hasGradient = true;
                const repeat =
                    role.gradientRepeat && role.gradientRepeat > 1
                        ? role.gradientRepeat
                        : 1;
                if (repeat > 1) {
                    gradientFunction = 'repeating-linear-gradient';
                    const stop = (100 / repeat).toFixed(2);
                    gradientArgs = `90deg, ${role.colors.join(', ')} ${stop}%`;
                } else {
                    gradientArgs = `90deg, ${role.colors.join(', ')}`;
                }
            }
        } else if (role.startColor && role.endColor) {
            if (role.startColor === role.endColor) {
                solidColor = role.startColor;
            } else {
                hasGradient = true;
                gradientArgs = `90deg, ${role.startColor}, ${role.endColor}`;
            }
        } else if (role.color) {
            solidColor = role.color;
        }
    }

    // If user has custom gradient and no role gradient was set, use user's
    if (!hasGradient && !solidColor && user?.usernameGradient?.enabled) {
        const { colors, angle, repeating } = user.usernameGradient;
        if (colors.length > 0) {
            if (colors.length === 1) {
                solidColor = colors[0];
            } else {
                hasGradient = true;
                gradientFunction = repeating
                    ? 'repeating-linear-gradient'
                    : 'linear-gradient';
                const colorStr = colors.join(', ');
                gradientArgs = `${angle}deg, ${colorStr}`;
            }
        }
    }

    // Enable glow if user has it enabled
    const hasGlow = usernameGlow?.enabled;

    // Determine the color to use for the glow
    const baseColor =
        solidColor ||
        role?.colors?.[0] ||
        user?.usernameGradient?.colors?.[0] ||
        role?.startColor ||
        usernameGlow?.color;

    const containerStyle: React.CSSProperties = {
        fontFamily: usernameFont || undefined,
        color: solidColor || undefined,
    };

    const glowStyle: React.CSSProperties = hasGlow
        ? {
              textShadow: `0 0 1px ${baseColor}, 0 0 2px ${baseColor}, 0 0 3px ${baseColor}`,
              color: 'transparent',
          }
        : { visibility: 'hidden' };

    const gradientStyle: React.CSSProperties = hasGradient
        ? {
              backgroundImage: `${gradientFunction}(${gradientArgs})`,
              backgroundSize: '100%',
              backgroundRepeat: 'no-repeat',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
          }
        : {};

    // If neither effect is active, render simply
    if (!hasGlow && !hasGradient) {
        return (
            <Text
                className={cn('font-medium truncate text-sm w-fit', className)}
                style={containerStyle}
            >
                {children}
            </Text>
        );
    }

    return (
        <Text
            className={cn(
                'font-medium truncate text-sm w-fit grid items-center',
                className
            )}
            style={containerStyle}
        >
            {hasGlow && (
                <Box
                    aria-hidden="true"
                    as="span"
                    className="col-start-1 row-start-1 select-none pointer-events-none"
                    style={glowStyle}
                >
                    {children}
                </Box>
            )}
            <Box
                as="span"
                className="col-start-1 row-start-1 relative"
                style={gradientStyle}
            >
                {children}
            </Box>
        </Text>
    );
};
