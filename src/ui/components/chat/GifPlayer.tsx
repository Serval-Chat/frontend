import React, { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { klipyApi } from '@/api/klipy/klipy.api';
import type { KlipyFavorite } from '@/api/klipy/klipy.types';
import { GifStarButton } from '@/ui/components/chat/GifStarButton';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface GifPlayerProps {
    klipyId: string;
    url: string;
}

export const GifPlayer: React.FC<GifPlayerProps> = ({ klipyId, url }) => {
    const [metadata, setMetadata] = useState<KlipyFavorite | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMetadata = async (): Promise<void> => {
            try {
                const data = await klipyApi.resolveGif(klipyId, 'gif');
                setMetadata(data);

                // Check if favorited
                const favorites = await klipyApi.getFavorites();
                setIsFavorited(
                    favorites.some((f) => String(f.klipyId) === klipyId),
                );
            } catch (err) {
                console.error('Failed to resolve Klipy content:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        void fetchMetadata();
    }, [klipyId]);

    const toggleFavorite = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();

        if (!metadata) return;

        try {
            const { favorited } = await klipyApi.toggleFavorite({
                klipyId,
                url,
                previewUrl: metadata.previewUrl,
                width: metadata.width,
                height: metadata.height,
                contentType: metadata.contentType,
            });
            setIsFavorited(favorited);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    if (error) {
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

    if (loading) {
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
            <img
                alt="Klipy Content"
                className="block"
                src={metadata.url}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: metadata.width,
                    maxHeight: 400,
                    objectFit: 'contain',
                    padding: metadata.contentType === 'sticker' ? '4px' : '0',
                }}
            />

            <Box className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <GifStarButton
                    isFavorited={isFavorited}
                    onClick={(e) => void toggleFavorite(e)}
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
