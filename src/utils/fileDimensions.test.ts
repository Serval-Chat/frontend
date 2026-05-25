import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    applyMediaDimensions,
    readMediaDimensions,
} from '@/utils/fileDimensions';

describe('readMediaDimensions', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('reads image dimensions with createImageBitmap', async () => {
        const close = vi.fn();
        vi.stubGlobal(
            'createImageBitmap',
            vi.fn().mockResolvedValue({ width: 640, height: 480, close }),
        );

        const file = new File(['image'], 'image.png', { type: 'image/png' });

        await expect(readMediaDimensions(file)).resolves.toEqual({
            width: 640,
            height: 480,
        });
        expect(close).toHaveBeenCalled();
    });

    it('reads video dimensions from metadata', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName !== 'video') return originalCreateElement(tagName);

            const video = {
                load: vi.fn(),
                removeAttribute: vi.fn(),
                videoWidth: 1280,
                videoHeight: 720,
                onerror: null as (() => void) | null,
                onloadedmetadata: null as (() => void) | null,
                preload: '',
                set src(_value: string) {
                    setTimeout(() => this.onloadedmetadata?.(), 0);
                },
            };

            return video as unknown as HTMLVideoElement;
        });

        const file = new File(['video'], 'video.mp4', { type: 'video/mp4' });

        await expect(readMediaDimensions(file)).resolves.toEqual({
            width: 1280,
            height: 720,
        });
    });

    it('does not read dimensions for generic files', async () => {
        const file = new File(['text'], 'note.txt', { type: 'text/plain' });

        await expect(readMediaDimensions(file)).resolves.toBeUndefined();
    });
});

describe('applyMediaDimensions', () => {
    it('keeps server-provided dimensions over local dimensions', () => {
        expect(
            applyMediaDimensions(
                { attachmentId: 'a', width: 100, height: 50 },
                { width: 640, height: 480 },
            ),
        ).toMatchObject({ width: 100, height: 50 });
    });

    it('fills missing dimensions from local metadata', () => {
        expect(
            applyMediaDimensions(
                { attachmentId: 'a' },
                { width: 640, height: 480 },
            ),
        ).toMatchObject({ width: 640, height: 480 });
    });
});
