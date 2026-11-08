import React, { useMemo } from 'react';

import type {
    MessageAttachment,
    MessagePoll,
    ReadOnlyMessagePoll,
} from '@/api/chat/chat.types';
import {
    useCategories,
    useChannels,
    useSticker,
} from '@/api/servers/servers.queries';
import type {
    Category,
    Channel,
    Role,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import { EmbedRenderer } from '@/features/embed/EmbedRenderer';
import { StickerInfoBox } from '@/features/emoji/StickerInfoBox';
import { ParsedText } from '@/features/messages/ParsedText';
import { useStickerInfoBox } from '@/hooks/useStickerInfoBox';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import type { ButtonComponent, Embed } from '@/types/embed';
import { Box } from '@/ui/primitives/Box';
import { PausedAnimatedImage } from '@/ui/primitives/PausedAnimatedImage';
import { Text } from '@/ui/primitives/Text';
import { Tooltip } from '@/ui/primitives/Tooltip';
import { isAnimatedImageUrl } from '@/utils/animationPreferences';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import {
    getAllowedMessageFeatures,
    getBlockedMarkdownFeatures,
} from '@/utils/markdownBlockade';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { FileEmbed } from './FileEmbed';
import type { MessageChannelData } from './Message/Message.types';
import { Poll } from './Poll';

interface MessageContentProps {
    text: string;
    serverId?: string;
    stickerId?: string | null;
    embeds?: Embed[];
    components?: ButtonComponent[];
    attachments?: MessageAttachment[];
    poll?: MessagePoll | null;
    reportPoll?: ReadOnlyMessagePoll;
    isDeleted?: boolean;
    isEdited?: boolean;
    messageId?: string;
    channelId?: string;
    serverDetails?: Server;
    senderId?: string;
    senderMember?: ServerMember;
    senderRoles?: Role[];
    isEphemeral?: boolean;
    isFailed?: boolean;
    isReportPreview?: boolean;
    invocationId?: string;
    messageChannelData?: MessageChannelData;
    onResize?: () => void;
}

interface MessageContentBodyProps extends MessageContentProps {
    channels: Channel[];
    categories: Category[];
}

const MessageSticker = ({
    stickerId,
    onResize,
}: {
    stickerId: string;
    onResize?: () => void;
}) => {
    const { data: sticker } = useSticker(stickerId);
    const limitedAnimations = useLimitedAnimations();
    const {
        selectedSticker,
        infoBoxPosition,
        server,
        showStickerInfo,
        closeInfoBox,
    } = useStickerInfoBox();

    if (!sticker) return null;

    return (
        <>
            <div className="mt-1 flex max-w-[240px] flex-col gap-1">
                <Tooltip fullWidth content={sticker.name} position="top">
                    <button
                        className="block w-full cursor-pointer border-none bg-transparent p-0 transition-opacity outline-none hover:opacity-90 active:opacity-80"
                        type="button"
                        onClick={(event): void => {
                            showStickerInfo(
                                {
                                    id: sticker.id,
                                    name: sticker.name,
                                    url: sticker.imageUrl,
                                    serverId: sticker.serverId,
                                },
                                event,
                            );
                        }}
                    >
                        <PausedAnimatedImage
                            alt={sticker.name}
                            className="aspect-square w-full select-none"
                            paused={
                                limitedAnimations
                                    ? isAnimatedImageUrl(sticker.imageUrl)
                                    : false
                            }
                            src={resolveApiUrl(sticker.imageUrl) || ''}
                            onLoad={onResize}
                        />
                    </button>
                </Tooltip>
            </div>
            {selectedSticker && infoBoxPosition ? (
                <StickerInfoBox
                    position={infoBoxPosition}
                    server={server}
                    sticker={selectedSticker}
                    onClose={closeInfoBox}
                />
            ) : null}
        </>
    );
};

const MessageContentBody = React.memo(
    ({
        text,
        serverId,
        stickerId,
        embeds,
        components,
        attachments,
        poll,
        reportPoll,
        isDeleted,
        isEdited,
        messageId,
        channelId,
        serverDetails,
        senderId,
        senderMember,
        senderRoles,
        isEphemeral,
        isFailed,
        isReportPreview,
        invocationId,
        channels,
        categories,
        onResize,
    }: MessageContentBodyProps) => {
        const channel = useMemo(
            () => channels.find((item): boolean => item.id === channelId),
            [channelId, channels],
        );
        const category = useMemo(
            () =>
                channel?.categoryId
                    ? categories.find(
                          (item): boolean => item.id === channel.categoryId,
                      )
                    : undefined,
            [categories, channel],
        );
        const blockedMarkdownFeatures = useMemo(
            () =>
                getBlockedMarkdownFeatures({
                    server: serverDetails,
                    category,
                    channel,
                    senderId,
                    senderMember,
                    senderRoles,
                }),
            [
                category,
                channel,
                senderId,
                senderMember,
                senderRoles,
                serverDetails,
            ],
        );
        const parserOptions = useMemo(
            () => ({
                ...ParserPresets.MESSAGE,
                features: getAllowedMessageFeatures(blockedMarkdownFeatures),
            }),
            [blockedMarkdownFeatures],
        );
        const nodes = useMemo(
            () => parseText(text, parserOptions),
            [parserOptions, text],
        );

        const isEmojiOnly = useMemo((): boolean => {
            if (nodes.length === 0) return false;
            const hasEmoji = nodes.some(
                (n): boolean =>
                    n.type === 'emoji' || n.type === 'unicode_emoji',
            );
            const hasOther = nodes.some(
                (n): boolean =>
                    n.type !== 'emoji' &&
                    n.type !== 'unicode_emoji' &&
                    (n.type !== 'text' || n.content.trim().length > 0),
            );
            return hasEmoji && !hasOther;
        }, [nodes]);

        return (
            <Box
                className={cn(
                    'text-sm break-words whitespace-pre-wrap',
                    isEmojiOnly ? 'leading-none' : 'leading-relaxed',
                    isDeleted || isFailed ? 'text-danger' : 'text-foreground',
                )}
            >
                {text ? (
                    <>
                        <ParsedText
                            disableUrlEmbeds={isReportPreview}
                            largeEmojis={isEmojiOnly}
                            nodes={nodes}
                            serverId={serverId}
                            variant={
                                isDeleted || isFailed ? 'danger' : 'default'
                            }
                            wrap="preWrap"
                            onResize={onResize}
                        />
                        {isEdited ? (
                            <Text className="ml-1 text-[10px] font-medium text-text-muted italic">
                                (edited)
                            </Text>
                        ) : null}
                    </>
                ) : null}
                {embeds?.length || components?.length ? (
                    <EmbedRenderer
                        channelId={channelId}
                        invocationId={invocationId}
                        isDeleted={isDeleted}
                        isEphemeral={isEphemeral}
                        isReportPreview={isReportPreview}
                        messageId={messageId}
                        payload={{ embeds, components, content: undefined }}
                        senderId={senderId}
                        serverId={serverId}
                        variant="chat"
                        onResize={onResize}
                    />
                ) : null}

                {attachments?.map((attachment) => (
                    <FileEmbed
                        attachment={attachment}
                        key={attachment.attachmentId}
                        onResize={onResize}
                    />
                ))}

                {poll && !isReportPreview ? (
                    <Poll
                        channelId={channelId}
                        messageId={messageId || 'unknown'}
                        poll={poll}
                        serverId={serverId}
                    />
                ) : null}

                {isReportPreview && reportPoll ? (
                    <div className="mt-2 rounded-lg border border-border-subtle p-3">
                        <div className="font-semibold">{reportPoll.title}</div>
                        <div className="mt-2 flex flex-col gap-1">
                            {reportPoll.options.map((option) => (
                                <div
                                    className="flex justify-between gap-3"
                                    key={option.id}
                                >
                                    <span>
                                        {option.emoji ? `${option.emoji} ` : ''}
                                        {option.text}
                                    </span>
                                    <span className="text-text-muted">
                                        {option.votes}{' '}
                                        {option.votes === 1 ? 'vote' : 'votes'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {stickerId && !isReportPreview ? (
                    <MessageSticker stickerId={stickerId} onResize={onResize} />
                ) : null}

                {isReportPreview && stickerId ? (
                    <div className="mt-1 text-xs text-text-muted">
                        Sticker: {stickerId}
                    </div>
                ) : null}
            </Box>
        );
    },
);

const EMPTY_CHANNELS: Channel[] = [];
const EMPTY_CATEGORIES: Category[] = [];

const MessageContentWithQueries = (props: MessageContentProps) => {
    const { data: channels = EMPTY_CHANNELS } = useChannels(
        props.serverId || null,
        { enabled: !!props.serverId },
    );
    const { data: categories = EMPTY_CATEGORIES } = useCategories(
        props.serverId || null,
        { enabled: !!props.serverId },
    );

    return React.createElement(MessageContentBody, {
        ...props,
        categories,
        channels,
    });
};

export const MessageContent = React.memo((props: MessageContentProps) => {
    const messageChannelData = props.messageChannelData;
    if (!messageChannelData) {
        return React.createElement(MessageContentWithQueries, props);
    }

    return React.createElement(MessageContentBody, {
        ...props,
        categories: messageChannelData.categories ?? EMPTY_CATEGORIES,
        channels: messageChannelData.channels ?? EMPTY_CHANNELS,
    });
});

MessageContentBody.displayName = 'MessageContentBody';
MessageContent.displayName = 'MessageContent';
