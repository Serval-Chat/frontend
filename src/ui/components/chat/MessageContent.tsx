import React, { useMemo } from 'react';

import { ParsedText } from '@/ui/components/common/ParsedText';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface MessageContentProps {
    text: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
    const nodes = useMemo(() => parseText(text, ParserPresets.MESSAGE), [text]);

    return (
        <div className="text-sm text-white/80 leading-relaxed break-words whitespace-pre-wrap">
            <ParsedText nodes={nodes} />
        </div>
    );
};
