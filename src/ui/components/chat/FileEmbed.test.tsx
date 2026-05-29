import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessageAttachment } from '@/api/chat/chat.types';
import { FileEmbed } from '@/ui/components/chat/FileEmbed';

vi.mock('@/api/files/files.queries', () => ({
    useFileContent: (): { data: null; isLoading: false } => ({
        data: null,
        isLoading: false,
    }),
    useFileMetadata: (): { data: null; isLoading: false } => ({
        data: null,
        isLoading: false,
    }),
    useProxyContent: (): { data: null; isLoading: false } => ({
        data: null,
        isLoading: false,
    }),
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
});
