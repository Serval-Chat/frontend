import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    GripHorizontal,
    Loader2,
    Search,
    Star,
    Sticker,
    TrendingUp,
    X,
} from 'lucide-react';
import { useClickAway } from 'react-use';

import { klipyApi } from '@/api/klipy/klipy.api';
import type { KlipyGif } from '@/api/klipy/klipy.types';
import { useDebounce } from '@/hooks/useDebounce';
import { GifStarButton } from '@/ui/components/chat/GifStarButton';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

type GifItem = KlipyGif;

interface GifPickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

const STORAGE_KEY = 'serchat_gif_picker_size';
const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 800;

const GifPickerItem = ({
    gif,
    tab,
    isFavorited,
    onSelect,
    onToggleFavorite,
}: {
    gif: GifItem;
    tab: 'trending' | 'stickers' | 'favorites';
    isFavorited: boolean;
    onSelect: (url: string) => void;
    onToggleFavorite: (e: React.MouseEvent, gif: GifItem) => void;
}) => {
    const klipyId = String(gif.klipyId || gif.id);
    const slug = gif.slug;
    const contentType = gif.contentType || 'gif';
    const url = slug
        ? `https://klipy.com/${contentType === 'sticker' ? 'stickers' : 'gifs'}/${slug}`
        : gif.url || `https://klipy.com/g/${klipyId}`;
    const previewUrl =
        gif.previewUrl || gif.file?.sm?.gif?.url || gif.file?.xs?.gif?.url;
    const width = gif.width || gif.file?.sm?.gif?.width || 200;
    const height = gif.height || gif.file?.sm?.gif?.height || 150;

    return (
        <Box
            className="group relative inline-block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md bg-bg-secondary hover:ring-2 hover:ring-primary"
            style={{ aspectRatio: `${width}/${height}` }}
            onClick={(): void => {
                onSelect(url);
            }}
        >
            <img
                alt="Klipy Content"
                className={cn(
                    'h-full w-full',
                    tab === 'stickers' ? 'object-contain p-1' : 'object-cover',
                )}
                loading="lazy"
                src={previewUrl}
            />
            <Box className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GifStarButton
                    isFavorited={isFavorited}
                    onClick={(e): undefined => {
                        onToggleFavorite(e, gif);
                    }}
                />
            </div>
        </Box>
    );
};

