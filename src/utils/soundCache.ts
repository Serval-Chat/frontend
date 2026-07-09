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
 * Clears old sounds from the cache that are no longer needed.
 */
export async function pruneSoundCache(keepUrls: string[]): Promise<void> {
    if (typeof caches === 'undefined') return;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const keepUrlSet = new Set(keepUrls);

    await Promise.all(
        keys.flatMap((request): Promise<boolean>[] =>
            keepUrlSet.has(request.url) ? [] : [cache.delete(request)],
        ),
    );
}
