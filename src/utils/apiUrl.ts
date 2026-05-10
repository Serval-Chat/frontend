/**
 * @description Resolves an API-relative path to a full URL
 */
export const resolveApiUrl = (path: string | undefined): string | null => {
    if (!path) return null;

    if (path.startsWith('http')) {
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(
            /\/$/,
            '',
        );

        if (apiBaseUrl && path.startsWith(apiBaseUrl)) {
            return path;
        }

        return `${apiBaseUrl}/api/v1/file-proxy?url=${encodeURIComponent(path)}`;
    }

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(
        /\/$/,
        '',
    );
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${apiBaseUrl}${normalizedPath}`;
};
