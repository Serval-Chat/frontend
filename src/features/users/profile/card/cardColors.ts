const yiqOf = (hex: string): number => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

export const shouldApplyDarkFilter = (hex: string): boolean => yiqOf(hex) < 128;

export const mixHex = (a: string, b: string, t: number): string => {
    const ar = Number.parseInt(a.slice(1, 3), 16),
        ag = Number.parseInt(a.slice(3, 5), 16),
        ab = Number.parseInt(a.slice(5, 7), 16);
    const br = Number.parseInt(b.slice(1, 3), 16),
        bg = Number.parseInt(b.slice(3, 5), 16),
        bb = Number.parseInt(b.slice(5, 7), 16);
    return `#${Math.round(ar + (br - ar) * t)
        .toString(16)
        .padStart(2, '0')}${Math.round(ag + (bg - ag) * t)
        .toString(16)
        .padStart(2, '0')}${Math.round(ab + (bb - ab) * t)
        .toString(16)
        .padStart(2, '0')}`;
};

const toHex = ([r, g, b]: [number, number, number]): string =>
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

const toRgba = ([r, g, b]: [number, number, number], a: number): string =>
    `rgba(${String(r)},${String(g)},${String(b)},${String(a)})`;

export const cardTextVars = (
    primary: string,
): { vars: Record<string, string>; color: string } => {
    const onDark = yiqOf(primary) < 128;
    const fg: [number, number, number] = onDark ? [255, 255, 255] : [0, 0, 0];
    const fgMuted: [number, number, number] = onDark
        ? [213, 213, 213]
        : [30, 30, 30];
    const neutral = onDark
        ? ([255, 255, 255] as [number, number, number])
        : ([0, 0, 0] as [number, number, number]);
    const fgHex = toHex(fg);
    const fgMutedHex = toHex(fgMuted);
    const fgMutedHoverHex = onDark ? '#ffffff' : '#000000';
    const vars: Record<string, string> = {
        '--color-foreground': fgHex,
        '--color-muted-foreground': fgMutedHex,
        '--color-muted-foreground-hover': fgMutedHoverHex,
        '--color-text-subtle': fgMutedHex,
        '--color-text-normal': fgHex,
        '--color-border-subtle': toRgba(neutral, 0.15),
        '--color-bg-secondary': toRgba(neutral, 0.1),
        '--foreground': fgHex,
        '--muted-foreground': fgMutedHex,
        '--muted-foreground-hover': fgMutedHoverHex,
        '--text-normal': fgHex,
        '--text-subtle': fgMutedHex,
        '--border-subtle': toRgba(neutral, 0.15),
        '--bg-secondary': toRgba(neutral, 0.1),
        '--divider': toRgba(neutral, 0.12),
        '--placeholder': toRgba(neutral, 0.3),
    };
    return { vars, color: fgHex };
};
