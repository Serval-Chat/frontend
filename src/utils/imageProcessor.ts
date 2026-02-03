import GIF from 'gif.js';
import { decompressFrames, parseGIF } from 'gifuct-js';

interface ImageSize {
    width: number;
    height: number;
}

export interface CropSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ProcessOptions {
    maxWidth?: number;
    maxHeight?: number;
    crop?: CropSelection;
    quality?: number;
}

/**
 * Validates that the file is a supported image type.
 */
function validateMimeType(file: File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.type)) {
        throw new Error(
            `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`,
        );
    }
}

/**
 * Validates that the crop selection is within the image boundaries.
 */
function validateCrop(
    crop: CropSelection,
    imgWidth: number,
    imgHeight: number,
): void {
    if (
        crop.x < 0 ||
        crop.y < 0 ||
        crop.width <= 0 ||
        crop.height <= 0 ||
        crop.x + crop.width > imgWidth ||
        crop.y + crop.height > imgHeight
    ) {
        throw new Error('Invalid crop selection: out of bounds or zero size.');
    }
}

function calculateNewSize(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number,
): ImageSize {
    let newWidth = width;
    let newHeight = height;

    if (newWidth > maxWidth) {
        newHeight = (newHeight * maxWidth) / newWidth;
        newWidth = maxWidth;
    }

    if (newHeight > maxHeight) {
        newWidth = (newWidth * maxHeight) / newHeight;
        newHeight = maxHeight;
    }

    return { width: Math.round(newWidth), height: Math.round(newHeight) };
}

async function processStaticImage(
    file: File,
    options: ProcessOptions = {},
): Promise<File> {
    const { maxWidth = 1024, maxHeight = 1024, crop, quality = 0.9 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                if (crop) {
                    validateCrop(crop, img.width, img.height);
                }

                const { width: newWidth, height: newHeight } = calculateNewSize(
                    crop ? crop.width : img.width,
                    crop ? crop.height : img.height,
                    maxWidth,
                    maxHeight,
                );

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error(
                        'Failed to get 2D context for static image processing',
                    );
                }

                if (crop) {
                    ctx.drawImage(
                        img,
                        crop.x,
                        crop.y,
                        crop.width,
                        crop.height,
                        0,
                        0,
                        newWidth,
                        newHeight,
                    );
                } else {
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                }

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (!blob) {
                            reject(new Error('Failed to create WebP blob'));
                            return;
                        }
                        const fileName =
                            file.name.replace(/\.[^/.]+$/, '') + '.webp';
                        const newFile = new File([blob], fileName, {
                            type: 'image/webp',
                        });
                        resolve(newFile);
                    },
                    'image/webp',
                    quality,
                );
            } catch (error) {
                URL.revokeObjectURL(url);
                reject(error);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for processing'));
        };

        img.src = url;
    });
}

