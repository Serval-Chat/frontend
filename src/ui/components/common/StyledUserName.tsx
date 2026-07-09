import React, { useEffect } from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { resolveUsernameColor } from '@/utils/usernameColorResolver';

import { Text } from './Text';

interface StyledUserNameProps {
    user?: User;
    role?: Role;
    children: React.ReactNode;
    className?: string;
    disableCustomFonts?: boolean;
    glowIntensity?: number;
    disableGlowAndColors?: boolean; // legacy
    disableColors?: boolean;
    disableGlow?: boolean;
    showIcon?: boolean;
    iconRole?: Role;
}

const glowIntensity = 0.7;

const SUPPORTED_USERNAME_FONTS = [
    'default',
    'Audiowide',
    'Bebas Neue',
    'Betania Patmos',
    'Google Sans Code',
    'Noto Sans',
    'Pacifico',
    'Playpen Sans Deva',
    'Rampart One',
    'Roboto',
    'Workbench',
] as const;

const FONT_IMPORTS: Partial<
    Record<(typeof SUPPORTED_USERNAME_FONTS)[number], string>
> = {
    Audiowide:
        'https://fonts.googleapis.com/css2?family=Audiowide&display=swap',
    'Bebas Neue':
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    'Betania Patmos':
        'https://fonts.googleapis.com/css2?family=Betania+Patmos&display=swap',
    'Google Sans Code':
        'https://fonts.googleapis.com/css2?family=Google+Sans+Code&display=swap',
    'Noto Sans':
        'https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap',
    Pacifico: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    'Playpen Sans Deva':
        'https://fonts.googleapis.com/css2?family=Playpen+Sans+Deva&display=swap',
    'Rampart One':
        'https://fonts.googleapis.com/css2?family=Rampart+One&display=swap',
    Roboto: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
    Workbench:
        'https://fonts.googleapis.com/css2?family=Workbench&display=swap',
};

const loadedUsernameFonts = new Set<string>();

const loadUsernameFont = (font: string): void => {
    const href =
        FONT_IMPORTS[font as keyof typeof FONT_IMPORTS] ||
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replaceAll('%20', '+')}&display=swap`;

    if (loadedUsernameFonts.has(href)) return;

    loadedUsernameFonts.add(href);

    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[data-username-font][href="${href}"]`)) {
        return;
    }

    const link = document.createElement('link');
    link.dataset.usernameFont = 'true';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
};

