import React, { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { emojiKeys, useEmoji } from '@/api/emojis/emojis.queries';
import type { Emoji } from '@/api/emojis/emojis.types';
import { useEmojiInfoBox } from '@/hooks/useEmojiInfoBox';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { EmojiInfoBox } from '@/ui/components/emoji/EmojiInfoBox';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ParsedEmojiProps {
    emojiId: string;
    className?: string;
    isLarge?: boolean;
    style?: React.CSSProperties;
    nonInteractive?: boolean;
}

/**
 * @description Renders a custom emoji
 */
export const ParsedEmoji = ({
    emojiId,
    className,
    isLarge,
    style,
    nonInteractive = false,
}: ParsedEmojiProps) => {
    const queryClient = useQueryClient();
    const isEmojiCached = (): boolean =>
        !!(
            queryClient.getQueryData(emojiKeys.detail(emojiId)) ||
            queryClient
                .getQueryData<Emoji[]>(['servers', 'emojis', 'all'])
                ?.find((e): boolean => e.id === emojiId)
        );
    const [inView, setInView] = useState(isEmojiCached);
    const containerRef = useRef<HTMLDivElement | HTMLImageElement>(null);

    const {
        selectedEmoji,
        infoBoxPosition,
        server,
        showEmojiInfo,
        closeInfoBox,
    } = useEmojiInfoBox();

    useEffect((): (() => void) | undefined => {
        if (inView) return;

        const observer = new IntersectionObserver(
            ([entry]): void => {
                if (entry?.isIntersecting) {
                    setInView(true);
                    observer.disconnect(); // Only need to fetch once
                }
            },
            { rootMargin: '200px' }, // Pre-fetch slightly before it enters the screen
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return (): void => {
            observer.disconnect();
        };
    }, [inView]);

    const { data: emoji, isLoading } = useEmoji(emojiId, {
        enabled: inView,
    });

    if (isLoading || !inView) {
        return (
            <div
                className={
                    className ||
                    cn(
                        'inline-block animate-pulse rounded bg-white/5',
                        isLarge ? 'h-16 w-16' : 'h-5 w-5',
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

    if (nonInteractive) {
        return (
            <img
                alt={emoji.name || 'emoji'}
                className={cn(
                    'inline-block object-contain align-text-bottom',
                    isLarge ? 'h-16 w-16' : 'h-[1.5em] w-[1.5em]',
                    className,
                )}
                draggable="false"
                ref={containerRef as React.RefObject<HTMLImageElement>}
                src={emojiUrl || ''}
                style={style}
                onError={(e): void => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }

    return (
        <>
            <Tooltip content={`:${emoji.name}:`} position="top">
                <Box
                    as="button"
                    className={cn(
                        'inline-block cursor-pointer rounded-sm border-none bg-transparent p-0 align-text-bottom outline-none focus-visible:ring-1 focus-visible:ring-primary',
                        isLarge ? 'h-16 w-16' : 'h-[1.5em] w-[1.5em]',
                        className,
                    )}
                    onClick={(e: React.MouseEvent): void => {
                        showEmojiInfo(
                            {
                                id: emoji.id,
                                name: emoji.name,
                                url: emoji.imageUrl,
                                serverId: emoji.serverId,
                            },
                            e,
                        );
                    }}
                >
                    <img
                        alt={emoji.name || 'emoji'}
                        className="h-full w-full object-contain"
                        draggable="false"
                        ref={containerRef as React.RefObject<HTMLImageElement>}
                        src={emojiUrl || ''}
                        style={style}
                        onError={(e): void => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </Box>
            </Tooltip>

            {selectedEmoji && infoBoxPosition ? (
                <EmojiInfoBox
                    emoji={selectedEmoji}
                    position={infoBoxPosition}
                    server={server}
                    onClose={closeInfoBox}
                />
            ) : null}
        </>
    );
};
