import React, { useMemo } from 'react';

import type { Embed } from '@/types/embed';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { EmbedRenderer } from '@/ui/components/embed/EmbedRenderer';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface MessageContentProps {
    text: string;
    serverId?: string;
    embeds?: Embed[];
    isDeleted?: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
    text,
    serverId,
    embeds,
    isDeleted,
}) => {
    const nodes = useMemo(() => parseText(text, ParserPresets.MESSAGE), [text]);

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
        </Box>
    );
};
