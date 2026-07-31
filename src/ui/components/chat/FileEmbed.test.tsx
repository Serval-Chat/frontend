import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageAttachment } from '@/api/chat/chat.types';
import { FileEmbed } from '@/ui/components/chat/FileEmbed';

const { useFileContentMock, useProxyContentMock } = vi.hoisted(() => ({
    useFileContentMock: vi.fn(
        (): { data: string | null; isLoading: boolean } => ({
            data: null,
            isLoading: false,
        }),
    ),
    useProxyContentMock: vi.fn(
        (): { data: string | null; isLoading: boolean } => ({
            data: null,
            isLoading: false,
        }),
    ),
}));

vi.mock('@/api/files/files.queries', () => ({
    useFileContent: useFileContentMock,
    useFileMetadata: (): { data: null; isLoading: false } => ({
        data: null,
        isLoading: false,
    }),
    useProxyContent: useProxyContentMock,
    useProxyMetadata: (): { data: null; isLoading: false } => ({
        data: null,
        isLoading: false,
    }),
}));

vi.mock(
    '@/ui/components/common/ImageLightbox',
    (): { ImageLightbox: () => null } => ({
        ImageLightbox: (): null => null,
    }),
);

vi.mock('@/ui/components/common/CodeBlock', () => ({
    CodeBlock: ({ content }: { content: string }) => (
        <div data-testid="code-block">{content}</div>
    ),
}));

beforeEach((): void => {
    useFileContentMock.mockClear();
    useProxyContentMock.mockClear();
});

const imageAttachment: MessageAttachment = {
    attachmentId: 'image-1',
    type: 'image',
    mimeType: 'image/png',
    name: 'image.png',
    size: 100,
    width: 640,
    height: 480,
};

const videoAttachment: MessageAttachment = {
    attachmentId: 'video-1',
    type: 'video',
    mimeType: 'video/mp4',
    name: 'video.mp4',
    size: 100,
    width: 1280,
    height: 720,
};

describe('FileEmbed', (): void => {
    it('renders image attachments with stable dimensions and reports load resize', (): void => {
        const onResize = vi.fn();

        render(<FileEmbed attachment={imageAttachment} onResize={onResize} />);

        const image = screen.getByRole('img', { name: 'image.png' });
        expect(image).toHaveAttribute('width', '640');
        expect(image).toHaveAttribute('height', '480');
        expect(image).toHaveStyle({ aspectRatio: '640 / 480' });

        fireEvent.load(image);

        expect(onResize).toHaveBeenCalled();
    });

    it('sizes spoiler placeholders from attachment dimensions', (): void => {
        render(
            <FileEmbed
                attachment={{ ...videoAttachment, spoiler: true }}
                onResize={vi.fn()}
            />,
        );

        expect(screen.getByText('SPOILER (VIDEO)')).toBeInTheDocument();
        expect(
            screen.getByText('SPOILER (VIDEO)').closest('.group'),
        ).toHaveStyle({
            aspectRatio: '1280 / 720',
        });
    });

    it('renders video attachments with dimensions and reports metadata resize', (): void => {
        const onResize = vi.fn();
        const { container } = render(
            <FileEmbed attachment={videoAttachment} onResize={onResize} />,
        );

        const video = container.querySelector('video');
        expect(video).toHaveAttribute('width', '1280');
        expect(video).toHaveAttribute('height', '720');

        fireEvent.loadedMetadata(video!);

        expect(onResize).toHaveBeenCalled();
    });

    it('renders embedded attachment content instantly instead of fetching it', (): void => {
        const textAttachment: MessageAttachment = {
            attachmentId: 'text-1',
            type: 'text',
            mimeType: 'text/plain',
            name: 'notes.txt',
            size: 20,
            content: 'embedded content here',
        };

        render(<FileEmbed attachment={textAttachment} />);

        expect(screen.getByTestId('code-block')).toHaveTextContent(
            'embedded content here',
        );
        expect(useFileContentMock).toHaveBeenCalledWith(null);
    });

    it('resolves embedded content independently for each attachment, not just the last one rendered', (): void => {
        const attachmentA: MessageAttachment = {
            attachmentId: 'text-a',
            type: 'text',
            mimeType: 'text/plain',
            name: 'a.txt',
            size: 20,
            content: 'content A',
        };
        const attachmentB: MessageAttachment = {
            attachmentId: 'text-b',
            type: 'text',
            mimeType: 'text/plain',
            name: 'b.txt',
            size: 20,
            content: 'content B',
        };
        const attachmentC: MessageAttachment = {
            attachmentId: 'text-c',
            type: 'text',
            mimeType: 'text/plain',
            name: 'c.txt',
            size: 20,
            content: 'content C',
        };

        render(
            <>
                <FileEmbed attachment={attachmentA} />
                <FileEmbed attachment={attachmentB} />
                <FileEmbed attachment={attachmentC} />
            </>,
        );

        const blocks = screen.getAllByTestId('code-block');
        expect(blocks.map((el) => el.textContent)).toEqual([
            'content A',
            'content B',
            'content C',
        ]);
    });

    it('falls back to fetching content over the network when it is not embedded', (): void => {
        const textAttachment: MessageAttachment = {
            attachmentId: 'text-2',
            type: 'text',
            mimeType: 'text/plain',
            name: 'notes.txt',
            size: 20,
        };

        render(<FileEmbed attachment={textAttachment} />);

        expect(useFileContentMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/files/download/text-2'),
        );
    });
});
