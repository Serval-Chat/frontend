import React, { type ReactNode, useState } from 'react';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import type {
    Embed,
    EmbedField,
    MessagePayload,
    PollAnswer,
} from '@/types/embed';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { TextArea } from '@/ui/components/common/TextArea';
import { Toggle } from '@/ui/components/common/Toggle';
import { cn } from '@/utils/cn';

const hexToDecimal = (hex: string): number =>
    parseInt(hex.replace('#', ''), 16);

const decimalToHex = (n: number | undefined): string => {
    if (n === undefined) return '#5865f2';
    return `#${n.toString(16).padStart(6, '0')}`;
};

const cloneEmbeds = (embeds: Embed[]): Embed[] =>
    JSON.parse(JSON.stringify(embeds)) as Embed[];

interface SectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string | number;
}

const Section = ({
    title,
    children,
    defaultOpen = true,
    badge,
}: SectionProps): ReactNode => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-lg border border-border-subtle">
            <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                }}
            >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {title}
                    {badge !== undefined && (
                        <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {badge}
                        </span>
                    )}
                </span>
                {open ? (
                    <ChevronUp className="text-muted-foreground" size={16} />
                ) : (
                    <ChevronDown className="text-muted-foreground" size={16} />
                )}
            </button>

            {open && (
                <div className="border-t border-border-subtle px-4 pt-3 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

interface FieldProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

const Field = ({ label, hint, children, className }: FieldProps): ReactNode => (
    <div className={cn('flex flex-col gap-1', className)}>
        <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
        </label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
);

interface FieldsEditorProps {
    fields: EmbedField[];
    onChange: (fields: EmbedField[]) => void;
}

const FieldsEditor = ({ fields, onChange }: FieldsEditorProps): ReactNode => {
    const update = (idx: number, patch: Partial<EmbedField>): void => {
        const next = fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
        onChange(next);
    };

    const remove = (idx: number): void => {
        onChange(fields.filter((_, i) => i !== idx));
    };

    const add = (): void => {
        if (fields.length >= 25) return;
        onChange([
            ...fields,
            { name: 'Field name', value: 'Field value', inline: false },
        ]);
    };

    return (
        <div className="flex flex-col gap-3">
            {fields.map((field, idx) => (
                <div
                    className="rounded-md border border-border-subtle bg-bg-subtle p-3"
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                            Field {idx + 1}
                        </span>
                        <button
                            className="text-muted-foreground transition-colors hover:text-danger"
                            type="button"
                            onClick={() => {
                                remove(idx);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Field label="Name">
                            <Input
                                placeholder="Field name"
                                value={field.name}
                                onChange={(e) => {
                                    update(idx, { name: e.target.value });
                                }}
                            />
                        </Field>
                        <Field label="Value">
                            <TextArea
                                placeholder="Field value"
                                value={field.value}
                                onChange={(e) => {
                                    update(idx, { value: e.target.value });
                                }}
                            />
                        </Field>
                        <Toggle
                            checked={field.inline ?? false}
                            label="Inline"
                            onCheckedChange={(checked) => {
                                update(idx, { inline: checked });
                            }}
                        />
                    </div>
                </div>
            ))}

            <Button
                className="w-full"
                disabled={fields.length >= 25}
                size="sm"
                variant="normal"
                onClick={add}
            >
                <Plus size={14} />
                Add field {fields.length}/25
            </Button>
        </div>
    );
};

interface EmbedEditorProps {
    embed: Embed;
    index: number;
    total: number;
    onChange: (embed: Embed) => void;
    onRemove: () => void;
}

const EmbedEditor = ({
    embed,
    index,
    total,
    onChange,
    onRemove,
}: EmbedEditorProps): ReactNode => {
    const set = <K extends keyof Embed>(key: K, value: Embed[K]): void => {
        onChange({ ...embed, [key]: value });
    };

    const setAuthor = (
        key: keyof NonNullable<Embed['author']>,
        val: string,
    ): void => {
        onChange({
            ...embed,
            author: { name: '', ...embed.author, [key]: val },
        });
    };

    const setFooter = (
        key: keyof NonNullable<Embed['footer']>,
        val: string,
    ): void => {
        onChange({
            ...embed,
            footer: { text: '', ...embed.footer, [key]: val },
        });
    };

    return (
        <Section
            badge={total > 1 ? `${index + 1}/${total}` : undefined}
            defaultOpen={index === 0}
            title={`Embed ${index + 1}${embed.title ? ` — ${embed.title}` : ''}`}
        >
            <div className="flex flex-col gap-4">
                {/* Basic */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <Field className="flex-1" label="Title">
                            <Input
                                maxLength={256}
                                placeholder="Embed title"
                                value={embed.title ?? ''}
                                onChange={(e) => {
                                    set('title', e.target.value || undefined);
                                }}
                            />
                        </Field>
                        <Field label="Color">
                            <div className="flex h-10 items-center gap-2">
                                <input
                                    className="h-8 w-10 cursor-pointer rounded border border-border-subtle bg-transparent"
                                    type="color"
                                    value={decimalToHex(embed.color)}
                                    onChange={(e) => {
                                        set(
                                            'color',
                                            hexToDecimal(e.target.value),
                                        );
                                    }}
                                />
                                <button
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    title="Remove color"
                                    type="button"
                                    onClick={() => {
                                        set('color', undefined);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </Field>
                    </div>

                    <Field hint="Makes the title a clickable link" label="URL">
                        <Input
                            placeholder="https://example.com"
                            type="url"
                            value={embed.url ?? ''}
                            onChange={(e) => {
                                set('url', e.target.value || undefined);
                            }}
                        />
                    </Field>

                    <Field label="Description">
                        <TextArea
                            maxLength={4096}
                            placeholder="Embed description (markdown supported)"
                            value={embed.description ?? ''}
                            onChange={(e) => {
                                set('description', e.target.value || undefined);
                            }}
                        />
                    </Field>
                </div>

                {/* Author */}
                <Section defaultOpen={false} title="Author">
                    <div className="flex flex-col gap-3">
                        <Field label="Name">
                            <Input
                                maxLength={256}
                                placeholder="Author name"
                                value={embed.author?.name ?? ''}
                                onChange={(e) => {
                                    setAuthor('name', e.target.value);
                                }}
                            />
                        </Field>
                        <Field label="URL">
                            <Input
                                placeholder="https://example.com"
                                type="url"
                                value={embed.author?.url ?? ''}
                                onChange={(e) => {
                                    setAuthor('url', e.target.value);
                                }}
                            />
                        </Field>
                        <Field label="Icon URL">
                            <Input
                                placeholder="https://example.com/icon.png"
                                type="url"
                                value={embed.author?.icon_url ?? ''}
                                onChange={(e) => {
                                    setAuthor('icon_url', e.target.value);
                                }}
                            />
                        </Field>
                    </div>
                </Section>

                {/* Footer */}
                <Section defaultOpen={false} title="Footer">
                    <div className="flex flex-col gap-3">
                        <Field label="Text">
                            <Input
                                maxLength={2048}
                                placeholder="Footer text"
                                value={embed.footer?.text ?? ''}
                                onChange={(e) => {
                                    setFooter('text', e.target.value);
                                }}
                            />
                        </Field>
                        <Field label="Icon URL">
                            <Input
                                placeholder="https://example.com/icon.png"
                                type="url"
                                value={embed.footer?.icon_url ?? ''}
                                onChange={(e) => {
                                    setFooter('icon_url', e.target.value);
                                }}
                            />
                        </Field>
                        <Field label="Timestamp">
                            <Input
                                type="datetime-local"
                                value={
                                    embed.timestamp
                                        ? embed.timestamp.slice(0, 16)
                                        : ''
                                }
                                onChange={(e) => {
                                    set(
                                        'timestamp',
                                        e.target.value
                                            ? new Date(
                                                  e.target.value,
                                              ).toISOString()
                                            : undefined,
                                    );
                                }}
                            />
                        </Field>
                    </div>
                </Section>

                {/* Media */}
                <Section defaultOpen={false} title="Media">
                    <div className="flex flex-col gap-3">
                        <Field
                            hint="Small image in the top-right corner"
                            label="Thumbnail URL"
                        >
                            <Input
                                placeholder="https://example.com/thumbnail.png"
                                type="url"
                                value={embed.thumbnail?.url ?? ''}
                                onChange={(e) => {
                                    set(
                                        'thumbnail',
                                        e.target.value
                                            ? { url: e.target.value }
                                            : undefined,
                                    );
                                }}
                            />
                        </Field>
                        <Field
                            hint="Large image below the description"
                            label="Image URL"
                        >
                            <Input
                                placeholder="https://example.com/image.png"
                                type="url"
                                value={embed.image?.url ?? ''}
                                onChange={(e) => {
                                    set(
                                        'image',
                                        e.target.value
                                            ? { url: e.target.value }
                                            : undefined,
                                    );
                                }}
                            />
                        </Field>
                    </div>
                </Section>

                {/* Fields */}
                <Section
                    badge={embed.fields?.length ?? 0}
                    defaultOpen={false}
                    title="Fields"
                >
                    <FieldsEditor
                        fields={embed.fields ?? []}
                        onChange={(fields) => {
                            set(
                                'fields',
                                fields.length > 0 ? fields : undefined,
                            );
                        }}
                    />
                </Section>

                {total > 1 && (
                    <Button
                        className="mt-1 w-full"
                        size="sm"
                        variant="danger"
                        onClick={onRemove}
                    >
                        <Trash2 size={14} />
                        Remove embed {index + 1}
                    </Button>
                )}
            </div>
        </Section>
    );
};

interface PollEditorProps {
    answers: PollAnswer[];
    onChange: (answers: PollAnswer[]) => void;
}

const PollAnswersEditor = ({
    answers,
    onChange,
}: PollEditorProps): ReactNode => {
    const update = (idx: number, text: string): void => {
        onChange(answers.map((a, i) => (i === idx ? { ...a, text } : a)));
    };
    const remove = (idx: number): void => {
        onChange(answers.filter((_, i) => i !== idx));
    };
    const add = (): void => {
        if (answers.length >= 10) return;
        onChange([...answers, { text: '' }]);
    };

    return (
        <div className="flex flex-col gap-2">
            {answers.map((answer, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <div className="flex items-center gap-2" key={idx}>
                    <Input
                        placeholder={`Answer ${idx + 1}`}
                        value={answer.text}
                        onChange={(e) => {
                            update(idx, e.target.value);
                        }}
                    />
                    <button
                        className="shrink-0 text-muted-foreground transition-colors hover:text-danger"
                        type="button"
                        onClick={() => {
                            remove(idx);
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <Button
                className="w-full"
                disabled={answers.length >= 10}
                size="sm"
                variant="normal"
                onClick={add}
            >
                <Plus size={14} />
                Add answer {answers.length}/10
            </Button>
        </div>
    );
};

export interface EmbedCreatorProps {
    value: MessagePayload;
    onChange: (payload: MessagePayload) => void;
}

export const EmbedCreator = ({
    value,
    onChange,
}: EmbedCreatorProps): ReactNode => {
    const set = <K extends keyof MessagePayload>(
        key: K,
        val: MessagePayload[K],
    ): void => {
        onChange({ ...value, [key]: val });
    };

    const addEmbed = (): void => {
        if ((value.embeds?.length ?? 0) >= 10) return;
        set('embeds', [
            ...(value.embeds ?? []),
            { type: 'rich' as const, color: 0x5865f2 },
        ]);
    };

    const updateEmbed = (idx: number, embed: Embed): void => {
        const next = cloneEmbeds(value.embeds ?? []);
        next[idx] = embed;
        set('embeds', next);
    };

    const removeEmbed = (idx: number): void => {
        set(
            'embeds',
            (value.embeds ?? []).filter((_, i) => i !== idx),
        );
    };

    const hasPoll = Boolean(value.poll);
    const togglePoll = (enabled: boolean): void => {
        if (enabled) {
            set('poll', {
                question: '',
                answers: [{ text: '' }, { text: '' }],
                duration: 24,
            });
        } else {
            const next = { ...value };
            delete next.poll;
            onChange(next);
        }
    };

    const json = JSON.stringify(value, null, 2);

    return (
        <div className="flex flex-col gap-4">
            <Section title="Message">
                <div className="flex flex-col gap-3">
                    <Field
                        hint="Plain text that appears above embeds"
                        label="Content"
                    >
                        <TextArea
                            maxLength={2000}
                            placeholder="Message content…"
                            value={value.content ?? ''}
                            onChange={(e) => {
                                set('content', e.target.value || undefined);
                            }}
                        />
                    </Field>
                    <div className="flex gap-6">
                        <Toggle
                            checked={value.tts ?? false}
                            label="TTS"
                            onCheckedChange={(v) => {
                                set('tts', v || undefined);
                            }}
                        />
                        <Toggle
                            checked={value.suppress_embeds ?? false}
                            label="Suppress embeds"
                            onCheckedChange={(v) => {
                                set('suppress_embeds', v || undefined);
                            }}
                        />
                        <Toggle
                            checked={value.ephemeral ?? false}
                            label="Ephemeral"
                            onCheckedChange={(v) => {
                                set('ephemeral', v || undefined);
                            }}
                        />
                    </div>
                </div>
            </Section>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        Embeds{' '}
                        <span className="text-muted-foreground">
                            ({value.embeds?.length ?? 0}/10)
                        </span>
                    </p>
                    <Button
                        disabled={(value.embeds?.length ?? 0) >= 10}
                        size="sm"
                        variant="primary"
                        onClick={addEmbed}
                    >
                        <Plus size={14} />
                        Add embed
                    </Button>
                </div>

                {value.embeds?.map((embed, idx) => (
                    <EmbedEditor
                        embed={embed}
                        index={idx}
                        // eslint-disable-next-line react/no-array-index-key
                        key={idx}
                        total={value.embeds?.length ?? 1}
                        onChange={(e) => {
                            updateEmbed(idx, e);
                        }}
                        onRemove={() => {
                            removeEmbed(idx);
                        }}
                    />
                ))}

                {(!value.embeds || value.embeds.length === 0) && (
                    <div className="rounded-lg border border-dashed border-border-subtle py-6 text-center text-sm text-muted-foreground">
                        No embeds yet. Click &ldquo;Add embed&rdquo; to get
                        started.
                    </div>
                )}
            </div>

            <Section defaultOpen={false} title="Poll">
                <div className="flex flex-col gap-3">
                    <Toggle
                        checked={hasPoll}
                        label="Include a poll"
                        onCheckedChange={togglePoll}
                    />

                    {hasPoll && value.poll && (
                        <>
                            <Field label="Question">
                                <Input
                                    placeholder="What do you think?"
                                    value={value.poll.question}
                                    onChange={(e) => {
                                        set('poll', {
                                            ...value.poll!,
                                            question: e.target.value,
                                        });
                                    }}
                                />
                            </Field>
                            <Field label="Answers">
                                <PollAnswersEditor
                                    answers={value.poll.answers}
                                    onChange={(answers) => {
                                        set('poll', {
                                            ...value.poll!,
                                            answers,
                                        });
                                    }}
                                />
                            </Field>
                            <div className="flex gap-4">
                                <Field
                                    className="flex-1"
                                    label="Duration (hours)"
                                >
                                    <Input
                                        min={1}
                                        type="number"
                                        value={value.poll.duration}
                                        onChange={(e) => {
                                            set('poll', {
                                                ...value.poll!,
                                                duration: Number(
                                                    e.target.value,
                                                ),
                                            });
                                        }}
                                    />
                                </Field>
                                <Field
                                    className="flex items-end pb-1"
                                    label="Multi-select"
                                >
                                    <Toggle
                                        checked={
                                            value.poll.allow_multiselect ??
                                            false
                                        }
                                        label=""
                                        onCheckedChange={(v) => {
                                            set('poll', {
                                                ...value.poll!,
                                                allow_multiselect:
                                                    v || undefined,
                                            });
                                        }}
                                    />
                                </Field>
                            </div>
                        </>
                    )}
                </div>
            </Section>

            <Section defaultOpen={false} title="JSON output">
                <div className="relative">
                    <textarea
                        readOnly
                        className="custom-scrollbar w-full resize-none rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 font-mono text-xs text-foreground"
                        rows={14}
                        value={json}
                    />
                    <button
                        className={cn(
                            'absolute top-2 right-2 rounded border border-border-subtle bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground',
                        )}
                        title="Copy JSON"
                        type="button"
                        onClick={() => {
                            void navigator.clipboard.writeText(json);
                        }}
                    >
                        Copy
                    </button>
                </div>
            </Section>
        </div>
    );
};
