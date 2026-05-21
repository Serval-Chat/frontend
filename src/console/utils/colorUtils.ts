import type { User } from '@/api/users/users.types';

interface RGB {
    r: number;
    g: number;
    b: number;
}

function parseToRgb(colorStr: string): RGB | null {
    const cleaned = colorStr.trim().toLowerCase();
    if (cleaned.startsWith('#')) {
        const hex = cleaned.substring(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16),
            };
        }
    } else if (cleaned.startsWith('rgb')) {
        const match = cleaned.match(/\d+/g);
        if (match && match.length >= 3) {
            return {
                r: Number(match[0]),
                g: Number(match[1]),
                b: Number(match[2]),
            };
        }
    }
    return null;
}

function interpolateRgb(c1: RGB, c2: RGB, t: number): RGB {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t),
    };
}

export function getAnsiDisplayName(user: User): string {
    const name = user.displayName;
    if (!name) return '';

    if (
        user.usernameGradient?.enabled &&
        user.usernameGradient.colors &&
        user.usernameGradient.colors.length > 0
    ) {
        const colors = user.usernameGradient.colors;
        const rgbList = colors
            .map(parseToRgb)
            .filter((c): c is RGB => c !== null);

        if (rgbList.length > 0) {
            if (rgbList.length === 1 || name.length <= 1) {
                const c = rgbList[0];
                return `\u001b[38;2;${c.r};${c.g};${c.b}m${name}\u001b[0m`;
            }

            let result = '';
            const len = name.length;
            for (let i = 0; i < len; i++) {
                const char = name[i];
                const t = i / (len - 1);
                const scaledT = t * (rgbList.length - 1);
                const idx = Math.floor(scaledT);
                const nextIdx = Math.min(idx + 1, rgbList.length - 1);
                const localT = scaledT - idx;

                const c = interpolateRgb(
                    rgbList[idx],
                    rgbList[nextIdx],
                    localT,
                );
                result += `\u001b[38;2;${c.r};${c.g};${c.b}m${char}`;
            }
            result += '\u001b[0m';
            return result;
        }
    }

    if (user.usernameGlow?.enabled && user.usernameGlow.color) {
        const c = parseToRgb(user.usernameGlow.color);
        if (c) {
            return `\u001b[38;2;${c.r};${c.g};${c.b}m${name}\u001b[0m`;
        }
    }

    return name;
}

export function getAnsiUsername(user: User): string {
    return user.username || '';
}

export function getAnsiColoredBadge(
    badgeName: string,
    colorStr?: string,
): string {
    if (!colorStr) return badgeName;
    const c = parseToRgb(colorStr);
    if (!c) return badgeName;
    return `\u001b[38;2;${c.r};${c.g};${c.b}m${badgeName}\u001b[0m`;
}
