import type React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';

interface UsernameColorResolverInput {
    user?: User;
    role?: Role;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
}

interface ResolverStep {
    order: number;
    source: string;
    outcome: string;
    reason: string;
    data?: unknown;
}

export interface UsernameColorResolution {
    effectiveDisableColors: boolean;
    effectiveDisableGlow: boolean;
    gradientFunction: string;
    gradientArgs: string;
    hasGradient: boolean;
    fallbackColor: string;
    solidColor: string;
    colorSource: 'none' | 'role' | 'user' | 'fallback';
    hasGlow: boolean;
    glowColor?: string;
    steps: ResolverStep[];
}

const DEFAULT_ROLE_COLOR = '#99aab5';

const isDefaultRoleColor = (color: string): boolean =>
    color.toLowerCase() === DEFAULT_ROLE_COLOR;

const pushStep = (
    steps: ResolverStep[],
    source: string,
    outcome: string,
    reason: string,
    data?: unknown,
): void => {
    steps.push({
        order: steps.length + 1,
        source,
        outcome,
        reason,
        data,
    });
};

export const resolveUsernameColor = ({
    user,
    role,
    disableGlowAndColors,
    disableColors,
    disableGlow,
}: UsernameColorResolverInput): UsernameColorResolution => {
    const effectiveDisableColors = Boolean(
        disableGlowAndColors || disableColors,
    );
    const effectiveDisableGlow = Boolean(disableGlowAndColors || disableGlow);
    const usernameGlow = user?.usernameGlow;
    const steps: ResolverStep[] = [];

    let gradientFunction = 'linear-gradient';
    let gradientArgs = '90deg, transparent, transparent';
    let hasGradient = false;
    let fallbackColor = '';
    let solidColor = '';
    let colorSource: 'none' | 'role' | 'user' | 'fallback' = 'none';

    pushStep(
        steps,
        'flags',
        `custom colors ${effectiveDisableColors ? 'disabled' : 'enabled'}, glow ${effectiveDisableGlow ? 'disabled' : 'enabled'}`,
        'Computed from disableGlowAndColors, disableColors, and disableGlow props.',
        { disableGlowAndColors, disableColors, disableGlow },
    );

    if (role) {
        if (role.colors && role.colors.length > 0) {
            const uniqueColors = new Set(role.colors);
            if (uniqueColors.size === 1) {
                const color = role.colors[0];
                if (!isDefaultRoleColor(color)) {
                    solidColor = color;
                    colorSource = 'role';
                    pushStep(
                        steps,
                        'role.colors',
                        `solid ${color}`,
                        'Role colors contained one non-default unique color.',
                        { colors: role.colors },
                    );
                } else {
                    fallbackColor = color;
                    pushStep(
                        steps,
                        'role.colors',
                        `fallback ${color}`,
                        'Role colors only contained the default role color, so user custom colors may still override it.',
                        { colors: role.colors },
                    );
                }
            } else {
                hasGradient = true;
                colorSource = 'role';
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
                pushStep(
                    steps,
                    'role.colors',
                    `${gradientFunction}(${gradientArgs})`,
                    'Role colors contained multiple unique colors, so role gradient wins.',
                    {
                        colors: role.colors,
                        gradientRepeat: role.gradientRepeat,
                    },
                );
            }
        } else if (role.startColor && role.endColor) {
            if (role.startColor === role.endColor) {
                if (!isDefaultRoleColor(role.startColor)) {
                    solidColor = role.startColor;
                    colorSource = 'role';
                    pushStep(
                        steps,
                        'role.startColor/endColor',
                        `solid ${role.startColor}`,
                        'Role start and end colors matched and were not the default color.',
                        {
                            startColor: role.startColor,
                            endColor: role.endColor,
                        },
                    );
                } else {
                    fallbackColor = role.startColor;
                    pushStep(
                        steps,
                        'role.startColor/endColor',
                        `fallback ${role.startColor}`,
                        'Role start and end colors matched the default role color, so user custom colors may still override it.',
                        {
                            startColor: role.startColor,
                            endColor: role.endColor,
                        },
                    );
                }
            } else {
                hasGradient = true;
                colorSource = 'role';
                gradientArgs = `90deg, ${role.startColor}, ${role.endColor}`;
                pushStep(
                    steps,
                    'role.startColor/endColor',
                    `${gradientFunction}(${gradientArgs})`,
                    'Role start and end colors differed, so role gradient wins.',
                    {
                        startColor: role.startColor,
                        endColor: role.endColor,
                    },
                );
            }
        } else if (role.color) {
            if (!isDefaultRoleColor(role.color)) {
                solidColor = role.color;
                colorSource = 'role';
                pushStep(
                    steps,
                    'role.color',
                    `solid ${role.color}`,
                    'Role color was set and was not the default color.',
                    { color: role.color },
                );
            } else {
                fallbackColor = role.color;
                pushStep(
                    steps,
                    'role.color',
                    `fallback ${role.color}`,
                    'Role color was the default role color, so user custom colors may still override it.',
                    { color: role.color },
                );
            }
        } else {
            pushStep(
                steps,
                'role',
                'no color',
                'Role was provided but had no color fields.',
                role,
            );
        }
    } else {
        pushStep(
            steps,
            'role',
            'not provided',
            'No role was provided to the username renderer.',
        );
    }

    if (
        !hasGradient &&
        !solidColor &&
        user?.usernameGradient?.enabled &&
        !effectiveDisableColors
    ) {
        const { colors, angle, repeating } = user.usernameGradient;
        if (colors.length > 0) {
            if (colors.length === 1) {
                solidColor = colors[0];
                colorSource = 'user';
                pushStep(
                    steps,
                    'user.usernameGradient',
                    `solid ${colors[0]}`,
                    'User custom username colors were enabled and contained one color.',
                    user.usernameGradient,
                );
            } else {
                hasGradient = true;
                colorSource = 'user';
                gradientFunction = repeating
                    ? 'repeating-linear-gradient'
                    : 'linear-gradient';
                gradientArgs = `${angle}deg, ${colors.join(', ')}`;
                pushStep(
                    steps,
                    'user.usernameGradient',
                    `${gradientFunction}(${gradientArgs})`,
                    'User custom username colors were enabled and no non-default role color had already won.',
                    user.usernameGradient,
                );
            }
        } else {
            pushStep(
                steps,
                'user.usernameGradient',
                'ignored',
                'User gradient was enabled but had no colors.',
                user.usernameGradient,
            );
        }
    } else {
        pushStep(
            steps,
            'user.usernameGradient',
            'skipped',
            effectiveDisableColors
                ? 'Custom username colors are disabled.'
                : hasGradient || solidColor
                  ? 'A role color or role gradient already won.'
                  : 'User gradient was missing or disabled.',
            user?.usernameGradient,
        );
    }

    if (!hasGradient && !solidColor && fallbackColor) {
        solidColor = fallbackColor;
        colorSource = 'fallback';
        pushStep(
            steps,
            'fallback role color',
            `solid ${fallbackColor}`,
            'No user custom color or non-default role color won, so the default role color is used.',
        );
    }

    const roleColorWon = colorSource === 'role';
    const roleGlowAllowed =
        !!role && role.glowEnabled !== false && (!!solidColor || hasGradient);
    const userGlowAllowed = usernameGlow?.enabled && !roleColorWon;
    const hasGlow =
        !effectiveDisableGlow &&
        (roleColorWon ? roleGlowAllowed : userGlowAllowed || roleGlowAllowed);
    const glowColor = hasGlow
        ? userGlowAllowed
            ? usernameGlow.color || solidColor || undefined
            : solidColor || undefined
        : undefined;

    pushStep(
        steps,
        'glow',
        hasGlow ? `enabled${glowColor ? ` with ${glowColor}` : ''}` : 'off',
        effectiveDisableGlow
            ? 'Glow is disabled by props.'
            : roleColorWon && roleGlowAllowed
              ? 'Role color won, so role glow uses the resolved role color and user glow color is ignored.'
              : roleColorWon
                ? 'Role color won, but role glow is disabled.'
                : userGlowAllowed
                  ? 'User username glow is enabled.'
                  : roleGlowAllowed
                    ? 'Role glow is allowed and a rendered color exists.'
                    : 'No glow source applied.',
        {
            usernameGlow,
            roleGlowEnabled: role?.glowEnabled,
            hasRenderedColor: !!solidColor || hasGradient,
            colorSource,
        },
    );

    pushStep(
        steps,
        'final',
        hasGradient
            ? `${gradientFunction}(${gradientArgs})`
            : solidColor || 'unstyled inherited color',
        hasGradient
            ? 'Username renders as gradient text.'
            : solidColor
              ? 'Username renders as solid text.'
              : 'Username inherits color from surrounding text.',
    );

    return {
        effectiveDisableColors,
        effectiveDisableGlow,
        gradientFunction,
        gradientArgs,
        hasGradient,
        fallbackColor,
        solidColor,
        colorSource,
        hasGlow,
        glowColor,
        steps,
    };
};