export const GifPicker = ({ onSelect, onClose }: GifPickerProps) => {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'trending' | 'stickers' | 'favorites'>(
        'trending',
    );
    const debouncedSearch = useDebounce(search, 500);
    const queryClient = useQueryClient();
    const pickerRef = useRef<HTMLDivElement>(null);

    useClickAway(pickerRef, onClose);

    const [size, setSize] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Failed to parse saved GifPicker size:', error);
            }
        }
        return { width: 350, height: 450 };
    });

    const isResizing = useRef(false);
    const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const handleMouseDown = (e: React.MouseEvent): void => {
        isResizing.current = true;
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height,
        };
        document.body.style.cursor = 'nw-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    };

    useEffect((): (() => void) => {
        const handleMouseMove = (e: MouseEvent): void => {
            if (!isResizing.current) return;

            const dx = startPos.current.x - e.clientX;
            const dy = startPos.current.y - e.clientY;

            const newWidth = Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, startPos.current.w + dx),
            );
            const newHeight = Math.min(
                MAX_HEIGHT,
                Math.max(MIN_HEIGHT, startPos.current.h + dy),
            );

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = (): void => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
            }
        };

        globalThis.addEventListener('mousemove', handleMouseMove);
        globalThis.addEventListener('mouseup', handleMouseUp);

        return (): void => {
            globalThis.removeEventListener('mousemove', handleMouseMove);
            globalThis.removeEventListener('mouseup', handleMouseUp);
        };
    }, [size]);

    const { data: gifs = [], isFetching: loading } = useQuery({
        queryKey: ['gif-picker', tab, debouncedSearch],
        queryFn: async (): Promise<KlipyGif[]> => {
            if (tab === 'favorites') {
                return klipyApi.getFavorites();
            }
            if (tab === 'stickers') {
                if (debouncedSearch !== '') {
                    return klipyApi.searchStickers(debouncedSearch);
                }
                return klipyApi.getTrendingStickers();
            }
            if (debouncedSearch !== '') {
                return klipyApi.searchGifs(debouncedSearch);
            }
            return klipyApi.getTrendingGifs();
        },
    });

    const { data: favoritedIdsFromQuery = new Set<string>() } = useQuery({
        queryKey: ['gif-picker-favorites'],
        queryFn: async (): Promise<Set<string>> => {
            const favorites = await klipyApi.getFavorites();
            return new Set(favorites.map((f): string => String(f.klipyId)));
        },
        enabled: tab !== 'favorites',
    });

    const favoritedIds = useMemo((): Set<string> => {
        if (tab === 'favorites') {
            return new Set(gifs.map((f): string => String(f.klipyId)));
        }
        return favoritedIdsFromQuery;
    }, [tab, gifs, favoritedIdsFromQuery]);

    const handleToggleFavorite = async (
        e: React.MouseEvent,
        gif: GifItem,
    ): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();

        const klipyId = String(gif.klipyId || gif.id);
        if (klipyId === '' || klipyId === 'undefined') return;

        const slug = gif.slug;
        const contentType = gif.contentType || 'gif';
        const url = slug
            ? `https://klipy.com/${contentType === 'sticker' ? 'stickers' : 'gifs'}/${slug}`
            : gif.url || `https://klipy.com/g/${klipyId}`;

        const previewUrl =
            gif.previewUrl ||
            gif.file?.sm?.gif?.url ||
            gif.file?.xs?.gif?.url ||
            '';
        const width = gif.width || gif.file?.sm?.gif?.width || 200;
        const height = gif.height || gif.file?.sm?.gif?.height || 150;

        try {
            await klipyApi.toggleFavorite({
                klipyId,
                slug,
                url,
                previewUrl,
                width,
                height,
                contentType,
            });

            void queryClient.invalidateQueries({
                queryKey: ['gif-picker-favorites'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['gif-picker'],
            });
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    return (
        <Box
            className="relative flex flex-col rounded-xl border border-border-subtle bg-bg-primary shadow-2xl"
            ref={pickerRef}
            style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
            <button
                aria-label="Resize GIF picker"
                className="absolute -top-1 -left-1 z-[60] flex h-6 w-6 cursor-nw-resize items-center justify-center text-muted-foreground/30 transition-colors hover:text-primary/50"
                title="Resize"
                type="button"
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="mr-1 mb-1 rotate-45">
                    <GripHorizontal className="h-3 w-3" />
                </div>
            </button>

            <Box className="flex shrink-0 items-center justify-between border-b border-border-subtle p-3">
                <Box className="flex gap-1">
                    <Button
                        className="gap-1.5 px-3 text-xs"
                        size="sm"
                        variant={tab === 'trending' ? 'primary' : 'ghost'}
                        onClick={(): void => {
                            setTab('trending');
                        }}
                    >
                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        Trending
                    </Button>
                    <Button
                        className="gap-1.5 px-3 text-xs"
                        size="sm"
                        variant={tab === 'favorites' ? 'primary' : 'ghost'}
                        onClick={(): void => {
                            setTab('favorites');
                        }}
                    >
                        <Star className="h-3.5 w-3.5 shrink-0" />
                        Favorites
                    </Button>
                    <Button
                        className="gap-1.5 px-3 text-xs"
                        size="sm"
                        variant={tab === 'stickers' ? 'primary' : 'ghost'}
                        onClick={(): void => {
                            setTab('stickers');
                        }}
                    >
                        <Sticker className="h-3.5 w-3.5 shrink-0" />
                        Stickers
                    </Button>
                </Box>
                <Button size="sm" variant="ghost" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </Box>

            <Box className="shrink-0 p-3">
                <Input
                    icon={<Search size={14} />}
                    placeholder="Search Klipy..."
                    value={search}
                    onChange={(e): void => {
                        setSearch(e.target.value);
                        if (tab === 'favorites') setTab('trending');
                    }}
                />
            </Box>

            <Box className="scrollbar-thin flex-1 overflow-y-auto p-3 pt-0">
                {loading ? (
                    <Box className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </Box>
                ) : gifs.length > 0 ? (
                    <Box
                        className="gap-2 space-y-2"
                        style={{
                            columns:
                                tab === 'stickers'
                                    ? 3
                                    : size.width > 450
                                      ? 3
                                      : 2,
                        }}
                    >
                        {gifs.map((gif) => (
                            <GifPickerItem
                                gif={gif}
                                isFavorited={favoritedIds.has(
                                    String(gif.klipyId || gif.id),
                                )}
                                key={String(gif.klipyId || gif.id)}
                                tab={tab}
                                onSelect={onSelect}
                                onToggleFavorite={(e, g): void =>
                                    void handleToggleFavorite(e, g)
                                }
                            />
                        ))}
                    </Box>
                ) : (
                    <Box className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No GIFs found
                    </Box>
                )}
            </Box>

            <Box className="flex shrink-0 flex-col items-center justify-center gap-1 border-t border-border-subtle py-2">
                <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase">
                    Powered by
                </span>
                <span className="text-[10px] font-black tracking-[0.1em] text-muted-foreground/60 uppercase">
                    Klipy
                </span>
            </Box>
        </Box>
    );
};