async function processGif(
    file: File,
    options: ProcessOptions = {},
): Promise<File> {
    const { maxWidth = 1024, maxHeight = 1024, crop } = options;

    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);

    if (crop) {
        validateCrop(crop, gif.lsd.width, gif.lsd.height);
    }

    const { width: targetWidth, height: targetHeight } = calculateNewSize(
        crop ? crop.width : gif.lsd.width,
        crop ? crop.height : gif.lsd.height,
        maxWidth,
        maxHeight,
    );

    return new Promise((resolve, reject) => {
        const gifEncoder = new GIF({
            workers: 2,
            quality: 10,
            width: targetWidth,
            height: targetHeight,
            workerScript: '/gif.worker.js',
        });

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true,
        });

        const accumCanvas = document.createElement('canvas');
        accumCanvas.width = gif.lsd.width;
        accumCanvas.height = gif.lsd.height;
        const accumCtx = accumCanvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true,
        });

        const prevCanvas = document.createElement('canvas');
        prevCanvas.width = gif.lsd.width;
        prevCanvas.height = gif.lsd.height;
        const prevCtx = prevCanvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true,
        });

        if (!ctx || !accumCtx || !prevCtx) {
            reject(new Error('Failed to get 2D contexts for GIF processing'));
            return;
        }

        for (const frame of frames) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = frame.dims.width;
            frameCanvas.height = frame.dims.height;
            const frameCtx = frameCanvas.getContext('2d', { alpha: true });

            if (!frameCtx) {
                reject(new Error('Failed to get 2D context for frame'));
                return;
            }

            const frameData = new ImageData(
                new Uint8ClampedArray(frame.patch),
                frame.dims.width,
                frame.dims.height,
            );

            frameCtx.putImageData(frameData, 0, 0);

            if (frame.disposalType === 3) {
                prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
                prevCtx.drawImage(accumCanvas, 0, 0);
            }

            accumCtx.globalCompositeOperation = 'source-over';

            accumCtx.drawImage(frameCanvas, frame.dims.left, frame.dims.top);

            ctx.clearRect(0, 0, targetWidth, targetHeight);
            if (crop) {
                ctx.drawImage(
                    accumCanvas,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    targetWidth,
                    targetHeight,
                );
            } else {
                ctx.drawImage(accumCanvas, 0, 0, targetWidth, targetHeight);
            }

            gifEncoder.addFrame(ctx, {
                delay: frame.delay,
                copy: true,
            });

            if (frame.disposalType === 2) {
                accumCtx.clearRect(
                    frame.dims.left,
                    frame.dims.top,
                    frame.dims.width,
                    frame.dims.height,
                );
            } else if (frame.disposalType === 3) {
                accumCtx.clearRect(0, 0, accumCanvas.width, accumCanvas.height);
                accumCtx.drawImage(prevCanvas, 0, 0);
            }
        }

        gifEncoder.on('finished', (blob) => {
            canvas.width = canvas.height = 0;
            accumCanvas.width = accumCanvas.height = 0;
            prevCanvas.width = prevCanvas.height = 0;

            const newFile = new File([blob], file.name, { type: 'image/gif' });
            resolve(newFile);
        });

        gifEncoder.render();
    });
}

async function getImageDimensions(file: File): Promise<ImageSize> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const dims = { width: img.width, height: img.height };
            URL.revokeObjectURL(url);
            resolve(dims);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to read image dimensions'));
        };
        img.src = url;
    });
}

async function getGifDimensions(file: File): Promise<ImageSize> {
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    return { width: gif.lsd.width, height: gif.lsd.height };
}

export async function processImage(
    file: File,
    maxWidth = 1024,
    maxHeight = 1024,
    crop?: CropSelection,
): Promise<File> {
    validateMimeType(file, [
        'image/gif',
        'image/webp',
        'image/jpeg',
        'image/png',
    ]);

    const isGif = file.type === 'image/gif';
    const isWebP = file.type === 'image/webp';

    // Skip if no crop and already within bounds and in WebP/GIF format
    if (!crop) {
        let dims: ImageSize;
        if (isGif) {
            dims = await getGifDimensions(file);
        } else {
            dims = await getImageDimensions(file);
        }

        const withinBounds = dims.width <= maxWidth && dims.height <= maxHeight;
        const correctFormat = isGif || isWebP;

        if (withinBounds && correctFormat) {
            return file;
        }
    }

    let processed: File;
    if (isGif) {
        processed = await processGif(file, { maxWidth, maxHeight, crop });
    } else {
        processed = await processStaticImage(file, {
            maxWidth,
            maxHeight,
            crop,
        });
    }

    // If processing made the file larger without a crop/resize, prefer original
    if (!crop) {
        if (processed.size > file.size) {
            // Re-verify dimensions to ensure original is actually safe
            const dims = isGif
                ? await getGifDimensions(file)
                : await getImageDimensions(file);
            if (dims.width <= maxWidth && dims.height <= maxHeight) {
                return file;
            }
        }
    }

    return processed;
}

export async function processProfileImage(
    file: File,
    type: 'avatar' | 'banner' | 'server-banner',
    crop?: CropSelection,
): Promise<File> {
    const isAvatar = type === 'avatar';
    const isServerBanner = type === 'server-banner';

    const maxWidth = isAvatar ? 256 : isServerBanner ? 960 : 1136;
    const maxHeight = isAvatar ? 256 : isServerBanner ? 540 : 400;
    return processImage(file, maxWidth, maxHeight, crop);
}
