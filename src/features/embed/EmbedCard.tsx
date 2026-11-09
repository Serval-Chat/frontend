import { type ReactNode, memo, useMemo } from 'react';

import { useMe } from '@/api/users/users.queries';
import type { Embed } from '@/types/embed';
import { Link } from '@/ui/primitives/Link';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';
import {
    getSafeUrl,
    isSafeVideoUrl,
    isSafeYoutubeEmbedUrl,
} from '@/utils/proxy';
import { ParserPresets } from '@/utils/textParser/parser';

import { EmbedImage } from './EmbedImage';
import { EmbedYouTube } from './EmbedYouTube';
import { ParsedEmbedText } from './ParsedEmbedText';
import { getEmbedImageStyle } from './embedUtils';
import { colorToCss, formatTimestamp } from './embedUtils';

interface EmbedCardProps {
    embed: Embed;
    variant: 'preview' | 'chat';
    serverId?: string;
    isDeleted?: boolean;
    onResize?: () => void;
}

export const EmbedCard = memo(
    ({
        embed,
        variant,
        serverId,
        isDeleted,
        onResize,
    }: EmbedCardProps): ReactNode => {
        const { data: me } = useMe();
        const use24HourTime = me?.settings?.use24HourTime ?? false;
        const barColor = colorToCss(embed.color);
        const hasContent = Boolean(
            embed.title ??
            embed.description ??
            embed.author ??
            embed.footer ??
            embed.thumbnail ??
            embed.image ??
            embed.video ??
            embed.fields?.length,
        );

        const imageUrl = embed.image?.url
            ? getSafeUrl(embed.image.url)
            : undefined;
        const thumbnailUrl = embed.thumbnail?.url
            ? getSafeUrl(embed.thumbnail.url)
            : undefined;
        const authorIconUrl = embed.author?.icon_url
            ? getSafeUrl(embed.author.icon_url)
            : undefined;
        const footerIconUrl = embed.footer?.icon_url
            ? getSafeUrl(embed.footer.icon_url)
            : undefined;

        const fieldRows = useMemo((): {
            fields: typeof embed.fields;
            inline: boolean;
        }[] => {
            interface FieldRow {
                fields: typeof embed.fields;
                inline: boolean;
            }
            const rows: FieldRow[] = [];
            if (embed.fields) {
                let currentRow: NonNullable<typeof embed.fields> = [];
                for (const field of embed.fields) {
                    if (field.inline) {
                        currentRow.push(field);
                        if (currentRow.length === 3) {
                            rows.push({ fields: currentRow, inline: true });
                            currentRow = [];
                        }
                    } else {
                        if (currentRow.length > 0) {
                            rows.push({ fields: currentRow, inline: true });
                            currentRow = [];
                        }
                        rows.push({ fields: [field], inline: false });
                    }
                }
                if (currentRow.length > 0) {
                    rows.push({ fields: currentRow, inline: true });
                }
            }
            return rows;
        }, [embed]);

        const footerText = useMemo((): string => {
            if (!embed.footer?.text && !embed.timestamp) return '';
            return [
                embed.footer?.text,
                formatTimestamp(embed.timestamp, use24HourTime),
            ]
                .filter(Boolean)
                .join(' • ');
        }, [embed.footer?.text, embed.timestamp, use24HourTime]);

        if (!hasContent) return null;

        if (
            embed.type === 'youtube' &&
            embed.video?.url &&
            isSafeYoutubeEmbedUrl(embed.video.url)
        ) {
            return (
                <EmbedYouTube
                    embed={embed}
                    isDeleted={isDeleted}
                    variant={variant}
                    videoUrl={embed.video.url}
                    onResize={onResize}
                />
            );
        }

        if (
            embed.type === 'video' &&
            embed.video?.url &&
            isSafeVideoUrl(embed.video.url)
        ) {
            return (
                <div className="mt-1 flex w-fit">
                    <video
                        controls
                        playsInline
                        aria-label={embed.title ?? 'Embedded video'}
                        className={cn(
                            'max-h-96 max-w-[520px] rounded-md object-contain',
                            isDeleted && 'opacity-50 grayscale',
                        )}
                        preload="metadata"
                        src={embed.video.url}
                        style={getEmbedImageStyle(embed.video, 520)}
                        onLoadedData={onResize}
                        onLoadedMetadata={onResize}
                    >
                        <track kind="captions" label="Captions" srcLang="en" />
                    </video>
                </div>
            );
        }

        if (embed.type === 'image' && embed.image?.url) {
            return (
                <div className="mt-1 flex w-fit">
                    <EmbedImage
                        alt={embed.title || 'Image'}
                        className="block"
                        imageClassName={cn(
                            'max-h-96 max-w-[520px] rounded-md object-contain',
                            isDeleted && 'opacity-50 grayscale',
                        )}
                        src={imageUrl}
                        style={getEmbedImageStyle(embed.image, 520)}
                        onResize={onResize}
                    />
                </div>
            );
        }

        return (
            <div
                className="mt-1 flex w-fit max-w-[520px] overflow-hidden rounded-r-sm"
                style={{
                    borderLeft: `4px solid ${barColor ?? 'var(--color-primary)'}`,
                }}
            >
                <div
                    className={cn(
                        'flex w-auto flex-col rounded-r-sm px-4 py-3',
                        variant === 'preview'
                            ? 'bg-embed-bg'
                            : 'bg-embed-bg/70',
                    )}
                >
                    {/* Provider */}
                    {embed.provider?.name ? (
                        <Text
                            as="p"
                            className={cn(
                                'mb-0.5 text-xs',
                                isDeleted
                                    ? 'text-danger/80'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {embed.provider.url ? (
                                <Link
                                    className="hover:underline"
                                    href={embed.provider.url}
                                >
                                    <ParsedEmbedText
                                        preset={ParserPresets.EMBED_INLINE}
                                        serverId={serverId}
                                        size="xs"
                                        text={embed.provider.name}
                                        variant={
                                            isDeleted ? 'danger' : undefined
                                        }
                                        onResize={onResize}
                                    />
                                </Link>
                            ) : (
                                <ParsedEmbedText
                                    preset={ParserPresets.EMBED_INLINE}
                                    serverId={serverId}
                                    size="xs"
                                    text={embed.provider.name}
                                    variant={isDeleted ? 'danger' : undefined}
                                    onResize={onResize}
                                />
                            )}
                        </Text>
                    ) : null}

                    {/* Author */}
                    {embed.author?.name ? (
                        <div className="mb-2 flex items-center gap-2">
                            {embed.author.icon_url ? (
                                <img
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover"
                                    decoding="async"
                                    loading="eager"
                                    src={authorIconUrl}
                                />
                            ) : null}
                            <Text
                                className={cn(
                                    'text-sm font-semibold',
                                    isDeleted
                                        ? 'text-danger'
                                        : 'text-foreground',
                                )}
                            >
                                {embed.author.url ? (
                                    <Link
                                        className="hover:underline"
                                        href={embed.author.url}
                                    >
                                        <ParsedEmbedText
                                            preset={ParserPresets.EMBED_INLINE}
                                            serverId={serverId}
                                            size="sm"
                                            text={embed.author.name}
                                            variant={
                                                isDeleted ? 'danger' : undefined
                                            }
                                            onResize={onResize}
                                        />
                                    </Link>
                                ) : (
                                    <ParsedEmbedText
                                        preset={ParserPresets.EMBED_INLINE}
                                        serverId={serverId}
                                        size="sm"
                                        text={embed.author.name}
                                        variant={
                                            isDeleted ? 'danger' : undefined
                                        }
                                        onResize={onResize}
                                    />
                                )}
                            </Text>
                        </div>
                    ) : null}

                    {/* Title + thumbnail side-by-side */}
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            {/* Title */}
                            {embed.title ? (
                                <Text
                                    as="p"
                                    className={cn(
                                        'mb-1 text-base font-semibold',
                                        isDeleted
                                            ? 'text-danger'
                                            : 'text-foreground',
                                    )}
                                >
                                    {embed.url ? (
                                        <Link
                                            className="text-primary hover:underline"
                                            href={embed.url}
                                        >
                                            <ParsedEmbedText
                                                preset={
                                                    ParserPresets.EMBED_INLINE
                                                }
                                                serverId={serverId}
                                                size="base"
                                                text={embed.title}
                                                variant={
                                                    isDeleted
                                                        ? 'danger'
                                                        : undefined
                                                }
                                                onResize={onResize}
                                            />
                                        </Link>
                                    ) : (
                                        <ParsedEmbedText
                                            preset={ParserPresets.EMBED_INLINE}
                                            serverId={serverId}
                                            size="base"
                                            text={embed.title}
                                            variant={
                                                isDeleted ? 'danger' : undefined
                                            }
                                            onResize={onResize}
                                        />
                                    )}
                                </Text>
                            ) : null}

                            {/* Description */}
                            {embed.description ? (
                                <div
                                    className="mb-2 text-sm leading-relaxed"
                                    style={{ display: 'flow-root' }}
                                >
                                    <ParsedEmbedText
                                        preset={ParserPresets.EMBED}
                                        serverId={serverId}
                                        size="sm"
                                        text={embed.description}
                                        variant={
                                            isDeleted ? 'danger' : undefined
                                        }
                                        wrap="preWrap"
                                        onResize={onResize}
                                    />
                                </div>
                            ) : null}

                            {/* Fields */}
                            {fieldRows.length > 0 ? (
                                <div className="mt-2 flex flex-col gap-2">
                                    {fieldRows.map((row) => (
                                        <div
                                            className={cn(
                                                'grid gap-x-4',
                                                row.inline
                                                    ? `grid-cols-${Math.min(row.fields?.length ?? 1, 3)}`
                                                    : 'grid-cols-1',
                                            )}
                                            key={`row-${row.fields?.map((f): string => f.name).join(',')}`}
                                        >
                                            {row.fields?.map((field) => (
                                                <div
                                                    key={`${field.name}-${field.value}`}
                                                >
                                                    <div
                                                        className={cn(
                                                            'text-xs font-semibold',
                                                            isDeleted
                                                                ? 'text-danger'
                                                                : 'text-foreground',
                                                        )}
                                                        style={{
                                                            display:
                                                                'flow-root',
                                                        }}
                                                    >
                                                        <ParsedEmbedText
                                                            preset={
                                                                ParserPresets.EMBED_INLINE
                                                            }
                                                            serverId={serverId}
                                                            size="xs"
                                                            text={field.name}
                                                            variant={
                                                                isDeleted
                                                                    ? 'danger'
                                                                    : undefined
                                                            }
                                                            onResize={onResize}
                                                        />
                                                    </div>
                                                    <div
                                                        className="text-sm text-muted-foreground"
                                                        style={{
                                                            display:
                                                                'flow-root',
                                                        }}
                                                    >
                                                        <ParsedEmbedText
                                                            preset={
                                                                ParserPresets.EMBED
                                                            }
                                                            serverId={serverId}
                                                            size="sm"
                                                            text={field.value}
                                                            variant={
                                                                isDeleted
                                                                    ? 'danger'
                                                                    : undefined
                                                            }
                                                            wrap="preWrap"
                                                            onResize={onResize}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {/* Thumbnail */}
                        {embed.thumbnail?.url ? (
                            <EmbedImage
                                alt={embed.title || 'Thumbnail'}
                                className="ml-auto block shrink-0"
                                imageClassName={cn(
                                    'h-20 w-20 rounded object-cover',
                                    isDeleted && 'opacity-50 grayscale',
                                )}
                                src={thumbnailUrl}
                                onResize={onResize}
                            />
                        ) : null}
                    </div>

                    {/* Large image */}
                    {embed.image?.url ? (
                        <EmbedImage
                            alt={embed.title || 'Image'}
                            className="mt-3 block"
                            imageClassName={cn(
                                'max-h-72 max-w-[488px] rounded object-contain',
                                isDeleted && 'opacity-50 grayscale',
                            )}
                            src={imageUrl}
                            style={getEmbedImageStyle(embed.image, 488)}
                            onResize={onResize}
                        />
                    ) : null}

                    {/* Footer */}
                    {(embed.footer?.text ?? embed.timestamp) ? (
                        <div className="mt-3 flex items-center gap-2">
                            {embed.footer?.icon_url ? (
                                <img
                                    alt=""
                                    className={cn(
                                        'h-5 w-5 rounded-full object-cover',
                                        isDeleted && 'opacity-50 grayscale',
                                    )}
                                    decoding="async"
                                    loading="eager"
                                    src={footerIconUrl}
                                />
                            ) : null}
                            <div
                                className={cn(
                                    'text-xs',
                                    isDeleted
                                        ? 'text-danger/80'
                                        : 'text-muted-foreground',
                                )}
                                style={{ display: 'flow-root' }}
                            >
                                <ParsedEmbedText
                                    preset={ParserPresets.EMBED}
                                    serverId={serverId}
                                    size="xs"
                                    text={footerText}
                                    variant={isDeleted ? 'danger' : 'muted'}
                                    wrap="preWrap"
                                    onResize={onResize}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    },
);

EmbedCard.displayName = 'EmbedCard';