export const StyledUserName = React.memo(
    ({
        user,
        role,
        children,
        className,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        showIcon = false,
        iconRole,
    }: StyledUserNameProps) => {
        let usernameFont = disableCustomFonts ? undefined : user?.usernameFont;

        if (
            usernameFont &&
            !SUPPORTED_USERNAME_FONTS.includes(
                usernameFont as (typeof SUPPORTED_USERNAME_FONTS)[number],
            )
        ) {
            usernameFont = undefined;
        }

        useEffect((): void => {
            if (usernameFont && usernameFont !== 'default') {
                loadUsernameFont(usernameFont);
            }
        }, [usernameFont]);

        if (!user && !role) {
            return (
                <Text className={cn('truncate text-sm font-medium', className)}>
                    {children}
                </Text>
            );
        }

        const {
            gradientFunction,
            gradientArgs,
            hasGradient,
            solidColor,
            hasGlow,
            glowColor,
        } = resolveUsernameColor({
            user,
            role,
            disableGlowAndColors,
            disableColors,
            disableGlow,
        });

        const containerStyle: React.CSSProperties = {
            fontFamily:
                usernameFont && usernameFont !== 'default'
                    ? usernameFont
                    : undefined,
            color: !hasGradient && solidColor ? solidColor : undefined,
            ...(hasGradient && {
                backgroundImage: `${gradientFunction}(${gradientArgs})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
            }),
            ...(hasGlow && {
                textShadow: hasGradient
                    ? undefined
                    : `0 0 ${1.5 * glowIntensity}px ${solidColor || 'currentColor'}`,
            }),
        };

        // helper to render text with per-character effects
        const renderStyledText = (text: string): React.ReactNode[] => {
            const chars = text.split('');
            const totalChars = chars.length;

            const baseStyle: React.CSSProperties = hasGradient
                ? {
                      display: 'inline-block',
                      whiteSpace: 'pre',
                      padding: '0 0.125px',
                      backgroundImage: `${gradientFunction}(${gradientArgs})`,
                      backgroundSize: `${totalChars * 100}% 100%`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                  }
                : {
                      display: 'inline-block',
                      whiteSpace: 'pre',
                      padding: '0 0.125px',
                      color: solidColor || undefined,
                  };

            const glowColorStyle = hasGradient
                ? {
                      backgroundImage: `${gradientFunction}(${gradientArgs})`,
                      WebkitTextFillColor: 'transparent' as const,
                  }
                : {
                      color: glowColor || undefined,
                  };

            return chars.map((char, i) => {
                const charStyle: React.CSSProperties = hasGradient
                    ? {
                          ...baseStyle,
                          backgroundPosition:
                              totalChars > 1
                                  ? `${(i / (totalChars - 1)) * 100}% 0%`
                                  : 'center',
                      }
                    : baseStyle;

                return (
                    <span
                        className="relative isolate inline-block"
                        // eslint-disable-next-line react/no-array-index-key
                        key={`char-${char}-${i}`}
                        style={charStyle}
                    >
                        {hasGlow ? (
                            <>
                                {/* Inner intense glow */}
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 select-none"
                                    style={{
                                        ...charStyle,
                                        filter: `blur(${1 * glowIntensity}px) brightness(${1 + glowIntensity})`,
                                        opacity: Math.min(
                                            1,
                                            0.8 + glowIntensity * 0.2,
                                        ),
                                        zIndex: 'var(--z-index-effect-sm)',
                                        ...glowColorStyle,
                                    }}
                                >
                                    {char}
                                </span>
                                {/* Middle soft glow */}
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 select-none"
                                    style={{
                                        ...charStyle,
                                        filter: `blur(${2.5 * glowIntensity}px) brightness(${1 + glowIntensity * 0.8})`,
                                        opacity: Math.min(
                                            0.9,
                                            0.6 + glowIntensity * 0.2,
                                        ),
                                        zIndex: 'var(--z-index-effect-md)',
                                        ...glowColorStyle,
                                    }}
                                >
                                    {char}
                                </span>
                                {/* Outer broad glow */}
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 select-none"
                                    style={{
                                        ...charStyle,
                                        filter: `blur(${4 * glowIntensity}px) brightness(${1 + glowIntensity * 0.5})`,
                                        opacity: Math.min(
                                            0.8,
                                            0.4 + glowIntensity * 0.2,
                                        ),
                                        zIndex: 'var(--z-index-effect-lg)',
                                        ...glowColorStyle,
                                    }}
                                >
                                    {char}
                                </span>
                            </>
                        ) : null}
                        {char}
                    </span>
                );
            });
        };

        const content =
            typeof children === 'string'
                ? renderStyledText(children)
                : Array.isArray(children) &&
                    children.length === 1 &&
                    typeof children[0] === 'string'
                  ? renderStyledText(children[0])
                  : children;

        return (
            <Text
                className={cn(
                    'inline-flex w-fit items-center truncate text-sm font-medium',
                    className,
                )}
                style={containerStyle}
            >
                {content}
                {showIcon && (iconRole?.icon || role?.icon) ? (
                    <img
                        alt=""
                        className="ml-1.5 h-4 w-4 object-contain"
                        src={
                            resolveApiUrl(
                                `/api/v1/servers/${(iconRole || role!).serverId}/roles/icon/${iconRole?.icon || role?.icon}`,
                            ) || ''
                        }
                    />
                ) : null}
            </Text>
        );
    },
);

StyledUserName.displayName = 'StyledUserName';
