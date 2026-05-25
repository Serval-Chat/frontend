export interface MediaDimensions {
    width: number;
    height: number;
}

export interface DimensionedAttachment {
    width?: number;
    height?: number;
}

const hasUsableDimensions = (
    dimensions: Partial<MediaDimensions>,
): dimensions is MediaDimensions =>
    Number.isFinite(dimensions.width) &&
    Number.isFinite(dimensions.height) &&
    (dimensions.width ?? 0) > 0 &&
    (dimensions.height ?? 0) > 0;

const readImageDimensionsWithElement = (
    file: File,
): Promise<MediaDimensions | undefined> =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        const cleanup = (): void => {
            URL.revokeObjectURL(url);
        };

        image.onload = () => {
            const dimensions = {
                width: image.naturalWidth,
                height: image.naturalHeight,
            };
            cleanup();
            resolve(hasUsableDimensions(dimensions) ? dimensions : undefined);
        };
        image.onerror = () => {
            cleanup();
            resolve(undefined);
        };
        image.src = url;
    });

const readImageDimensions = async (
    file: File,
): Promise<MediaDimensions | undefined> => {
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await window.createImageBitmap(file);
            const dimensions = { width: bitmap.width, height: bitmap.height };
            bitmap.close();
            if (hasUsableDimensions(dimensions)) return dimensions;
        } catch {
            // Fall through to the element-based reader.
        }
    }

    return readImageDimensionsWithElement(file);
};

const readVideoDimensions = (
    file: File,
): Promise<MediaDimensions | undefined> =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');

        const cleanup = (): void => {
            video.removeAttribute('src');
            video.load();
            URL.revokeObjectURL(url);
        };

        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const dimensions = {
                width: video.videoWidth,
                height: video.videoHeight,
            };
            cleanup();
            resolve(hasUsableDimensions(dimensions) ? dimensions : undefined);
        };
        video.onerror = () => {
            cleanup();
            resolve(undefined);
        };
        video.src = url;
    });

export const readMediaDimensions = async (
    file: File,
): Promise<MediaDimensions | undefined> => {
    if (file.type.startsWith('image/')) {
        return readImageDimensions(file);
    }

    if (file.type.startsWith('video/')) {
        return readVideoDimensions(file);
    }

    return undefined;
};

export const applyMediaDimensions = <T extends object>(
    attachment: T,
    dimensions: MediaDimensions | undefined,
): T & DimensionedAttachment => ({
    ...attachment,
    width: (attachment as DimensionedAttachment).width ?? dimensions?.width,
    height: (attachment as DimensionedAttachment).height ?? dimensions?.height,
});
