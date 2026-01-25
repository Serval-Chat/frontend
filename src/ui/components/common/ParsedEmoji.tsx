import React from 'react';

import { useEmoji } from '@/api/emojis/emojis.queries';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ParsedEmojiProps {
    emojiId: string;
    className?: string;
    isLarge?: boolean;
}

/**
 * @description Renders a custom emoji
 */
export const ParsedEmoji: React.FC<ParsedEmojiProps> = ({
    emojiId,
    className,
    isLarge,
}) => {
    const { data: emoji, isLoading } = useEmoji(emojiId);

    if (isLoading) {
        return (
            <div
                className={
                    className ||
                    cn(
                        'inline-block bg-white/5 animate-pulse rounded',
                        isLarge ? 'w-10 h-10' : 'w-5 h-5',
                    )
                }
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
                className || 'inline-block align-text-bottom',
                isLarge ? 'w-10 h-10' : 'w-5 h-5',
            )}
            src={emojiUrl || ''}
            title={`:${emoji.name}:`}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
            }}
        />
    );
};
