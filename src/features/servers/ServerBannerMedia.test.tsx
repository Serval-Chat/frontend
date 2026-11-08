import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveServerBannerUrl } from './bannerUtils';

describe('resolveServerBannerUrl', (): void => {
    beforeEach((): void => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.serchat.com');
    });

    it('keeps stored API banner paths intact', (): void => {
        expect(
            resolveServerBannerUrl('/api/v1/servers/banner/banner.png'),
        ).toBe('https://api.serchat.com/api/v1/servers/banner/banner.png');
    });

    it('adds the server banner API prefix for bare filenames', (): void => {
        expect(resolveServerBannerUrl('banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
    });

    it('normalizes server banner paths missing the API version prefix', (): void => {
        expect(resolveServerBannerUrl('servers/banner/banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
        expect(resolveServerBannerUrl('/servers/banner/banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
    });
});
