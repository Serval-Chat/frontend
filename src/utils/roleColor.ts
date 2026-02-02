import type React from 'react';

import type { Role } from '@/api/servers/servers.types';

/**
 * @description Generates CSS properties for a role's colors
 */
export const getRoleStyle = (role?: Role): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (!role) {
        style.backgroundColor = 'var(--divider)';
        return style;
    }

    if (role.colors && role.colors.length >= 2) {
        const repeat =
            role.gradientRepeat && role.gradientRepeat > 1
                ? role.gradientRepeat
                : 1;
        if (repeat > 1) {
            const stop = (100 / repeat).toFixed(2);
            style.background = `repeating-linear-gradient(90deg, ${role.colors.join(
                ', ',
            )} ${stop}%)`;
        } else {
            style.background = `linear-gradient(90deg, ${role.colors.join(
                ', ',
            )})`;
        }
    } else if (role.startColor && role.endColor) {
        if (role.startColor === role.endColor) {
            style.backgroundColor = role.startColor;
        } else {
            style.background = `linear-gradient(90deg, ${role.startColor}, ${role.endColor})`;
        }
    } else if (role.color) {
        style.backgroundColor = role.color;
    } else {
        style.backgroundColor = 'var(--primary)';
    }

    return style;
};
