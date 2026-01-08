import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { cn } from '@/utils/cn';

import { NormalText } from './NormalText';

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
            <NormalText
                className={cn('font-medium truncate text-sm', className)}
            >
                {children}
            </NormalText>
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

    // Disable glow if in a server
    const hasGlow = !role && usernameGlow?.enabled;

    const containerStyle: React.CSSProperties = {
        fontFamily: usernameFont || undefined,
        color: solidColor || undefined,
    };

    const glowStyle: React.CSSProperties = hasGlow
        ? {
              textShadow: `0 0 1px ${usernameGlow.color}, 0 0 2px ${usernameGlow.color}, 0 0 3px ${usernameGlow.color}`,
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

    return (
        <NormalText
            className={cn(
                'font-medium truncate text-sm w-fit grid items-center',
                className
            )}
            style={containerStyle}
        >
            <span
                className="col-start-1 row-start-1 select-none pointer-events-none"
                style={glowStyle}
                aria-hidden="true"
            >
                {children}
            </span>
            <span
                className="col-start-1 row-start-1 relative"
                style={gradientStyle}
            >
                {children}
            </span>
        </NormalText>
    );
};
