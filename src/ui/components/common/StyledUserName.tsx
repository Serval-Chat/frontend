import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { cn } from '@/utils/cn';

import { Text } from './Text';

interface StyledUserNameProps {
    user?: User;
    role?: Role;
    children: React.ReactNode;
    className?: string;
    disableCustomFonts?: boolean;
    glowIntensity?: number;
    disableGlow?: boolean;
}

const glowIntensity = 0.7;

export const StyledUserName: React.FC<StyledUserNameProps> = ({
    user,
    role,
    children,
    className,
    disableCustomFonts,
    disableGlow,
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
    if (
        !hasGradient &&
        !solidColor &&
        user?.usernameGradient?.enabled &&
        !disableCustomFonts
    ) {
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

    // Enable glow if user has it enabled and glow is not disabled
    const hasGlow =
        !disableGlow && !disableCustomFonts && usernameGlow?.enabled;

    const containerStyle: React.CSSProperties = {
        fontFamily: usernameFont || undefined,
    };

    // helper to render text with per-character effects
    const renderStyledText = (text: string): React.ReactNode[] => {
        const chars = text.split('');
        const totalChars = chars.length;

        return chars.map((char, i) => {
            const charStyle: React.CSSProperties = {
                display: 'inline-block',
                whiteSpace: 'pre',
                padding: '0 0.125px',
                ...(hasGradient
                    ? {
                          backgroundImage: `${gradientFunction}(${gradientArgs})`,
                          backgroundSize: `${totalChars * 100}% 100%`,
                          backgroundPosition:
                              totalChars > 1
                                  ? `${(i / (totalChars - 1)) * 100}% 0%`
                                  : 'center',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent',
                      }
                    : {
                          color: solidColor || undefined,
                      }),
            };

            return (
                <span
                    className="relative inline-block isolate"
                    // index is the only stable unique identifier for character position in dynamic text
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    style={charStyle}
                >
                    {hasGlow && (
                        <>
                            {/* Inner intense glow */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 select-none pointer-events-none"
                                style={{
                                    ...charStyle,
                                    filter: `blur(${1 * glowIntensity}px) brightness(${1 + glowIntensity})`,
                                    opacity: Math.min(
                                        1,
                                        0.8 + glowIntensity * 0.2,
                                    ),
                                    zIndex: 'var(--z-effect-sm)',
                                    color: hasGradient
                                        ? undefined
                                        : solidColor || undefined,
                                    backgroundImage: hasGradient
                                        ? `${gradientFunction}(${gradientArgs})`
                                        : undefined,
                                    WebkitTextFillColor: hasGradient
                                        ? 'transparent'
                                        : undefined,
                                }}
                            >
                                {char}
                            </span>
                            {/* Middle soft glow */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 select-none pointer-events-none"
                                style={{
                                    ...charStyle,
                                    filter: `blur(${2.5 * glowIntensity}px) brightness(${1 + glowIntensity * 0.8})`,
                                    opacity: Math.min(
                                        0.9,
                                        0.6 + glowIntensity * 0.2,
                                    ),
                                    zIndex: 'var(--z-effect-md)',
                                    color: hasGradient
                                        ? undefined
                                        : solidColor || undefined,
                                    backgroundImage: hasGradient
                                        ? `${gradientFunction}(${gradientArgs})`
                                        : undefined,
                                    WebkitTextFillColor: hasGradient
                                        ? 'transparent'
                                        : undefined,
                                }}
                            >
                                {char}
                            </span>
                            {/* Outer broad glow */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 select-none pointer-events-none"
                                style={{
                                    ...charStyle,
                                    filter: `blur(${4 * glowIntensity}px) brightness(${1 + glowIntensity * 0.5})`,
                                    opacity: Math.min(
                                        0.8,
                                        0.4 + glowIntensity * 0.2,
                                    ),
                                    zIndex: 'var(--z-effect-lg)',
                                    color: hasGradient
                                        ? undefined
                                        : solidColor || undefined,
                                    backgroundImage: hasGradient
                                        ? `${gradientFunction}(${gradientArgs})`
                                        : undefined,
                                    WebkitTextFillColor: hasGradient
                                        ? 'transparent'
                                        : undefined,
                                }}
                            >
                                {char}
                            </span>
                        </>
                    )}
                    {char}
                </span>
            );
        });
    };

    const content =
        typeof children === 'string' ? renderStyledText(children) : children;

    return (
        <Text
            className={cn(
                'font-medium truncate text-sm w-fit inline-flex items-center',
                className,
            )}
            style={containerStyle}
        >
            {content}
        </Text>
    );
};
