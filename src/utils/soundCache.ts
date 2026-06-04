const cacheName = 'serchat-notification-sounds';

/**
 * Pre-fetches and caches a notification sound using the Cache API.
 */
export async function cacheSound(url: string): Promise<void> {
    if (typeof caches === 'undefined') return;

    const cache = await caches.open(cacheName);
    const response = await cache.match(url);

    if (!response) {
        try {
            await cache.add(url);
        } catch (error) {
            console.error('Failed to cache sound:', url, error);
        }
    }
}

/**
 * Gets a cached sound URL. If it's in the Cache API, it returns the URL.
 * The browser will serve it from the cache if available.
 */
export async function getSoundUrl(url: string): Promise<string> {
    if (typeof caches === 'undefined') return url;

    const cache = await caches.open(cacheName);
    const response = await cache.match(url);

    if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    return url;
}

/**
 * Clears old sounds from the cache that are no longer needed.
 */
export async function pruneSoundCache(keepUrls: string[]): Promise<void> {
    if (typeof caches === 'undefined') return;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const keepUrlSet = new Set(keepUrls);

    await Promise.all(
        keys
            .filter((request): boolean => !keepUrlSet.has(request.url))
            .map((request): Promise<boolean> => cache.delete(request)),
    );
}
