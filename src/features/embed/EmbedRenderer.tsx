import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { interactionsApi } from '@/api/interactions/interactions.api';
import type { ButtonComponent, MessagePayload } from '@/types/embed';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { useToast } from '@/ui/primitives/Toast';
import { cn } from '@/utils/cn';
import { extractApiError } from '@/utils/extractApiError';
import { ParserPresets } from '@/utils/textParser/parser';

import { EmbedButtons } from './EmbedButtons';
import { EmbedCard } from './EmbedCard';
import { ParsedEmbedText } from './ParsedEmbedText';
import { getEmbedKey } from './embedUtils';

export interface EmbedRendererProps {
    payload: MessagePayload;
    className?: string;
    variant?: 'preview' | 'chat';
    serverId?: string;
    channelId?: string;
    messageId?: string;
    senderId?: string;
    isEphemeral?: boolean;
    invocationId?: string;
    isDeleted?: boolean;
    isReportPreview?: boolean;
    onResize?: () => void;
}

export const EmbedRenderer = ({
    payload,
    className,
    variant = 'preview',
    serverId,
    channelId,
    messageId,
    senderId,
    isEphemeral,
    invocationId,
    isDeleted,
    isReportPreview,
    onResize,
}: EmbedRendererProps): ReactNode => {
    const { showToast } = useToast();
    const [pendingButtonKey, setPendingButtonKey] = useState<string | null>(
        null,
    );
    const hasAnything = Boolean(
        payload.content?.trim() ||
        payload.embeds?.length ||
        payload.components?.length ||
        payload.poll,
    );
    const visiblePollAnswers = useMemo(
        () =>
            payload.poll?.answers.filter(
                (answer): boolean => answer.text.trim() !== '',
            ) ?? [],
        [payload.poll?.answers],
    );
    const shouldRenderPollPreview = Boolean(
        payload.poll &&
        (visiblePollAnswers.length > 0 || payload.poll.question.trim()),
    );

    const handleButtonClick = useCallback(
        async (
            componentIndex: number,
            button: ButtonComponent,
        ): Promise<void> => {
            if (
                button.style === 'link' ||
                button.disabled === true ||
                !serverId ||
                !channelId ||
                !messageId ||
                !button.custom_id
            ) {
                return;
            }

            const buttonKey = button.custom_id;
            setPendingButtonKey(buttonKey);
            try {
                await interactionsApi.createComponentInteraction({
                    serverId,
                    channelId,
                    messageId,
                    componentIndex,
                    customId: button.custom_id,
                    invocationId: isEphemeral ? invocationId : undefined,
                    botUserId: isEphemeral ? senderId : undefined,
                });
            } catch (error) {
                showToast(extractApiError(error), 'error');
            } finally {
                setPendingButtonKey(null);
            }
        },
        [
            channelId,
            invocationId,
            isEphemeral,
            messageId,
            senderId,
            serverId,
            showToast,
        ],
    );

    const handleButtonClickVoid = useCallback(
        (componentIndex: number, button: ButtonComponent): void => {
            void handleButtonClick(componentIndex, button);
        },
        [handleButtonClick],
    );

    if (isReportPreview) {
        if (!hasAnything) return null;

        return (
            <div className="mt-2 flex flex-col items-start gap-2">
                {payload.embeds?.map((embed, index) => (
                    <div
                        className="w-full max-w-[520px] rounded-r-sm border-l-4 border-primary bg-embed-bg/70 p-3"
                        // Duplicate saved embeds can share the same content key.
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${getEmbedKey(embed)}-${index}`}
                    >
                        {embed.provider?.name ? (
                            <div className="text-xs text-text-muted">
                                {embed.provider.name}
                            </div>
                        ) : null}
                        {embed.author?.name ? (
                            <div className="mt-1 text-xs font-medium">
                                {embed.author.name}
                            </div>
                        ) : null}
                        {embed.title ? (
                            <div className="mt-1 font-semibold">
                                {embed.title}
                            </div>
                        ) : null}
                        {embed.description ? (
                            <div className="mt-1 whitespace-pre-wrap">
                                {embed.description}
                            </div>
                        ) : null}
                        {embed.fields?.map((field) => (
                            <div
                                className="mt-2"
                                key={`${field.name}-${field.value}`}
                            >
                                <div className="text-xs font-semibold">
                                    {field.name}
                                </div>
                                <div className="whitespace-pre-wrap">
                                    {field.value}
                                </div>
                            </div>
                        ))}
                        {embed.footer?.text ? (
                            <div className="mt-2 text-xs text-text-muted">
                                {embed.footer.text}
                            </div>
                        ) : null}
                        {embed.timestamp ? (
                            <div className="mt-1 text-xs text-text-muted">
                                {embed.timestamp}
                            </div>
                        ) : null}
                        {embed.url ||
                        embed.author?.url ||
                        embed.provider?.url ? (
                            <div className="mt-2 text-xs break-all text-text-muted">
                                {[
                                    embed.url,
                                    embed.author?.url,
                                    embed.provider?.url,
                                ]
                                    .filter((url): url is string =>
                                        Boolean(url),
                                    )
                                    .join('\n')}
                            </div>
                        ) : null}
                        {embed.image?.url ||
                        embed.thumbnail?.url ||
                        embed.video?.url ? (
                            <div className="mt-2 text-xs break-all text-text-muted">
                                External media preview omitted
                                {[
                                    embed.image?.url,
                                    embed.thumbnail?.url,
                                    embed.video?.url,
                                ]
                                    .filter((url): url is string =>
                                        Boolean(url),
                                    )
                                    .join('\n')}
                            </div>
                        ) : null}
                    </div>
                ))}
                {payload.components?.map((component, index) => (
                    <Text
                        className="rounded-md border border-border-subtle px-2 py-1"
                        // Components can repeat labels and URLs; preserve each row.
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${component.custom_id ?? component.url ?? component.label ?? 'button'}-${index}`}
                        size="sm"
                    >
                        {component.emoji?.name
                            ? `${component.emoji.name} `
                            : ''}
                        {component.label ?? 'Button'}
                        {component.url ? ` · ${component.url}` : ''}
                    </Text>
                ))}
            </div>
        );
    }

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
                <Text as="p" size="sm" variant="muted">
                    Nothing to preview yet. Fill in the form on the left.
                </Text>
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
            {payload.content ? (
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
            ) : null}

            {/* Embeds */}
            {payload.embeds?.map((embed, embedIndex) => (
                <div
                    className="flex flex-col items-start"
                    // a message can carry duplicate embeds (same link posted twice,
                    // bridged duplicates), so the content key alone can collide;
                    // pair it with the index (embeds within a message are a fixed,
                    // non-reordered list, so this is a safe disambiguator).
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${getEmbedKey(embed)}-${embedIndex}`}
                >
                    <EmbedCard
                        embed={embed}
                        isDeleted={isDeleted}
                        serverId={serverId}
                        variant={variant}
                        onResize={onResize}
                    />
                </div>
            ))}

            <EmbedButtons
                buttons={payload.components}
                channelId={channelId}
                isDeleted={isDeleted}
                messageId={messageId}
                pendingButtonKey={pendingButtonKey}
                serverId={serverId}
                onButtonClick={handleButtonClickVoid}
            />

            {/* Poll preview */}
            {shouldRenderPollPreview && payload.poll ? (
                <div
                    className={cn(
                        'mt-2 max-w-[520px] overflow-hidden rounded-lg border border-border-subtle bg-embed-bg',
                        isDeleted && 'opacity-60 grayscale',
                    )}
                >
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3">
                        <Text
                            className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-subtle px-2.5 py-0.5 text-[10px]"
                            tracking="widest"
                            transform="uppercase"
                            variant="muted"
                            weight="semibold"
                        >
                            Poll
                        </Text>
                        {payload.poll.question.trim() ? (
                            <Text
                                as="p"
                                className="mt-2"
                                leading="snug"
                                size="base"
                                variant="default"
                                weight="semibold"
                            >
                                {payload.poll.question}
                            </Text>
                        ) : null}
                    </div>

                    {/* Answers */}
                    {visiblePollAnswers.length > 0 ? (
                        <ul className="flex flex-col gap-1.5 px-4 pb-3">
                            {visiblePollAnswers.map((answer) => (
                                <li key={`answer-${answer.text}`}>
                                    <Pressable className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2.5 text-left text-sm text-foreground hover:bg-bg-secondary">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border-subtle">
                                            <span className="h-1.5 w-1.5 rounded-full" />
                                        </span>
                                        {answer.emoji?.name ? (
                                            <Text>{answer.emoji.name}</Text>
                                        ) : null}
                                        <Text className="flex-1">
                                            {answer.text}
                                        </Text>
                                    </Pressable>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {/* Footer meta */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle px-4 py-2.5">
                        <Text size="xs" variant="muted">
                            {payload.poll.duration}h
                        </Text>
                        {payload.poll.allow_multiselect ? (
                            <Text
                                className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px]"
                                variant="muted"
                                weight="medium"
                            >
                                Can select multiple
                            </Text>
                        ) : null}
                        <Text className="ml-auto text-[10px]" variant="muted">
                            0 votes · poll not started
                        </Text>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
