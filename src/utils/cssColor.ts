/**
 * Resolves a CSS custom-property token to `#rrggbb`.
 */
export const cssTokenToHex = (
    token: string,
    resolve: (decl: string) => string,
): string => {
    const trimmed = token.trim();
    if (trimmed === '') return '#000000';

    const computed = resolve(trimmed);

    const rgb = computed.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (rgb === null) return '#000000';
    return `#${rgb
        .slice(1, 4)
        .map((c: string): string => Number(c).toString(16).padStart(2, '0'))
        .join('')}`;
};
