import React, { useMemo } from 'react';

import type { MessageAttachment, MessagePoll } from '@/api/chat/chat.types';
import {
    useCategories,
    useChannels,
    useSticker,
} from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useStickerInfoBox } from '@/hooks/useStickerInfoBox';
import type { ButtonComponent, Embed } from '@/types/embed';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { EmbedRenderer } from '@/ui/components/embed/EmbedRenderer';
import { StickerInfoBox } from '@/ui/components/emoji/StickerInfoBox';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import {
    getAllowedMessageFeatures,
    getBlockedMarkdownFeatures,
} from '@/utils/markdownBlockade';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { FileEmbed } from './FileEmbed';
import { Poll } from './Poll';

interface MessageContentProps {
    text: string;
    serverId?: string;
    stickerId?: string | null;
    embeds?: Embed[];
    components?: ButtonComponent[];
    attachments?: MessageAttachment[];
    poll?: MessagePoll | null;
    isDeleted?: boolean;
    messageId?: string;
    channelId?: string;
    serverDetails?: Server;
    senderId?: string;
    senderMember?: ServerMember;
    senderRoles?: Role[];
    isEphemeral?: boolean;
    invocationId?: string;
    onResize?: () => void;
}

export const MessageContent = React.memo(
    ({
        text,
        serverId,
        stickerId,
        embeds,
        components,
        attachments,
        poll,
        isDeleted,
        messageId,
        channelId,
        serverDetails,
        senderId,
        senderMember,
        senderRoles,
        isEphemeral,
        invocationId,
        onResize,
    }: MessageContentProps) => {
        const { data: sticker } = useSticker(stickerId || null);
        const { data: channels = [] } = useChannels(serverId || null, {
            enabled: !!serverId,
        });
        const { data: categories = [] } = useCategories(serverId || null, {
            enabled: !!serverId,
        });
        const channel = useMemo(
            () => channels.find((item): boolean => item._id === channelId),
            [channelId, channels],
        );
        const category = useMemo(
            () =>
                channel?.categoryId
                    ? categories.find(
                          (item): boolean => item._id === channel.categoryId,
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

        const {
            selectedSticker,
            infoBoxPosition,
            server,
            showStickerInfo,
            closeInfoBox,
        } = useStickerInfoBox();

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
                    'text-sm leading-relaxed break-words whitespace-pre-wrap',
                    isDeleted ? 'text-danger' : 'text-foreground',
                )}
            >
                {text && (
                    <ParsedText
                        largeEmojis={isEmojiOnly}
                        nodes={nodes}
                        serverId={serverId}
                        variant={isDeleted ? 'danger' : 'default'}
                        wrap="preWrap"
                        onResize={onResize}
                    />
                )}
                {((embeds && embeds.length > 0) ||
                    (components && components.length > 0)) && (
                    <EmbedRenderer
                        channelId={channelId}
                        invocationId={invocationId}
                        isDeleted={isDeleted}
                        isEphemeral={isEphemeral}
                        messageId={messageId}
                        payload={{ embeds, components, content: undefined }}
                        senderId={senderId}
                        serverId={serverId}
                        variant="chat"
                        onResize={onResize}
                    />
                )}

                {attachments?.map((attachment) => (
                    <FileEmbed
                        attachment={attachment}
                        key={attachment.attachmentId}
                        onResize={onResize}
                    />
                ))}

                {poll && (
                    <Poll
                        channelId={channelId}
                        messageId={messageId || 'unknown'}
                        poll={poll}
                        serverId={serverId}
                    />
                )}

                {sticker && (
                    <div className="mt-1 flex max-w-[240px] flex-col gap-1">
                        <Tooltip content={sticker.name} position="top">
                            <button
                                className="cursor-pointer border-none bg-transparent p-0 transition-opacity outline-none hover:opacity-90 active:opacity-80"
                                onClick={(e): void =>
                                    showStickerInfo(
                                        {
                                            id: sticker.id,
                                            name: sticker.name,
                                            url: sticker.imageUrl,
                                            serverId: sticker.serverId,
                                        },
                                        e,
                                    )
                                }
                            >
                                <img
                                    alt={sticker.name}
                                    className="h-auto max-w-full select-none"
                                    src={resolveApiUrl(sticker.imageUrl) || ''}
                                    onLoad={onResize}
                                />
                            </button>
                        </Tooltip>
                    </div>
                )}

                {selectedSticker && infoBoxPosition && (
                    <StickerInfoBox
                        position={infoBoxPosition}
                        server={server}
                        sticker={selectedSticker}
                        onClose={closeInfoBox}
                    />
                )}
            </Box>
        );
    },
);

MessageContent.displayName = 'MessageContent';
