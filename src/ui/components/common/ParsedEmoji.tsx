import React from 'react';

import { useEmoji } from '@/api/emojis/emojis.queries';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ParsedEmojiProps {
    emojiId: string;
    className?: string;
    isLarge?: boolean;
    style?: React.CSSProperties;
}

/**
 * @description Renders a custom emoji
 */
export const ParsedEmoji: React.FC<ParsedEmojiProps> = ({
    emojiId,
    className,
    isLarge,
    style,
}) => {
    const { data: emoji, isLoading } = useEmoji(emojiId);

    if (isLoading) {
        return (
            <div
                className={
                    className ||
                    cn(
                        'inline-block animate-pulse rounded bg-white/5',
                        isLarge ? 'h-10 w-10' : 'h-5 w-5',
                    )
                }
                style={style}
            />
        );
    }

    if (!emoji?.imageUrl) {
        return null;
    }

    const emojiUrl = resolveApiUrl(emoji.imageUrl);

    return (
        <img
            alt={emoji.name || 'emoji'}
            className={cn(
                'inline-block align-text-bottom',
                isLarge ? 'h-10 w-10' : 'h-5 w-5',
                className,
            )}
            src={emojiUrl || ''}
            style={style}
            title={`:${emoji.name}:`}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
            }}
        />
    );
};
