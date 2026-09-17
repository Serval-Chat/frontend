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
    } catch {
        return true;
    }

    return false;
};

const YOUTUBE_EMBED_HOSTS = new Set([
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'youtube-nocookie.com',
]);

export const isSafeYoutubeEmbedUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === 'https:' &&
            YOUTUBE_EMBED_HOSTS.has(parsed.hostname.toLowerCase())
        );
    } catch {
        return false;
    }
};

export const isSafeVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
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
