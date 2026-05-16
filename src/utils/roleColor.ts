import type React from 'react';

import type { Role } from '@/api/servers/servers.types';

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

const DEFAULT_ROLE_COLOR = '#99aab5';
const DARK_GLYPH_COLOR = '#111827';
const LIGHT_GLYPH_COLOR = '#ffffff';
const DARK_GLYPH_RGB = { r: 17, g: 24, b: 39 };
const LIGHT_GLYPH_RGB = { r: 255, g: 255, b: 255 };
const DARK_GLYPH_HALO =
    '0 0 1px rgba(255, 255, 255, 0.85), 0 1px 1px rgba(255, 255, 255, 0.45)';
const LIGHT_GLYPH_HALO =
    '0 0 1px rgba(0, 0, 0, 0.85), 0 1px 1px rgba(0, 0, 0, 0.55)';

const clamp = (value: number, min = 0, max = 1): number =>
    Math.min(max, Math.max(min, value));

const normalizeHex = (value: string): string | null => {
    const hex = value.trim().replace(/^#/, '');

    if (/^[0-9a-f]{3}$/i.test(hex) || /^[0-9a-f]{4}$/i.test(hex)) {
        return hex
            .slice(0, 3)
            .split('')
            .map((char) => char + char)
            .join('');
    }

    if (/^[0-9a-f]{6}$/i.test(hex) || /^[0-9a-f]{8}$/i.test(hex)) {
        return hex.slice(0, 6);
    }

    return null;
};

export const parseCssColor = (color: string): RgbColor | null => {
    const trimmed = color.trim();
    const hex = normalizeHex(trimmed);

    if (hex) {
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    const rgbMatch = trimmed.match(
        /^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)/i,
    );

    if (!rgbMatch) return null;

    return {
        r: clamp(Number(rgbMatch[1]) / 255) * 255,
        g: clamp(Number(rgbMatch[2]) / 255) * 255,
        b: clamp(Number(rgbMatch[3]) / 255) * 255,
    };
};

const mixRgb = (from: RgbColor, to: RgbColor, amount: number): RgbColor => ({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
});

const relativeLuminance = ({ r, g, b }: RgbColor): number => {
    const toLinear = (channel: number): number => {
        const normalized = channel / 255;

        return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

const contrastRatio = (a: RgbColor, b: RgbColor): number => {
    const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
    const darker = Math.min(relativeLuminance(a), relativeLuminance(b));

    return (lighter + 0.05) / (darker + 0.05);
};

const getReadableGlyphColor = (background: RgbColor): string => {
    const darkContrast = contrastRatio(background, DARK_GLYPH_RGB);
    const lightContrast = contrastRatio(background, LIGHT_GLYPH_RGB);

    return darkContrast >= lightContrast ? DARK_GLYPH_COLOR : LIGHT_GLYPH_COLOR;
};

const getReadableGlyphShadow = (color: string): string => {
    if (color === DARK_GLYPH_COLOR) return DARK_GLYPH_HALO;

    return LIGHT_GLYPH_HALO;
};

const getRoleColorStops = (role?: Role): string[] => {
    if (!role) return ['var(--divider)'];

    if (role.colors && role.colors.length >= 2) {
        return role.colors;
    }

    if (role.colors && role.colors.length === 1) {
        return [role.colors[0]];
    }

    if (role.startColor && role.endColor) {
        return [role.startColor, role.endColor];
    }

    if (role.color) {
        return [role.color];
    }

    return [DEFAULT_ROLE_COLOR];
};

const sampleStops = (colors: RgbColor[], position: number): RgbColor => {
    if (colors.length === 0) return { r: 153, g: 170, b: 181 };
    if (colors.length === 1) return colors[0];

    const scaledPosition = clamp(position) * (colors.length - 1);
    const leftIndex = Math.floor(scaledPosition);
    const rightIndex = Math.min(colors.length - 1, leftIndex + 1);
    const segmentPosition = scaledPosition - leftIndex;

    return mixRgb(colors[leftIndex], colors[rightIndex], segmentPosition);
};

export const getRoleBackgroundColorAt = (
    role: Role | undefined,
    position: number,
): RgbColor => {
    const stops = getRoleColorStops(role)
        .map(parseCssColor)
        .filter((color): color is RgbColor => Boolean(color));

    if (!role || stops.length === 0) {
        return parseCssColor(DEFAULT_ROLE_COLOR) as RgbColor;
    }

    const repeat =
        role.colors &&
        role.colors.length >= 2 &&
        role.gradientRepeat &&
        role.gradientRepeat > 1
            ? role.gradientRepeat
            : 1;
    const repeatedPosition =
        repeat > 1 ? (clamp(position) * repeat) % 1 : clamp(position);

    return sampleStops(stops, repeatedPosition);
};

export const getReadableRoleTextColorAt = (
    role: Role | undefined,
    position: number,
): string => getReadableGlyphColor(getRoleBackgroundColorAt(role, position));

export const getReadableRoleTextStyleAt = (
    role: Role | undefined,
    position: number,
): React.CSSProperties => {
    const color = getReadableRoleTextColorAt(role, position);

    return {
        color,
        textShadow: getReadableGlyphShadow(color),
    };
};

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
    } else if (role.colors && role.colors.length === 1) {
        style.backgroundColor = role.colors[0];
    } else if (role.startColor && role.endColor) {
        if (role.startColor === role.endColor) {
            style.backgroundColor = role.startColor;
        } else {
            style.background = `linear-gradient(90deg, ${role.startColor}, ${role.endColor})`;
        }
    } else if (role.color) {
        style.backgroundColor = role.color;
    } else {
        style.backgroundColor = DEFAULT_ROLE_COLOR;
    }

    return style;
};
