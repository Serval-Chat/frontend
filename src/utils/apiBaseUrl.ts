const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1']);

export const getConfiguredApiBaseUrl = (): string =>
    (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const isLocalDevApiBaseUrl = (baseUrl: string): boolean => {
    if (!import.meta.env.DEV || baseUrl === '') return false;

    try {
        const parsed = new URL(baseUrl);
        return LOCAL_API_HOSTS.has(parsed.hostname);
    } catch {
        return false;
    }
};

export const getBrowserApiBaseUrl = (): string => {
    const baseUrl = getConfiguredApiBaseUrl();
    return isLocalDevApiBaseUrl(baseUrl) ? '' : baseUrl;
};
