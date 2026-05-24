import { getConfiguredApiBaseUrl } from '@/utils/apiBaseUrl';

const SERVER_BANNER_PATH = '/api/v1/servers/banner/';

export const resolveServerBannerUrl = (
    value: string | undefined,
): string | null => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return null;

    let path = '';
    if (trimmedValue.startsWith('servers/banner/')) {
        path = `/api/v1/${trimmedValue}`;
    } else if (trimmedValue.startsWith('/servers/banner/')) {
        path = `/api/v1${trimmedValue}`;
    } else if (
        !trimmedValue.startsWith('http') &&
        !trimmedValue.startsWith('/') &&
        !trimmedValue.includes('/')
    ) {
        path = `${SERVER_BANNER_PATH}${trimmedValue}`;
    } else {
        path = trimmedValue;
    }

    if (path.startsWith('http')) {
        return path;
    }

    const apiBaseUrl = getConfiguredApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${apiBaseUrl}${normalizedPath}`;
};
