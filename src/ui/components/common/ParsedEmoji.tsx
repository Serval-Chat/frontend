import React, { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { emojiKeys, useEmoji } from '@/api/emojis/emojis.queries';
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
    const [inView, setInView] = useState(false);
    const containerRef = useRef<HTMLDivElement | HTMLImageElement>(null);
    const queryClient = useQueryClient();

    // Fast-path: if the emoji is already in the cache, we don't even need the observer
    const isCached = !!queryClient.getQueryData(emojiKeys.detail(emojiId));

    useEffect(() => {
        if (isCached || inView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect(); // Only need to fetch once
                }
            },
            { rootMargin: '200px' }, // Pre-fetch slightly before it enters the screen
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isCached, inView]);

    const { data: emoji, isLoading } = useEmoji(emojiId, {
        enabled: isCached || inView,
    });

    if (isLoading || (!isCached && !inView)) {
        return (
            <div
                className={
                    className ||
                    cn(
                        'inline-block animate-pulse rounded bg-white/5',
                        isLarge ? 'h-10 w-10' : 'h-5 w-5',
                    )
                }
                ref={containerRef as React.RefObject<HTMLDivElement>}
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
            ref={containerRef as React.RefObject<HTMLImageElement>}
            src={emojiUrl || ''}
            style={style}
            title={`:${emoji.name}:`}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
            }}
        />
    );
};
