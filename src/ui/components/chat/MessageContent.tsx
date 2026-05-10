import React, { useMemo } from 'react';

import type { MessagePoll } from '@/api/chat/chat.types';
import { useSticker } from '@/api/servers/servers.queries';
import { useStickerInfoBox } from '@/hooks/useStickerInfoBox';
import type { Embed } from '@/types/embed';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { EmbedRenderer } from '@/ui/components/embed/EmbedRenderer';
import { StickerInfoBox } from '@/ui/components/emoji/StickerInfoBox';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { Poll } from './Poll';

interface MessageContentProps {
    text: string;
    serverId?: string;
    stickerId?: string;
    embeds?: Embed[];
    poll?: MessagePoll;
    isDeleted?: boolean;
    messageId?: string;
    channelId?: string;
}

export const MessageContent = React.memo(
    ({
        text,
        serverId,
        stickerId,
        embeds,
        poll,
        isDeleted,
        messageId,
        channelId,
    }: MessageContentProps) => {
        const { data: sticker } = useSticker(stickerId || null);
        const nodes = useMemo(
            () => parseText(text, ParserPresets.MESSAGE),
            [text],
        );

        const {
            selectedSticker,
            infoBoxPosition,
            server,
            showStickerInfo,
            closeInfoBox,
        } = useStickerInfoBox();

        const isEmojiOnly = useMemo(() => {
            if (nodes.length === 0) return false;
            const hasEmoji = nodes.some(
                (n) => n.type === 'emoji' || n.type === 'unicode_emoji',
            );
            const hasOther = nodes.some(
                (n) =>
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
                    />
                )}
                {embeds && embeds.length > 0 && (
                    <EmbedRenderer
                        isDeleted={isDeleted}
                        payload={{ embeds, content: undefined }}
                        serverId={serverId}
                        variant="chat"
                    />
                )}

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
                                onClick={(e) =>
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
                    />
                )}

                {selectedSticker && (
                    <div
                        aria-label="Close sticker info"
                        className="fixed inset-0 z-[1060]"
                        role="button"
                        tabIndex={0}
                        onClick={closeInfoBox}
                        onContextMenu={closeInfoBox}
                        onKeyDown={(e) => {
                            if (
                                e.key === 'Escape' ||
                                e.key === 'Enter' ||
                                e.key === ' '
                            ) {
                                closeInfoBox();
                            }
                        }}
                    />
                )}
            </Box>
        );
    },
);

MessageContent.displayName = 'MessageContent';
