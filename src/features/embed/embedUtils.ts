import type { CSSProperties } from 'react';

import type { Embed, EmbedMedia } from '@/types/embed';
import { APP_LOCALE } from '@/utils/locale';

const timestampFormatter12Hour = new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
});
const timestampFormatter24Hour = new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
});

export const colorToCss = (color: number | undefined): string | undefined => {
    if (color === undefined) return undefined;
    return `#${color.toString(16).padStart(6, '0')}`;
};

export const formatTimestamp = (
    iso: string | undefined,
    use24HourTime: boolean,
): string | undefined => {
    if (!iso) return undefined;
    try {
        const formatter = use24HourTime
            ? timestampFormatter24Hour
            : timestampFormatter12Hour;
        return formatter.format(new Date(iso));
    } catch {
        return iso;
    }
};

export const getEmbedKey = (embed: Embed): string =>
    [
        embed.type,
        embed.url,
        embed.video?.url,
        embed.image?.url,
        embed.thumbnail?.url,
        embed.title,
        embed.description,
        embed.color,
    ]
        .filter(Boolean)
        .join(':');

const FALLBACK_EMBED_IMAGE_WIDTH = 400;
const FALLBACK_EMBED_IMAGE_HEIGHT = 225;

export const getEmbedImageStyle = (
    media: EmbedMedia | undefined,
    maxWidth: number,
): CSSProperties => {
    const width = media?.width ?? FALLBACK_EMBED_IMAGE_WIDTH;
    const height = media?.height ?? FALLBACK_EMBED_IMAGE_HEIGHT;
    return {
        aspectRatio: `${width} / ${height}`,
        width: `min(${width}px, 100%)`,
        maxWidth: `${Math.min(width, maxWidth)}px`,
    };
};
