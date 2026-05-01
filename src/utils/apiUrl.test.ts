import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveApiUrl } from './apiUrl';

describe('apiUrl utils', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.serchat.com');
    });

    it('resolves relative paths correctly', () => {
        expect(resolveApiUrl('/test')).toBe('https://api.serchat.com/test');
        expect(resolveApiUrl('test')).toBe('https://api.serchat.com/test');
    });

    it('returns internal absolute URLs as is', () => {
        const url = 'https://api.serchat.com/test';
        expect(resolveApiUrl(url)).toBe(url);
    });

    it('proxies external absolute URLs', () => {
        const url = 'https://google.com/img.png';
        const resolved = resolveApiUrl(url);
        expect(resolved).toContain('/api/v1/file-proxy?url=');
        expect(resolved).toContain(encodeURIComponent(url));
    });

    it('returns null for empty path', () => {
        expect(resolveApiUrl(undefined)).toBe(null);
        expect(resolveApiUrl('')).toBe(null);
    });
});
