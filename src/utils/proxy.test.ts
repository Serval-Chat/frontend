import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProxyUrl, isInternalUrl } from './proxy';

describe('proxy utils', () => {
    beforeEach(() => {
        vi.stubGlobal('location', {
            origin: 'https://rolling.catfla.re',
        });
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.rolling.catfla.re');
        vi.stubGlobal('__TAURI__', undefined);
        if (typeof window !== 'undefined') {
            delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
        }
    });

    describe('isInternalUrl', () => {
        it('returns true for relative paths', () => {
            expect(isInternalUrl('/assets/img.png')).toBe(true);
        });

        it('returns true for data URLs', () => {
            expect(isInternalUrl('data:image/png;base64,abc')).toBe(true);
        });

        it('returns true for blobs', () => {
            expect(isInternalUrl('blob:https://rolling.catfla.re/abc')).toBe(
                true,
            );
        });

        it('returns true for frontend origin', () => {
            expect(isInternalUrl('https://rolling.catfla.re/logo.png')).toBe(
                true,
            );
        });

        it('returns true for API origin', () => {
            expect(
                isInternalUrl('https://api.rolling.catfla.re/files/123'),
            ).toBe(true);
        });

        it('returns true for production download path', () => {
            expect(
                isInternalUrl('https://catfla.re/api/v1/files/download/123'),
            ).toBe(true);
        });

        it('returns false for external domains', () => {
            expect(isInternalUrl('https://google.com/favicon.ico')).toBe(false);
        });

        it('returns false for protocol-relative external URLs', () => {
            expect(isInternalUrl('//google.com/favicon.ico')).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(isInternalUrl(undefined)).toBe(false);
        });

        it('returns false for empty string', () => {
            expect(isInternalUrl('')).toBe(false);
        });

        it('returns true when URL starts with API base URL (relative apiBaseUrl)', () => {
            vi.stubEnv('VITE_API_BASE_URL', '/api');
            expect(isInternalUrl('/api/files/123')).toBe(true);
        });

        it('returns true for malformed non-protocol-relative string', () => {
            expect(isInternalUrl('not a url at all')).toBe(true);
        });
    });

    describe('getProxyUrl', () => {
        it('returns original URL for internal URLs', () => {
            const url = 'https://rolling.catfla.re/logo.png';
            expect(getProxyUrl(url)).toBe(url);
        });

        it('returns proxied URL for external URLs', () => {
            const url = 'https://google.com/img.png';
            const proxied = getProxyUrl(url);
            expect(proxied).toContain('/api/v1/file-proxy?url=');
            expect(proxied).toContain(encodeURIComponent(url));
        });

        it('handles URLs already containing the proxy path', () => {
            const url =
                'https://api.rolling.catfla.re/api/v1/file-proxy?url=abc';
            expect(getProxyUrl(url)).toBe(url);
        });

        it('returns empty string for undefined', () => {
            expect(getProxyUrl(undefined)).toBe('');
        });

        it('returns empty string for empty string', () => {
            expect(getProxyUrl('')).toBe('');
        });

        it('uses apiBaseUrl as base when running in Tauri', () => {
            vi.stubGlobal('window', {
                location: { origin: 'https://rolling.catfla.re' },
                __TAURI__: {},
            });
            const url = 'https://external.com/img.png';
            const proxied = getProxyUrl(url);
            expect(proxied).toMatch(
                /^https:\/\/api\.rolling\.catfla\.re\/api\/v1\/file-proxy/,
            );
        });

        it('uses no base URL when not in Tauri', () => {
            const url = 'https://external.com/img.png';
            expect(getProxyUrl(url)).toMatch(/^\/api\/v1\/file-proxy/);
        });

        it('encodes special characters in the proxied URL', () => {
            const url = 'https://external.com/path?foo=bar&baz=qux';
            const proxied = getProxyUrl(url);
            expect(proxied).toContain('url=https%3A%2F%2Fexternal.com');
            expect(proxied).not.toContain('&baz=');
            expect(proxied).toContain('%26baz%3Dqux');
        });
    });
});
