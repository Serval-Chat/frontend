import React from 'react';

import { useEmoji } from '@/api/emojis/emojis.queries';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ParsedEmojiProps {
    emojiId: string;
    className?: string;
}

/**
 * @description Renders a custom emoji
 */
export const ParsedEmoji: React.FC<ParsedEmojiProps> = ({
    emojiId,
    className,
}) => {
    const { data: emoji, isLoading } = useEmoji(emojiId);

    if (isLoading) {
        return (
            <div
                className={
                    className ||
                    'inline-block w-5 h-5 bg-white/5 animate-pulse rounded'
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
            className={className || 'inline-block w-5 h-5 align-text-bottom'}
            src={emojiUrl || ''}
            title={`:${emoji.name}:`}
            onError={(e) => {
                // Fallback if emoji doesn't exist or fail to load
                e.currentTarget.style.display = 'none';
            }}
        />
    );
};
