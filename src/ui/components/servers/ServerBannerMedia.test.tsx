import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveServerBannerUrl } from './ServerBannerMedia';

describe('resolveServerBannerUrl', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.serchat.com');
    });

    it('keeps stored API banner paths intact', () => {
        expect(
            resolveServerBannerUrl('/api/v1/servers/banner/banner.png'),
        ).toBe('https://api.serchat.com/api/v1/servers/banner/banner.png');
    });

    it('adds the server banner API prefix for bare filenames', () => {
        expect(resolveServerBannerUrl('banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
    });

    it('normalizes server banner paths missing the API version prefix', () => {
        expect(resolveServerBannerUrl('servers/banner/banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
        expect(resolveServerBannerUrl('/servers/banner/banner.png')).toBe(
            'https://api.serchat.com/api/v1/servers/banner/banner.png',
        );
    });
});
