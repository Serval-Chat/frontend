import React, { useEffect, useState } from 'react';

import { Loader2, Star } from 'lucide-react';

import { apiClient as axios } from '@/api/client';
import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface GifPlayerProps {
    klipyId: string;
    url: string;
}

interface GifMetadata {
    url: string;
    previewUrl: string;
    width: number;
    height: number;
}

export const GifPlayer: React.FC<GifPlayerProps> = ({ klipyId, url }) => {
    const [metadata, setMetadata] = useState<GifMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMetadata = async (): Promise<void> => {
            try {
                const response = await axios.get(
                    `/api/v1/klipy/resolve?id=${klipyId}`,
                );
                setMetadata(response.data);

                // Check if favorited
                const favsResponse = await axios.get('/api/v1/klipy/favorites');
                const favs = favsResponse.data;
                setIsFavorited(
                    favs.some(
                        (f: { klipyId: string }) => f.klipyId === klipyId,
                    ),
                );
            } catch (err) {
                console.error('Failed to resolve Klipy GIF:', err);
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
        try {
            const response = await axios.post(
                '/api/v1/klipy/favorites/toggle',
                {
                    klipyId,
                    url,
                    previewUrl: metadata?.previewUrl,
                    width: metadata?.width,
                    height: metadata?.height,
                },
            );
            setIsFavorited(response.data.favorited);
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
        <Box className="group relative my-2 w-fit max-w-full overflow-hidden rounded-lg border border-border-subtle bg-black">
            <img
                alt="GIF from Klipy"
                className="block"
                src={metadata.url}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: metadata.width,
                    maxHeight: 400,
                    objectFit: 'contain',
                }}
            />

            <Box className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    className={cn(
                        'rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70',
                        isFavorited && 'text-yellow-400',
                    )}
                    size="sm"
                    variant="normal"
                    onClick={(e) => {
                        void toggleFavorite(e);
                    }}
                >
                    <Star
                        className={cn('h-4 w-4', isFavorited && 'fill-current')}
                    />
                </Button>
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
