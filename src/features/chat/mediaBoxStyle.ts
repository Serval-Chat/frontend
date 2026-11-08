import type { CSSProperties } from 'react';

import type { MessageAttachment } from '@/api/chat/chat.types';

const FALLBACK_MEDIA_WIDTH = 320;
const FALLBACK_MEDIA_HEIGHT = 180;
const MAX_MEDIA_WIDTH = 550;

const MEDIA_MAX_HEIGHT = 'min(450px, 70vh)';

export const getMediaDimensions = (
    attachment: MessageAttachment | undefined,
): { width: number; height: number; hasMetadata: boolean } => {
    if (attachment?.width && attachment.height) {
        return {
            width: attachment.width,
            height: attachment.height,
            hasMetadata: true,
        };
    }

    return {
        width: FALLBACK_MEDIA_WIDTH,
        height: FALLBACK_MEDIA_HEIGHT,
        hasMetadata: false,
    };
};

export const getMediaBoxStyle = (
    attachment: MessageAttachment | undefined,
): CSSProperties => {
    const { width, height } = getMediaDimensions(attachment);
    const maxWidth = Math.min(width, MAX_MEDIA_WIDTH);
    return {
        aspectRatio: `${width} / ${height}`,
        maxHeight: MEDIA_MAX_HEIGHT,
        width: `min(${maxWidth}px, 100%, calc(${MEDIA_MAX_HEIGHT} * ${width / height}))`,
        maxWidth: `${maxWidth}px`,
    };
};
