import React, { useMemo } from 'react';

import { ParsedText } from '@/ui/components/common/ParsedText';
import { Box } from '@/ui/components/layout/Box';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface MessageContentProps {
    text: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
    const nodes = useMemo(() => parseText(text, ParserPresets.MESSAGE), [text]);

    return (
        <Box className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
            <ParsedText nodes={nodes} />
        </Box>
    );
};
