export const isAnimatedImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;

    const normalized = url.toLowerCase();
    return (
        /\.(gif|gifv)(?:[?#].*)?$/.test(normalized) ||
        normalized.includes('/gif/') ||
        normalized.includes('contenttype=gif') ||
        normalized.includes('content-type=gif')
    );
};
