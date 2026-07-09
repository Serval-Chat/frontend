import type { User } from '@/api/users/users.types';

interface RGB {
    r: number;
    g: number;
    b: number;
}

function parseToRgb(colorStr: string): RGB | null {
    const cleaned = colorStr.trim().toLowerCase();
    if (cleaned.startsWith('#')) {
        const hex = cleaned.slice(1);
        if (hex.length === 3) {
            const r = hex.charAt(0);
            const g = hex.charAt(1);
            const b = hex.charAt(2);
            return {
                r: Number.parseInt(r + r, 16),
                g: Number.parseInt(g + g, 16),
                b: Number.parseInt(b + b, 16),
            };
        } else if (hex.length === 6) {
            return {
                r: Number.parseInt(hex.slice(0, 2), 16),
                g: Number.parseInt(hex.slice(2, 4), 16),
                b: Number.parseInt(hex.slice(4, 6), 16),
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
                if (c) {
                    return `\u001B[38;2;${c.r};${c.g};${c.b}m${name}\u001B[0m`;
                }
            } else {
                let result = '';
                const len = name.length;
                for (let i = 0; i < len; i++) {
                    const char = name[i];
                    const t = i / (len - 1);
                    const scaledT = t * (rgbList.length - 1);
                    const idx = Math.floor(scaledT);
                    const nextIdx = Math.min(idx + 1, rgbList.length - 1);
                    const localT = scaledT - idx;

                    const from = rgbList[idx];
                    const to = rgbList[nextIdx];
                    if (from && to) {
                        const c = interpolateRgb(from, to, localT);
                        result += `\u001B[38;2;${c.r};${c.g};${c.b}m${char}`;
                    }
                }
                result += '\u001B[0m';
                return result;
            }
        }
    }

    if (user.usernameGlow?.enabled && user.usernameGlow.color) {
        const c = parseToRgb(user.usernameGlow.color);
        if (c) {
            return `\u001B[38;2;${c.r};${c.g};${c.b}m${name}\u001B[0m`;
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
    return `\u001B[38;2;${c.r};${c.g};${c.b}m${badgeName}\u001B[0m`;
}