export const buildUsernameColorResolverReport = (
    input: UsernameColorResolverInput & {
        label?: string;
        renderedName?: React.ReactNode;
        extraData?: Record<string, unknown>;
    },
): string => {
    const resolution = resolveUsernameColor(input);

    return JSON.stringify(
        {
            label: input.label,
            renderedName:
                typeof input.renderedName === 'string'
                    ? input.renderedName
                    : undefined,
            final: {
                color: resolution.hasGradient
                    ? `${resolution.gradientFunction}(${resolution.gradientArgs})`
                    : resolution.solidColor || null,
                hasGradient: resolution.hasGradient,
                solidColor: resolution.solidColor || null,
                fallbackColor: resolution.fallbackColor || null,
                colorSource: resolution.colorSource,
                hasGlow: resolution.hasGlow,
                glowColor: resolution.glowColor || null,
                effectiveDisableColors: resolution.effectiveDisableColors,
                effectiveDisableGlow: resolution.effectiveDisableGlow,
            },
            order: resolution.steps,
            providedData: {
                props: {
                    disableGlowAndColors: input.disableGlowAndColors,
                    disableColors: input.disableColors,
                    disableGlow: input.disableGlow,
                },
                user: input.user
                    ? {
                          _id: input.user._id,
                          username: input.user.username,
                          displayName: input.user.displayName,
                          usernameGradient: input.user.usernameGradient,
                          usernameGlow: input.user.usernameGlow,
                          settings: input.user.settings,
                      }
                    : undefined,
                role: input.role
                    ? {
                          _id: input.role._id,
                          name: input.role.name,
                          position: input.role.position,
                          color: input.role.color,
                          colors: input.role.colors,
                          startColor: input.role.startColor,
                          endColor: input.role.endColor,
                          gradientRepeat: input.role.gradientRepeat,
                          glowEnabled: input.role.glowEnabled,
                      }
                    : undefined,
                extra: input.extraData,
            },
        },
        null,
        2,
    );
};
