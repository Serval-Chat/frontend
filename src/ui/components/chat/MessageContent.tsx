import React, { useMemo } from 'react';

import { ParsedText } from '@/ui/components/common/ParsedText';
import { Box } from '@/ui/components/layout/Box';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface MessageContentProps {
    text: string;
    serverId?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
    text,
    serverId,
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
        <Box className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
            <ParsedText
                largeEmojis={isEmojiOnly}
                nodes={nodes}
                serverId={serverId}
                wrap="preWrap"
            />
        </Box>
    );
};
