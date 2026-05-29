import {
    type CSSProperties,
    type ReactNode,
    memo,
    useMemo,
    useState,
} from 'react';

import { useMe } from '@/api/users/users.queries';
import type { Embed, MessagePayload } from '@/types/embed';
import { ImageLightbox } from '@/ui/components/common/ImageLightbox';
import { Link } from '@/ui/components/common/Link';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';
import { getSafeUrl } from '@/utils/proxy';
import {
    type ParserOptions,
    ParserPresets,
    parseText,
} from '@/utils/textParser/parser';

// Remove static timestampFormatter

const colorToCss = (color: number | undefined): string | undefined => {
    if (color === undefined) return undefined;
    return `#${color.toString(16).padStart(6, '0')}`;
};

const formatTimestamp = (
    iso: string | undefined,
    use24HourTime: boolean,
): string | undefined => {
    if (!iso) return undefined;
    try {
        const formatter = new Intl.DateTimeFormat(APP_LOCALE, {
            dateStyle: 'medium',
            timeStyle: 'short',
            hour12: !use24HourTime,
        });
        return formatter.format(new Date(iso));
    } catch {
        return iso;
    }
};

interface ParsedEmbedTextProps {
    text: string;
    preset: ParserOptions;
    serverId?: string;
    size?: 'xs' | 'sm' | 'base';
    variant?: 'danger' | 'muted';
    wrap?: 'preWrap';
    onResize?: () => void;
}

const ParsedEmbedText = memo(
    ({
        text,
        preset,
        serverId,
        size,
        variant,
        wrap,
        onResize,
    }: ParsedEmbedTextProps): ReactNode => {
        const nodes = useMemo(() => parseText(text, preset), [text, preset]);

        return (
            <ParsedText
                nodes={nodes}
                serverId={serverId}
                size={size}
                variant={variant}
                wrap={wrap}
                onResize={onResize}
            />
        );
    },
);
ParsedEmbedText.displayName = 'ParsedEmbedText';

interface EmbedImageProps {
    src: string | undefined;
    alt: string;
    className?: string;
    imageClassName: string;
    style?: CSSProperties;
    onResize?: () => void;
}

const EmbedImage = memo(
    ({
        src,
        alt,
        className,
        imageClassName,
        style,
        onResize,
    }: EmbedImageProps): ReactNode => {
        const [isLightboxOpen, setIsLightboxOpen] = useState(false);

        if (!src) return null;

        return (
            <>
                <button
                    aria-label={`View ${alt}`}
                    className={cn(
                        'cursor-pointer border-0 bg-transparent p-0 text-left',
                        className,
                    )}
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                >
                    <img
                        alt={alt}
                        className={imageClassName}
                        decoding="async"
                        loading="eager"
                        src={src}
                        style={style}
                        onLoad={onResize}
                    />
                </button>
                <ImageLightbox
                    alt={alt}
                    isOpen={isLightboxOpen}
                    src={src}
                    onClose={() => setIsLightboxOpen(false)}
                />
            </>
        );
    },
);
EmbedImage.displayName = 'EmbedImage';

interface EmbedCardProps {
    embed: Embed;
    index: number;
    variant: 'preview' | 'chat';
    serverId?: string;
    isDeleted?: boolean;
    onResize?: () => void;
}

