import React from 'react';

import { cn } from '@/utils/cn';
import { emojiMap, getSpriteStyle } from '@/utils/emoji';

interface ParsedUnicodeEmojiProps {
    content: string;
    className?: string;
    isLarge?: boolean;
}

export const ParsedUnicodeEmoji: React.FC<ParsedUnicodeEmojiProps> = ({
    content,
    className,
    isLarge,
}) => {
    const emojiData = emojiMap.get(content);

    if (!emojiData) {
        return <span className={className}>{content}</span>;
    }

    return (
        <span
            aria-label={emojiData.s}
            className={
                className ||
                cn(
                    'relative top-[0.1em] inline-block align-middle',
                    isLarge ? 'h-[2.5em] w-[2.5em]' : 'h-[1.5em] w-[1.5em]',
                )
            }
            title={emojiData.s}
        >
            <span style={getSpriteStyle(emojiData)} />
        </span>
    );
};
