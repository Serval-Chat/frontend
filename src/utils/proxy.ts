const isTauri = (): boolean =>
    typeof window !== 'undefined' &&
    (window as Window & { __TAURI__?: unknown }).__TAURI__ !== undefined;

export const isInternalUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    if (url.startsWith('//')) return false;

    if (
        url.startsWith('/') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
    ) {
        return true;
    }

    try {
        const parsedUrl = new URL(url);
        const currentOrigin =
            typeof window !== 'undefined' ? window.location.origin : '';
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

        if (currentOrigin && parsedUrl.origin === currentOrigin) return true;

        if (apiBaseUrl) {
            try {
                if (parsedUrl.origin === new URL(apiBaseUrl).origin)
                    return true;
            } catch {
                /* relative apiBaseUrl */
            }
            if (url.startsWith(apiBaseUrl)) return true;
        }

        if (url.includes('catfla.re/api/v1/files/download/')) return true;
    } catch {
        return true;
    }

    return false;
};

export const getProxyUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (isInternalUrl(url)) return url;

    try {
        if (new URL(url).pathname.includes('/api/v1/file-proxy')) return url;
    } catch {
        /* invalid URL */
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const baseUrl = isTauri() ? apiBaseUrl : '';

    return `${baseUrl}/api/v1/file-proxy?url=${encodeURIComponent(url)}`;
};
