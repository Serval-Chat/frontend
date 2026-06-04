import React, { useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { klipyApi } from '@/api/klipy/klipy.api';
import type { KlipyFavorite } from '@/api/klipy/klipy.types';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { GifStarButton } from '@/ui/components/chat/GifStarButton';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface GifPlayerProps {
    klipyId: string;
    url: string;
    onResize?: () => void;
}

export const GifPlayer = ({ klipyId, url, onResize }: GifPlayerProps) => {
    const queryClient = useQueryClient();
    const limitedAnimations = useLimitedAnimations();

    const {
        data: metadata,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['klipy', 'resolve', klipyId, 'gif'],
        queryFn: (): Promise<KlipyFavorite> =>
            klipyApi.resolveGif(klipyId, 'gif'),
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ['klipy', 'favorites'],
        queryFn: klipyApi.getFavorites,
        enabled: !!metadata,
        staleTime: 60 * 1000,
    });

    const isFavorited = useMemo(
        (): boolean =>
            favorites.some((f): boolean => String(f.klipyId) === klipyId),
        [favorites, klipyId],
    );

    const toggleFavoriteMutation = useMutation({
        mutationFn: (): Promise<{ favorited: boolean }> => {
            if (!metadata) {
                throw new Error('Klipy metadata is not loaded yet.');
            }

            return klipyApi.toggleFavorite({
                klipyId,
                slug: metadata.slug,
                url,
                previewUrl: metadata.previewUrl,
                width: metadata.width,
                height: metadata.height,
                contentType: metadata.contentType,
            });
        },
        onSuccess: ({ favorited }): void => {
            if (!metadata) return;

            queryClient.setQueryData<KlipyFavorite[]>(
                ['klipy', 'favorites'],
                (old = []): KlipyFavorite[] => {
                    const existing = old.some(
                        (f): boolean => String(f.klipyId) === klipyId,
                    );

                    if (favorited && !existing) {
                        return [...old, { ...metadata, klipyId }];
                    }

                    if (!favorited && existing) {
                        return old.filter(
                            (f): boolean => String(f.klipyId) !== klipyId,
                        );
                    }

                    return old;
                },
            );
        },
        onError: (err): void => {
            console.error('Failed to toggle favorite:', err);
        },
    });

    const toggleFavorite = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();

        if (!metadata) return;
        toggleFavoriteMutation.mutate();
    };

    React.useEffect((): void => {
        if (metadata) onResize?.();
    }, [metadata, onResize]);

    if (isError) {
        return (
            <Box className="my-2 max-w-[400px]">
                <a
                    className="text-primary hover:underline"
                    href={url}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {url}
                </a>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box className="my-2 flex h-48 w-full max-w-[400px] items-center justify-center rounded-lg bg-bg-secondary">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Box>
        );
    }

    if (!metadata) return null;

    return (
        <Box
            className={cn(
                'group relative my-2 w-fit max-w-full overflow-hidden rounded-lg border border-border-subtle',
                metadata.contentType === 'gif' ? 'bg-black' : 'bg-transparent',
            )}
        >
            <PausedAnimatedImage
                alt="Klipy Content"
                className="block"
                decoding="async"
                fallbackSrc={metadata.previewUrl}
                loading="lazy"
                paused={limitedAnimations && metadata.contentType === 'gif'}
                src={metadata.url}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: metadata.width,
                    maxHeight: 400,
                    aspectRatio: `${metadata.width} / ${metadata.height}`,
                    objectFit: 'contain',
                    padding: metadata.contentType === 'sticker' ? '4px' : '0',
                }}
                onLoad={onResize}
            />

            <Box className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <GifStarButton
                    isFavorited={isFavorited}
                    onClick={(e): undefined => void toggleFavorite(e)}
                />
            </Box>

            <Box className="pointer-events-none absolute right-2 bottom-1 flex items-center gap-1 opacity-50">
                <span className="text-[9px] font-bold tracking-tighter text-white/80 uppercase">
                    Powered by
                </span>
                <span className="text-[11px] font-black text-white uppercase">
                    Klipy
                </span>
            </Box>
        </Box>
    );
};
