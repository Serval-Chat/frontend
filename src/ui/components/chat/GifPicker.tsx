import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
    GripHorizontal,
    Loader2,
    Search,
    Star,
    TrendingUp,
    X,
} from 'lucide-react';

import { apiClient as axios } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Box } from '@/ui/components/layout/Box';

interface GifItem {
    klipyId?: string;
    id?: string;
    url?: string;
    previewUrl?: string;
    width?: number;
    height?: number;
    file?: {
        sm?: { gif?: { url?: string; width?: number; height?: number } };
        xs?: { gif?: { url?: string } };
    };
}

interface GifPickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

const STORAGE_KEY = 'serchat_gif_picker_size';
const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 800;

export const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'trending' | 'favorites'>('trending');
    const [gifs, setGifs] = useState<GifItem[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 500);

    const [size, setSize] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved GifPicker size:', e);
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

    useEffect(() => {
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

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [size]);

    const fetchGifs = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (tab === 'favorites') {
                response = await axios.get('/api/v1/klipy/favorites');
                setGifs(response.data);
            } else if (debouncedSearch) {
                response = await axios.get(
                    `/api/v1/klipy/search?q=${debouncedSearch}`,
                );
                setGifs(response.data.data.data);
            } else {
                response = await axios.get('/api/v1/klipy/trending');
                setGifs(response.data.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch GIFs:', err);
        } finally {
            setLoading(false);
        }
    }, [tab, debouncedSearch]);

    useEffect(() => {
        void fetchGifs();
    }, [fetchGifs]);

    return (
        <Box
            className="bg-bg-primary relative flex flex-col rounded-xl border border-border-subtle shadow-2xl"
            style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
            <div
                aria-label="Resize GIF picker"
                className="absolute -top-1 -left-1 z-[60] flex h-6 w-6 cursor-nw-resize items-center justify-center text-muted-foreground/30 transition-colors hover:text-primary/50"
                role="button"
                tabIndex={0}
                title="Resize"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="mr-1 mb-1 rotate-45">
                    <GripHorizontal className="h-3 w-3" />
                </div>
            </div>

            <Box className="flex shrink-0 items-center justify-between border-b border-border-subtle p-3">
                <Box className="flex gap-2">
                    <Button
                        className="flex h-auto min-w-[80px] flex-col gap-1 py-2"
                        variant={tab === 'trending' ? 'primary' : 'ghost'}
                        onClick={() => setTab('trending')}
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-[10px]">Trending</span>
                    </Button>
                    <Button
                        className="flex h-auto min-w-[80px] flex-col gap-1 py-2"
                        variant={tab === 'favorites' ? 'primary' : 'ghost'}
                        onClick={() => setTab('favorites')}
                    >
                        <Star className="h-4 w-4" />
                        <span className="text-[10px]">Favorites</span>
                    </Button>
                </Box>
                <Button size="sm" variant="ghost" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </Box>

            <Box className="shrink-0 p-3">
                <Box className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search Klipy..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setTab('trending');
                        }}
                    />
                </Box>
            </Box>

            <Box className="scrollbar-thin flex-1 overflow-y-auto p-3 pt-0">
                {loading ? (
                    <Box className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </Box>
                ) : gifs.length > 0 ? (
                    <Box
                        className="gap-2 space-y-2"
                        style={{ columns: size.width > 450 ? 3 : 2 }}
                    >
                        {gifs.map((gif) => {
                            const klipyId = gif.klipyId || gif.id;
                            const url =
                                gif.url || `https://klipy.com/g/${klipyId}`;
                            const previewUrl =
                                gif.previewUrl ||
                                gif.file?.sm?.gif?.url ||
                                gif.file?.xs?.gif?.url;
                            const width =
                                gif.width || gif.file?.sm?.gif?.width || 200;
                            const height =
                                gif.height || gif.file?.sm?.gif?.height || 150;

                            return (
                                <Box
                                    className="group relative inline-block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md bg-bg-secondary hover:ring-2 hover:ring-primary"
                                    key={klipyId}
                                    style={{
                                        aspectRatio: `${width}/${height}`,
                                    }}
                                    onClick={() => onSelect(url)}
                                >
                                    <img
                                        alt="GIF"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        src={previewUrl}
                                    />
                                    <Box className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                                </Box>
                            );
                        })}
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
