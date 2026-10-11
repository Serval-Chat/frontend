import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessagePayload } from '@/types/embed';

import { EmbedRenderer } from './EmbedRenderer';

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn().mockReturnValue({ data: undefined }),
}));

const renderPayload = (payload: MessagePayload): HTMLElement =>
    render(<EmbedRenderer payload={payload} />).container;

describe('EmbedRenderer video/youtube embeds', (): void => {
    it('renders an iframe for a safe youtube.com embed URL', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'youtube',
                    video: { url: 'https://www.youtube.com/embed/abc123' },
                },
            ],
        });

        const iframe = container.querySelector('iframe');
        expect(iframe).not.toBeNull();
        expect(iframe?.getAttribute('src')).toBe(
            'https://www.youtube.com/embed/abc123',
        );
    });

    it('does not render an iframe for a youtube-type embed pointing at a non-YouTube host', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'youtube',
                    video: { url: 'https://evil.example/embed/abc123' },
                },
            ],
        });

        expect(container.querySelector('iframe')).toBeNull();
    });

    it('does not render an iframe for a youtube-type embed with a javascript: URL', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'youtube',
                    video: { url: 'javascript:alert(document.cookie)' },
                },
            ],
        });

        expect(container.querySelector('iframe')).toBeNull();
    });

    it('renders a video element for a safe https video URL', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'video',
                    video: { url: 'https://example.com/video.mp4' },
                },
            ],
        });

        const video = container.querySelector('video');
        expect(video).not.toBeNull();
        expect(video?.getAttribute('src')).toBe(
            'https://example.com/video.mp4',
        );
    });

    it('does not render a video element for a plain http (non-https) video URL', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'video',
                    video: { url: 'http://example.com/video.mp4' },
                },
            ],
        });

        expect(container.querySelector('video')).toBeNull();
    });

    it('does not render a video element for a javascript: video URL', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'video',
                    video: {
                        url: 'javascript:alert(document.cookie)',
                    },
                },
            ],
        });

        expect(container.querySelector('video')).toBeNull();
    });
});

describe('EmbedRenderer accent bar', (): void => {
    it('renders a colorless embed bar in the theme primary', (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'rich',
                    title: 'No color',
                    description: 'x',
                },
            ],
        });

        const bar = container.querySelector('div[style*="border-left"]');
        expect(bar).not.toBeNull();
        expect(bar?.getAttribute('style')).toContain(
            '4px solid var(--color-primary)',
        );
    });

    it("renders the author's chosen color when one is set", (): void => {
        const container = renderPayload({
            embeds: [
                {
                    type: 'rich',
                    color: 0xff0000,
                    title: 'Red bar',
                    description: 'x',
                },
            ],
        });

        const bar = container.querySelector('div[style*="border-left"]');
        expect(bar).not.toBeNull();
        expect(bar?.getAttribute('style')).toContain(
            '4px solid rgb(255, 0, 0)',
        );
    });
});
