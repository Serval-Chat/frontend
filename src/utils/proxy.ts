import {
    getBrowserApiBaseUrl,
    getConfiguredApiBaseUrl,
} from '@/utils/apiBaseUrl';

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
        const currentOrigin = globalThis.location.origin;
        const configuredApiBaseUrl = getConfiguredApiBaseUrl();
        const browserApiBaseUrl = getBrowserApiBaseUrl();

        if (currentOrigin !== '' && parsedUrl.origin === currentOrigin)
            return true;

        if (configuredApiBaseUrl !== '') {
            try {
                if (parsedUrl.origin === new URL(configuredApiBaseUrl).origin)
                    return true;
            } catch {
                /* relative apiBaseUrl */
            }
            if (url.startsWith(configuredApiBaseUrl)) return true;
        }

        if (browserApiBaseUrl !== '' && url.startsWith(browserApiBaseUrl)) {
            return true;
        }

        if (url.includes('/api/v1/files/download/')) return true;
    } catch {
        return true;
    }

    return false;
};

export const getSafeUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (isInternalUrl(url)) return url;

    const browserApiBaseUrl = getBrowserApiBaseUrl();
    const baseUrl =
        browserApiBaseUrl === ''
            ? getConfiguredApiBaseUrl()
            : browserApiBaseUrl;
    return `${baseUrl}/api/v1/embed/proxy?url=${encodeURIComponent(url)}`;
};
