import { type ReactNode } from 'react';

import type { Embed, MessagePayload } from '@/types/embed';
import { Link } from '@/ui/components/common/Link';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { cn } from '@/utils/cn';
import { getSafeUrl } from '@/utils/proxy';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

const colorToCss = (color: number | undefined): string | undefined => {
    if (color === undefined) return undefined;
    return `#${color.toString(16).padStart(6, '0')}`;
};

const formatTimestamp = (iso: string | undefined): string | undefined => {
    if (!iso) return undefined;
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
};

interface EmbedCardProps {
    embed: Embed;
    index: number;
    variant: 'preview' | 'chat';
    serverId?: string;
    isDeleted?: boolean;
}

const EmbedCard = ({
    embed,
    index,
    variant,
    serverId,
    isDeleted,
}: EmbedCardProps): ReactNode => {
    const barColor = colorToCss(embed.color);
    const hasContent =
        embed.title ??
        embed.description ??
        embed.author ??
        embed.footer ??
        embed.thumbnail ??
        embed.image ??
        (embed.fields && embed.fields.length > 0);

    if (!hasContent) return null;

    type FieldRow = { fields: typeof embed.fields; inline: boolean };
    const fieldRows: FieldRow[] = [];
    if (embed.fields) {
        let currentRow: NonNullable<typeof embed.fields> = [];
        for (const field of embed.fields) {
            if (field.inline) {
                currentRow.push(field);
                if (currentRow.length === 3) {
                    fieldRows.push({ fields: currentRow, inline: true });
                    currentRow = [];
                }
            } else {
                if (currentRow.length > 0) {
                    fieldRows.push({ fields: currentRow, inline: true });
                    currentRow = [];
                }
                fieldRows.push({ fields: [field], inline: false });
            }
        }
        if (currentRow.length > 0) {
            fieldRows.push({ fields: currentRow, inline: true });
        }
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
                    variant === 'preview' ? 'bg-embed-bg' : 'bg-embed-bg/70',
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
                                <ParsedText
                                    nodes={parseText(
                                        embed.provider.name,
                                        ParserPresets.EMBED_INLINE,
                                    )}
                                    serverId={serverId}
                                    size="xs"
                                    variant={isDeleted ? 'danger' : undefined}
                                />
                            </Link>
                        ) : (
                            <ParsedText
                                nodes={parseText(
                                    embed.provider.name,
                                    ParserPresets.EMBED_INLINE,
                                )}
                                serverId={serverId}
                                size="xs"
                                variant={isDeleted ? 'danger' : undefined}
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
                                src={getSafeUrl(embed.author.icon_url)}
                            />
                        )}
                        <span
                            className={cn(
                                'text-sm font-semibold',
                                isDeleted ? 'text-danger' : 'text-foreground',
                            )}
                        >
                            {embed.author.url ? (
                                <Link
                                    className="hover:underline"
                                    href={embed.author.url}
                                >
                                    <ParsedText
                                        nodes={parseText(
                                            embed.author.name,
                                            ParserPresets.EMBED_INLINE,
                                        )}
                                        serverId={serverId}
                                        size="sm"
                                        variant={
                                            isDeleted ? 'danger' : undefined
                                        }
                                    />
                                </Link>
                            ) : (
                                <ParsedText
                                    nodes={parseText(
                                        embed.author.name,
                                        ParserPresets.EMBED_INLINE,
                                    )}
                                    serverId={serverId}
                                    size="sm"
                                    variant={isDeleted ? 'danger' : undefined}
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
                                        <ParsedText
                                            nodes={parseText(
                                                embed.title,
                                                ParserPresets.EMBED_INLINE,
                                            )}
                                            serverId={serverId}
                                            size="base"
                                            variant={
                                                isDeleted ? 'danger' : undefined
                                            }
                                        />
                                    </Link>
                                ) : (
                                    <ParsedText
                                        nodes={parseText(
                                            embed.title,
                                            ParserPresets.EMBED_INLINE,
                                        )}
                                        serverId={serverId}
                                        size="base"
                                        variant={
                                            isDeleted ? 'danger' : undefined
                                        }
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
                                <ParsedText
                                    nodes={parseText(
                                        embed.description,
                                        ParserPresets.EMBED,
                                    )}
                                    serverId={serverId}
                                    size="sm"
                                    variant={isDeleted ? 'danger' : undefined}
                                    wrap="preWrap"
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
                                                        display: 'flow-root',
                                                    }}
                                                >
                                                    <ParsedText
                                                        nodes={parseText(
                                                            field.name,
                                                            ParserPresets.EMBED_INLINE,
                                                        )}
                                                        serverId={serverId}
                                                        size="xs"
                                                        variant={
                                                            isDeleted
                                                                ? 'danger'
                                                                : undefined
                                                        }
                                                    />
                                                </div>
                                                <div
                                                    className="text-sm text-muted-foreground"
                                                    style={{
                                                        display: 'flow-root',
                                                    }}
                                                >
                                                    <ParsedText
                                                        nodes={parseText(
                                                            field.value,
                                                            ParserPresets.EMBED,
                                                        )}
                                                        serverId={serverId}
                                                        size="sm"
                                                        variant={
                                                            isDeleted
                                                                ? 'danger'
                                                                : undefined
                                                        }
                                                        wrap="preWrap"
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
                        <img
                            alt=""
                            className={cn(
                                'ml-auto h-20 w-20 shrink-0 rounded object-cover',
                                isDeleted && 'opacity-50 grayscale',
                            )}
                            src={getSafeUrl(embed.thumbnail.url)}
                        />
                    )}
                </div>

                {/* Large image */}
                {embed.image?.url && (
                    <img
                        alt=""
                        className={cn(
                            'mt-3 max-h-72 w-full rounded object-contain',
                            isDeleted && 'opacity-50 grayscale',
                        )}
                        src={getSafeUrl(embed.image.url)}
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
                                src={getSafeUrl(embed.footer.icon_url)}
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
                            <ParsedText
                                nodes={parseText(
                                    [
                                        embed.footer?.text,
                                        formatTimestamp(embed.timestamp),
                                    ]
                                        .filter(Boolean)
                                        .join(' • '),
                                    ParserPresets.EMBED,
                                )}
                                serverId={serverId}
                                size="xs"
                                variant={isDeleted ? 'danger' : 'muted'}
                                wrap="preWrap"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── main component ──────────────────────────────────────────────────────────

export interface EmbedRendererProps {
    payload: MessagePayload;
    className?: string;
    variant?: 'preview' | 'chat';
    serverId?: string;
    isDeleted?: boolean;
}

export const EmbedRenderer = ({
    payload,
    className,
    variant = 'preview',
    serverId,
    isDeleted,
}: EmbedRendererProps): ReactNode => {
    const hasAnything =
        payload.content ??
        (payload.embeds && payload.embeds.length > 0) ??
        payload.poll;

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
                    <ParsedText
                        nodes={parseText(payload.content, ParserPresets.EMBED)}
                        serverId={serverId}
                        size="sm"
                        wrap="preWrap"
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
