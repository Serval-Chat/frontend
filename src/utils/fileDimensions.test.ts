import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    applyMediaDimensions,
    readMediaDimensions,
} from '@/utils/fileDimensions';

describe('readMediaDimensions', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('reads image dimensions with createImageBitmap', async (): Promise<void> => {
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

    it('reads video dimensions from metadata', async (): Promise<void> => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
            (): undefined => undefined,
        );

        const originalCreateElement = (tagName: string): HTMLElement =>
            document.createElement(tagName);
        vi.spyOn(document, 'createElement').mockImplementation(
            (tagName): HTMLElement => {
                if (tagName !== 'video') return originalCreateElement(tagName);

                const video = {
                    load: vi.fn(),
                    removeAttribute: vi.fn(),
                    videoWidth: 1280,
                    videoHeight: 720,
                    onerror: null as (() => void) | null,
                    onloadedmetadata: null as (() => void) | null,
                    preload: '',
                    addEventListener: vi.fn(function (
                        this: any,
                        event: string,
                        handler: any,
                    ) {
                        this[`on${event}`] = handler;
                    }),
                    removeEventListener: vi.fn(function (
                        this: any,
                        event: string,
                        handler: any,
                    ) {
                        if (this[`on${event}`] === handler) {
                            this[`on${event}`] = null;
                        }
                    }),
                    set src(_value: string) {
                        setTimeout((): void => {
                            this.onloadedmetadata?.();
                        }, 0);
                    },
                };

                return video as unknown as HTMLVideoElement;
            },
        );

        const file = new File(['video'], 'video.mp4', { type: 'video/mp4' });

        await expect(readMediaDimensions(file)).resolves.toEqual({
            width: 1280,
            height: 720,
        });
    });

    it('does not read dimensions for generic files', async (): Promise<void> => {
        const file = new File(['text'], 'note.txt', { type: 'text/plain' });

        await expect(readMediaDimensions(file)).resolves.toBeUndefined();
    });
});

describe('applyMediaDimensions', (): void => {
    it('keeps server-provided dimensions over local dimensions', (): void => {
        expect(
            applyMediaDimensions(
                { attachmentId: 'a', width: 100, height: 50 },
                { width: 640, height: 480 },
            ),
        ).toMatchObject({ width: 100, height: 50 });
    });

    it('fills missing dimensions from local metadata', (): void => {
        expect(
            applyMediaDimensions(
                { attachmentId: 'a' },
                { width: 640, height: 480 },
            ),
        ).toMatchObject({ width: 640, height: 480 });
    });
});