const EmbedCard = memo(
    ({
        embed,
        index,
        variant,
        serverId,
        isDeleted,
        onResize,
    }: EmbedCardProps): ReactNode => {
        const { data: me } = useMe();
        const use24HourTime = me?.settings?.use24HourTime ?? false;
        const barColor = colorToCss(embed.color);
        const hasContent =
            embed.title ??
            embed.description ??
            embed.author ??
            embed.footer ??
            embed.thumbnail ??
            embed.image ??
            embed.video ??
            (embed.fields && embed.fields.length > 0);

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

        const fieldRows = useMemo(() => {
            type FieldRow = { fields: typeof embed.fields; inline: boolean };
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

        const footerText = useMemo(() => {
            if (!embed.footer?.text && !embed.timestamp) return '';
            return [
                embed.footer?.text,
                formatTimestamp(embed.timestamp, use24HourTime),
            ]
                .filter(Boolean)
                .join(' • ');
        }, [embed.footer?.text, embed.timestamp, use24HourTime]);

        if (!hasContent) return null;

        if (embed.type === 'youtube' && embed.video?.url) {
            const isShorts = embed.url?.includes('/shorts/') ?? false;
            return (
                <div
                    className={cn(
                        'mt-1 flex flex-col overflow-hidden rounded-r-sm',
                        isShorts ? 'max-w-[300px]' : 'max-w-[520px]',
                    )}
                    key={index}
                    style={{
                        borderLeft: '4px solid #ff0000',
                    }}
                >
                    <div
                        className={cn(
                            'flex w-full flex-col rounded-r-sm',
                            variant === 'preview'
                                ? 'bg-embed-bg'
                                : 'bg-embed-bg/70',
                        )}
                    >
                        {/* Provider */}
                        <div className="px-4 pt-3 pb-1">
                            <p
                                className={cn(
                                    'mb-0.5 text-xs',
                                    isDeleted
                                        ? 'text-danger/80'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {embed.provider?.url ? (
                                    <Link
                                        className="hover:underline"
                                        href={embed.provider.url}
                                    >
                                        {embed.provider.name ?? 'YouTube'}
                                    </Link>
                                ) : (
                                    (embed.provider?.name ?? 'YouTube')
                                )}
                            </p>

                            {/* Title */}
                            {embed.title && (
                                <p
                                    className={cn(
                                        'mb-0.5 text-sm font-semibold',
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
                                            {embed.title}
                                        </Link>
                                    ) : (
                                        embed.title
                                    )}
                                </p>
                            )}

                            {/* Author / channel */}
                            {embed.author?.name && (
                                <p
                                    className={cn(
                                        'mb-2 text-xs',
                                        isDeleted
                                            ? 'text-danger/80'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {embed.author.url ? (
                                        <Link
                                            className="hover:underline"
                                            href={embed.author.url}
                                        >
                                            {embed.author.name}
                                        </Link>
                                    ) : (
                                        embed.author.name
                                    )}
                                </p>
                            )}
                        </div>

                        <div
                            className={cn(
                                'relative w-full overflow-hidden',
                                isDeleted && 'opacity-50 grayscale',
                            )}
                            style={{
                                aspectRatio: isShorts ? '9 / 16' : '16 / 9',
                            }}
                        >
                            <iframe
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                className="absolute inset-0 h-full w-full"
                                referrerPolicy="strict-origin-when-cross-origin"
                                src={embed.video.url}
                                title={embed.title ?? 'YouTube video'}
                                onLoad={onResize}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (embed.type === 'video' && embed.video?.url) {
            return (
                <div className="mt-1 flex" key={index}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                        controls
                        playsInline
                        className={cn(
                            'max-h-96 max-w-[520px] rounded-md object-contain',
                            isDeleted && 'opacity-50 grayscale',
                        )}
                        preload="metadata"
                        src={embed.video.url}
                        onLoadedData={onResize}
                        onLoadedMetadata={onResize}
                    />
                </div>
            );
        }

        if (embed.type === 'image' && embed.image?.url) {
            return (
                <div className="mt-1 flex" key={index}>
                    <EmbedImage
                        alt={embed.title || 'Image'}
                        className="block"
                        imageClassName={cn(
                            'max-h-96 max-w-[520px] rounded-md object-contain',
                            isDeleted && 'opacity-50 grayscale',
                        )}
                        src={imageUrl}
                        style={
                            embed.image?.width && embed.image.height
                                ? {
                                      aspectRatio: `${embed.image.width} / ${embed.image.height}`,
                                  }
                                : { minHeight: '100px' }
                        }
                        onResize={onResize}
                    />
                </div>
            );
        }

        return (
            <div
                className="mt-1 flex max-w-[520px] overflow-hidden rounded-r-sm"
                key={index}
                style={{
                    borderLeft: `4px solid ${barColor ?? 'var(--color-embed-border)'}`,
                }}
            >
                <div
                    className={cn(
                        'flex w-full flex-col rounded-r-sm px-4 py-3',
                        variant === 'preview'
                            ? 'bg-embed-bg'
                            : 'bg-embed-bg/70',
                    )}
                >
                    {/* Provider */}
                    {embed.provider?.name && (
                        <p
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
                        </p>
                    )}

                    {/* Author */}
                    {embed.author?.name && (
                        <div className="mb-2 flex items-center gap-2">
                            {embed.author.icon_url && (
                                <img
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover"
                                    decoding="async"
                                    loading="eager"
                                    src={authorIconUrl}
                                />
                            )}
                            <span
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
                            </span>
                        </div>
                    )}

                    {/* Title + thumbnail side-by-side */}
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            {/* Title */}
                            {embed.title && (
                                <p
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
                                </p>
                            )}

                            {/* Description */}
                            {embed.description && (
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
                            )}

                            {/* Fields */}
                            {fieldRows.length > 0 && (
                                <div className="mt-2 flex flex-col gap-2">
                                    {fieldRows.map((row) => (
                                        <div
                                            className={cn(
                                                'grid gap-x-4',
                                                row.inline
                                                    ? `grid-cols-${Math.min(row.fields?.length ?? 1, 3)}`
                                                    : 'grid-cols-1',
                                            )}
                                            key={`row-${row.fields?.map((f) => f.name).join(',')}`}
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
                            )}
                        </div>

                        {/* Thumbnail */}
                        {embed.thumbnail?.url && (
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
                        )}
                    </div>

                    {/* Large image */}
                    {embed.image?.url && (
                        <EmbedImage
                            alt={embed.title || 'Image'}
                            className="mt-3 block w-full"
                            imageClassName={cn(
                                'max-h-72 w-full rounded object-contain',
                                isDeleted && 'opacity-50 grayscale',
                            )}
                            src={imageUrl}
                            style={
                                embed.image?.width && embed.image.height
                                    ? {
                                          aspectRatio: `${embed.image.width} / ${embed.image.height}`,
                                      }
                                    : { minHeight: '80px' }
                            }
                            onResize={onResize}
                        />
                    )}

                    {/* Footer */}
                    {(embed.footer?.text ?? embed.timestamp) && (
                        <div className="mt-3 flex items-center gap-2">
                            {embed.footer?.icon_url && (
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
                            )}
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
                    )}
                </div>
            </div>
        );
    },
);
EmbedCard.displayName = 'EmbedCard';

// ─── main component ──────────────────────────────────────────────────────────

export interface EmbedRendererProps {
    payload: MessagePayload;
    className?: string;
    variant?: 'preview' | 'chat';
    serverId?: string;
    isDeleted?: boolean;
    onResize?: () => void;
}

export const EmbedRenderer = ({
    payload,
    className,
    variant = 'preview',
    serverId,
    isDeleted,
    onResize,
}: EmbedRendererProps): ReactNode => {
    const hasAnything = Boolean(
        payload.content?.trim() || payload.embeds?.length || payload.poll,
    );

    if (!hasAnything && variant === 'preview') {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-12 text-center',
                    className,
                )}
            >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-secondary text-2xl">
                    📋
                </div>
                <p className="text-sm text-muted-foreground">
                    Nothing to preview yet. Fill in the form on the left.
                </p>
            </div>
        );
    }

    if (!hasAnything) return null;

    return (
        <div
            className={cn(
                variant === 'preview'
                    ? 'flex flex-col gap-0.5 rounded-md bg-bg-subtle p-4 font-sans shadow-lg'
                    : 'flex flex-col gap-0.5',
                className,
            )}
        >
            {/* Message content */}
            {payload.content && (
                <div
                    className="mb-1 text-sm leading-relaxed"
                    style={{ display: 'flow-root' }}
                >
                    <ParsedEmbedText
                        preset={ParserPresets.EMBED}
                        serverId={serverId}
                        size="sm"
                        text={payload.content}
                        wrap="preWrap"
                        onResize={onResize}
                    />
                </div>
            )}

            {/* Embeds */}
            {payload.embeds?.map((embed, i) => (
                <EmbedCard
                    embed={embed}
                    index={i}
                    isDeleted={isDeleted}
                    key={`embed-${embed.title ?? ''}-${embed.color ?? i}`}
                    serverId={serverId}
                    variant={variant}
                    onResize={onResize}
                />
            ))}

            {/* Poll preview */}
            {payload.poll &&
                (() => {
                    const visibleAnswers = payload.poll.answers.filter(
                        (a) => a.text.trim() !== '',
                    );
                    if (
                        visibleAnswers.length === 0 &&
                        !payload.poll.question.trim()
                    )
                        return null;
                    return (
                        <div
                            className={cn(
                                'mt-2 max-w-[520px] overflow-hidden rounded-lg border border-border-subtle bg-embed-bg',
                                isDeleted && 'opacity-60 grayscale',
                            )}
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3">
                                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-subtle px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    Poll
                                </span>
                                {payload.poll.question.trim() && (
                                    <p className="mt-2 text-base leading-snug font-semibold text-foreground">
                                        {payload.poll.question}
                                    </p>
                                )}
                            </div>

                            {/* Answers */}
                            {visibleAnswers.length > 0 && (
                                <ul className="flex flex-col gap-1.5 px-4 pb-3">
                                    {visibleAnswers.map((answer) => (
                                        <li key={`answer-${answer.text}`}>
                                            <button
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2.5 text-left text-sm text-foreground hover:bg-bg-secondary"
                                                type="button"
                                            >
                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border-subtle">
                                                    <span className="h-1.5 w-1.5 rounded-full" />
                                                </span>
                                                {answer.emoji?.name && (
                                                    <span>
                                                        {answer.emoji.name}
                                                    </span>
                                                )}
                                                <span className="flex-1">
                                                    {answer.text}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Footer meta */}
                            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle px-4 py-2.5">
                                <span className="text-xs text-muted-foreground">
                                    {payload.poll.duration}h
                                </span>
                                {payload.poll.allow_multiselect && (
                                    <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        Can select multiple
                                    </span>
                                )}
                                <span className="ml-auto text-[10px] text-muted-foreground">
                                    0 votes · poll not started
                                </span>
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
};
