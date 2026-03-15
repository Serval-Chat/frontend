import { type ReactNode } from 'react';

import type { Embed, MessagePayload } from '@/types/embed';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { cn } from '@/utils/cn';
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
}

const EmbedCard = ({ embed, index }: EmbedCardProps): ReactNode => {
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
                borderLeft: `4px solid ${barColor ?? 'var(--color-border-subtle)'}`,
            }}
        >
            <div className="flex w-full flex-col rounded-r-sm bg-bg-secondary px-4 py-3">
                {/* Provider */}
                {embed.provider?.name && (
                    <p className="mb-0.5 text-xs text-muted-foreground">
                        {embed.provider.url ? (
                            <a
                                className="hover:underline"
                                href={embed.provider.url}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {embed.provider.name}
                            </a>
                        ) : (
                            embed.provider.name
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
                                src={embed.author.icon_url}
                            />
                        )}
                        <span className="text-sm font-semibold text-foreground">
                            {embed.author.url ? (
                                <a
                                    className="hover:underline"
                                    href={embed.author.url}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    {embed.author.name}
                                </a>
                            ) : (
                                embed.author.name
                            )}
                        </span>
                    </div>
                )}

                {/* Title + thumbnail side-by-side */}
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        {/* Title */}
                        {embed.title && (
                            <p className="mb-1 text-base font-semibold text-foreground">
                                {embed.url ? (
                                    <a
                                        className="text-primary hover:underline"
                                        href={embed.url}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        <ParsedText
                                            nodes={parseText(
                                                embed.title,
                                                ParserPresets.EMBED_INLINE,
                                            )}
                                            size="base"
                                        />
                                    </a>
                                ) : (
                                    <ParsedText
                                        nodes={parseText(
                                            embed.title,
                                            ParserPresets.EMBED_INLINE,
                                        )}
                                        size="base"
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
                                    size="sm"
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
                                                <p className="text-xs font-semibold text-foreground">
                                                    {field.name}
                                                </p>
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
                                                        size="sm"
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
                            className="ml-auto h-20 w-20 shrink-0 rounded object-cover"
                            src={embed.thumbnail.url}
                        />
                    )}
                </div>

                {/* Large image */}
                {embed.image?.url && (
                    <img
                        alt=""
                        className="mt-3 max-h-72 w-full rounded object-contain"
                        src={embed.image.url}
                    />
                )}

                {/* Footer */}
                {(embed.footer?.text ?? embed.timestamp) && (
                    <div className="mt-3 flex items-center gap-2">
                        {embed.footer?.icon_url && (
                            <img
                                alt=""
                                className="h-5 w-5 rounded-full object-cover"
                                src={embed.footer.icon_url}
                            />
                        )}
                        <p className="text-xs text-muted-foreground">
                            {[
                                embed.footer?.text,
                                formatTimestamp(embed.timestamp),
                            ]
                                .filter(Boolean)
                                .join(' • ')}
                        </p>
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
}

export const EmbedRenderer = ({
    payload,
    className,
}: EmbedRendererProps): ReactNode => {
    const hasAnything =
        payload.content ??
        (payload.embeds && payload.embeds.length > 0) ??
        payload.poll;

    if (!hasAnything) {
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

    return (
        <div
            className={cn(
                'flex flex-col gap-0.5 rounded-md bg-bg-subtle p-4 font-sans shadow-lg',
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
                    key={`embed-${embed.title ?? ''}-${embed.color ?? i}`}
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
                        <div className="mt-2 max-w-[520px] overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary">
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
