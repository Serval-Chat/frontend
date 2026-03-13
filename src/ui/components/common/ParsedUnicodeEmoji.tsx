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
            aria-label={emojiData.short_name}
            className={
                className ||
                cn(
                    'relative inline-block align-middle',
                    isLarge
                        ? 'h-[2.5em] w-[2.5em]'
                        : '-top-[0.1em] h-[1.2em] w-[1.2em]',
                )
            }
            title={emojiData.short_name}
        >
            <span style={getSpriteStyle(emojiData)} />
        </span>
    );
};
