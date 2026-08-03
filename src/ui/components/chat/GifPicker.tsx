import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    GripHorizontal,
    Loader2,
    Plus,
    Search,
    Star,
    Sticker,
    Trash2,
    TrendingUp,
    X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useClickAway } from 'react-use';

import { gifTagsApi } from '@/api/gifTags/gifTags.api';
import {
    type GifTag,
    getApiErrorMessage,
    useAddTagsToGif,
    useCreateGifTag,
    useDeleteGifTag,
    useGifTags,
} from '@/api/gifTags/gifTags.queries';
import { klipyApi } from '@/api/klipy/klipy.api';
import type { KlipyFavorite, KlipyGif } from '@/api/klipy/klipy.types';
import { useDebounce } from '@/hooks/useDebounce';
import { GifStarButton } from '@/ui/components/chat/GifStarButton';
import { GifTagButton } from '@/ui/components/chat/GifTagButton';
import { Button } from '@/ui/components/common/Button';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
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

const getExpressionTerms = (expression: string): string[] =>
    expression.match(/[a-zA-Z0-9_-]+/g) ?? [];

const isTagActive = (expression: string, tagName: string): boolean =>
    getExpressionTerms(expression).some(
        (term) => term.toLowerCase() === tagName.toLowerCase(),
    );

const toggleTagInExpression = (expression: string, tagName: string): string => {
    const trimmed = expression.trim();

    if (!isTagActive(trimmed, tagName)) {
        return trimmed === '' ? tagName : `${trimmed} & ${tagName}`;
    }

    const tokens = trimmed.split(/\s*(&{1,2}|\|{1,2}|\^)\s*/).filter((t) => t !== '');
    const termIndex = tokens.findIndex(
        (t, i) =>
            i % 2 === 0 &&
            t.replace(/^!+/, '').toLowerCase() === tagName.toLowerCase(),
    );
    if (termIndex === -1) return trimmed;

    const operatorIndex = termIndex > 0 ? termIndex - 1 : termIndex + 1;
    return tokens
        .filter((_, i) => i !== termIndex && i !== operatorIndex)
        .join(' ')
        .trim();
};

const MAX_VISIBLE_TAG_BADGES = 3;

const GifPickerItem = ({
    gif,
    tab,
    isFavorited,
    tagNameById,
    floatingTagActive,
    onSelect,
    onToggleFavorite,
    onApplyFloatingTag,
}: {
    gif: GifItem;
    tab: 'trending' | 'stickers' | 'favorites';
    isFavorited: boolean;
    tagNameById: Map<string, string>;
    floatingTagActive: boolean;
    onSelect: (url: string) => void;
    onToggleFavorite: (e: React.MouseEvent, gif: GifItem) => void;
    onApplyFloatingTag: (gif: GifItem) => void;
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

    const appliedTagNames = (gif.tagIds ?? [])
        .map((id) => tagNameById.get(id))
        .filter((name): name is string => name !== undefined);

    return (
        <Box
            className="group relative inline-block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md bg-bg-secondary hover:ring-2 hover:ring-primary"
            style={{ aspectRatio: `${width}/${height}` }}
            onClick={(): void => {
                if (floatingTagActive) {
                    onApplyFloatingTag(gif);
                    return;
                }
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
            {tab === 'favorites' ? (
                <div className="absolute top-1 left-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <GifTagButton
                        appliedTagIds={gif.tagIds ?? []}
                        klipyId={klipyId}
                    />
                </div>
            ) : null}
            <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GifStarButton
                    isFavorited={isFavorited}
                    onClick={(e): undefined => {
                        onToggleFavorite(e, gif);
                    }}
                />
            </div>
            {appliedTagNames.length > 0 ? (
                <div className="absolute right-1 bottom-1 left-1 flex flex-wrap gap-0.5">
                    {appliedTagNames
                        .slice(0, MAX_VISIBLE_TAG_BADGES)
                        .map((name) => (
                            <span
                                className="truncate rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white"
                                key={name}
                            >
                                {name}
                            </span>
                        ))}
                    {appliedTagNames.length > MAX_VISIBLE_TAG_BADGES ? (
                        <span className="rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
                            +{appliedTagNames.length - MAX_VISIBLE_TAG_BADGES}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </Box>
    );
};

const FavoritesShortcutTile = ({
    gif,
    onClick,
}: {
    gif: GifItem;
    onClick: () => void;
}) => {
    const previewUrl =
        gif.previewUrl || gif.file?.sm?.gif?.url || gif.file?.xs?.gif?.url;
    const width = gif.width || gif.file?.sm?.gif?.width || 200;
    const height = gif.height || gif.file?.sm?.gif?.height || 150;

    return (
        <Box
            aria-label="Go to your favorited GIFs"
            className="group relative inline-block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-md bg-bg-secondary ring-1 ring-border-subtle hover:ring-2 hover:ring-primary"
            role="button"
            style={{ aspectRatio: `${width}/${height}` }}
            onClick={onClick}
        >
            <img
                alt=""
                className="h-full w-full object-cover brightness-[0.4]"
                loading="lazy"
                src={previewUrl}
            />
            <Box className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center text-white">
                <Star className="h-5 w-5 fill-current" />
                <span className="px-2 text-xs font-semibold">
                    Your Favorites
                </span>
            </Box>
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

    const {
        data: gifs = [],
        isLoading: loading,
        error: gifsError,
    } = useQuery({
        queryKey: [
            tab === 'favorites' && debouncedSearch === ''
                ? 'klipy'
                : 'gif-picker',
            tab === 'favorites' && debouncedSearch === '' ? 'favorites' : tab,
            tab,
            debouncedSearch,
        ],
        queryFn: async (): Promise<KlipyGif[]> => {
            if (tab === 'favorites') {
                if (debouncedSearch !== '') {
                    return gifTagsApi.searchFavorites(debouncedSearch);
                }
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
        retry: false,
    });

    const tagExpressionError =
        tab === 'favorites' && debouncedSearch !== '' && gifsError
            ? getApiErrorMessage(gifsError, 'Invalid tag expression')
            : null;

    const { data: allTags = [] } = useGifTags({ enabled: tab === 'favorites' });
    const createTag = useCreateGifTag();
    const deleteTag = useDeleteGifTag();
    const addTagToGif = useAddTagsToGif();

    const [floatingTag, setFloatingTag] = useState<GifTag | null>(null);
    const floatingBadgeRef = useRef<HTMLDivElement>(null);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    useLayoutEffect((): void => {
        if (!floatingTag || !floatingBadgeRef.current) return;
        const { x, y } = lastMousePosRef.current;
        floatingBadgeRef.current.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    }, [floatingTag]);

    useEffect((): (() => void) | undefined => {
        if (!floatingTag) return undefined;

        const handleMouseMove = (e: MouseEvent): void => {
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            if (floatingBadgeRef.current) {
                floatingBadgeRef.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
            }
        };

        const handleCancel = (e: MouseEvent): void => {
            e.preventDefault();
            e.stopPropagation();
            setFloatingTag(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('contextmenu', handleCancel, true);

        return (): void => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('contextmenu', handleCancel, true);
        };
    }, [floatingTag]);

    const handleApplyFloatingTag = (gif: GifItem): void => {
        if (!floatingTag) return;
        const klipyId = String(gif.klipyId || gif.id);
        if (klipyId === '' || klipyId === 'undefined') return;
        addTagToGif.mutate({ klipyId, tagIds: [floatingTag.id] });
    };

    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const newTagInputRef = useRef<HTMLInputElement>(null);

    useEffect((): void => {
        if (isCreatingTag) newTagInputRef.current?.focus();
    }, [isCreatingTag]);

    const handleCreateTag = (e: React.FormEvent): void => {
        e.preventDefault();
        const name = newTagName.trim();
        if (name === '') {
            setIsCreatingTag(false);
            return;
        }
        createTag.mutate(name, {
            onSuccess: (): void => {
                setNewTagName('');
                setIsCreatingTag(false);
            },
        });
    };

    const tagNameById = useMemo(
        (): Map<string, string> =>
            new Map(allTags.map((tag): [string, string] => [tag.id, tag.name])),
        [allTags],
    );

    const { data: favoritesList = [] } = useQuery({
        queryKey: ['klipy', 'favorites'],
        queryFn: klipyApi.getFavorites,
        enabled: tab !== 'favorites',
    });

    const favoritedIds = useMemo((): Set<string> => {
        if (tab === 'favorites') {
            return new Set(gifs.map((f): string => String(f.klipyId)));
        }
        return new Set(favoritesList.map((f): string => String(f.klipyId)));
    }, [tab, gifs, favoritesList]);

    const [randomFavorite, setRandomFavorite] = useState<KlipyGif | null>(null);

    useEffect((): (() => void) => {
        const timeoutId = setTimeout((): void => {
            if (favoritesList.length === 0) {
                setRandomFavorite(null);
                return;
            }
            setRandomFavorite((current) => {
                if (
                    current &&
                    favoritesList.some(
                        (f): boolean =>
                            String(f.klipyId) === String(current.klipyId),
                    )
                ) {
                    return current;
                }
                const index = Math.floor(Math.random() * favoritesList.length);
                return favoritesList[index] ?? null;
            });
        }, 0);

        return (): void => {
            clearTimeout(timeoutId);
        };
    }, [favoritesList]);

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
            const { favorited } = await klipyApi.toggleFavorite({
                klipyId,
                slug,
                url,
                previewUrl,
                width,
                height,
                contentType,
            });

            queryClient.setQueriesData<KlipyFavorite[]>(
                { queryKey: ['klipy', 'favorites'] },
                (old = []): KlipyFavorite[] => {
                    const existing = old.some(
                        (f): boolean => String(f.klipyId) === String(klipyId),
                    );

                    if (favorited && !existing) {
                        return [
                            ...old,
                            {
                                klipyId: String(klipyId),
                                slug,
                                url,
                                previewUrl,
                                width,
                                height,
                                contentType,
                                tagIds: gif.tagIds ?? [],
                            },
                        ];
                    }

                    if (!favorited && existing) {
                        return old.filter(
                            (f): boolean =>
                                String(f.klipyId) !== String(klipyId),
                        );
                    }

                    return old;
                },
            );

            void queryClient.invalidateQueries({
                queryKey: ['klipy', 'favorites'],
            });

            void queryClient.invalidateQueries({
                queryKey: ['gif-picker', 'favorites'],
            });
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    return (
        <>
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
                        if (e.key === 'Enter' || e.key === ' ')
                            e.preventDefault();
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
                        placeholder={
                            tab === 'favorites'
                                ? 'Filter by tags (e.g. funny & cats)...'
                                : 'Search Klipy...'
                        }
                        value={search}
                        onChange={(e): void => {
                            setSearch(e.target.value);
                        }}
                    />
                    {tagExpressionError !== null ? (
                        <div className="pt-1 text-[11px] text-red-400">
                            {tagExpressionError}
                        </div>
                    ) : null}
                    {tab === 'favorites' ? (
                        <Box className="flex flex-wrap items-center gap-1 pt-2">
                            {isCreatingTag ? (
                                <form
                                    className="flex items-center"
                                    onSubmit={handleCreateTag}
                                >
                                    <Input
                                        maxLength={32}
                                        maxWidth={112}
                                        placeholder="Tag name..."
                                        ref={newTagInputRef}
                                        size="sm"
                                        value={newTagName}
                                        onBlur={(): void => {
                                            if (newTagName.trim() === '') {
                                                setIsCreatingTag(false);
                                            }
                                        }}
                                        onChange={(e): void => {
                                            setNewTagName(e.target.value);
                                        }}
                                        onKeyDown={(e): void => {
                                            if (e.key === 'Escape') {
                                                setNewTagName('');
                                                setIsCreatingTag(false);
                                            }
                                        }}
                                    />
                                </form>
                            ) : (
                                <button
                                    aria-label="Create a new tag"
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-border-subtle text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                    title="Create a new tag"
                                    type="button"
                                    onClick={(): void => {
                                        setIsCreatingTag(true);
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            )}
                            {allTags.map((tag) => {
                                const active = isTagActive(search, tag.name);
                                return (
                                    <ContextMenu
                                        items={[
                                            {
                                                label: 'Delete tag',
                                                icon: Trash2,
                                                variant: 'danger',
                                                onClick: (): void => {
                                                    deleteTag.mutate(tag.id);
                                                },
                                            },
                                        ]}
                                        key={tag.id}
                                    >
                                        <button
                                            className={cn(
                                                'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                                                active
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-border-subtle text-muted-foreground hover:bg-bg-secondary',
                                                floatingTag?.id === tag.id &&
                                                    'opacity-50',
                                            )}
                                            title="Ctrl+click to pick up and apply to a GIF"
                                            type="button"
                                            onClick={(e): void => {
                                                if (e.ctrlKey) {
                                                    e.preventDefault();
                                                    lastMousePosRef.current = {
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                    };
                                                    setFloatingTag(tag);
                                                    return;
                                                }
                                                setSearch((current) =>
                                                    toggleTagInExpression(
                                                        current,
                                                        tag.name,
                                                    ),
                                                );
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    </ContextMenu>
                                );
                            })}
                        </Box>
                    ) : null}
                </Box>

                <Box className="scrollbar-thin flex-1 overflow-y-auto p-3 pt-1">
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
                            {tab === 'trending' &&
                            debouncedSearch === '' &&
                            randomFavorite ? (
                                <FavoritesShortcutTile
                                    gif={randomFavorite}
                                    onClick={(): void => {
                                        setTab('favorites');
                                    }}
                                />
                            ) : null}
                            {gifs.map((gif) => (
                                <GifPickerItem
                                    floatingTagActive={
                                        tab === 'favorites' &&
                                        floatingTag !== null
                                    }
                                    gif={gif}
                                    isFavorited={favoritedIds.has(
                                        String(gif.klipyId || gif.id),
                                    )}
                                    key={String(gif.klipyId || gif.id)}
                                    tab={tab}
                                    tagNameById={tagNameById}
                                    onApplyFloatingTag={handleApplyFloatingTag}
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
            {floatingTag
                ? createPortal(
                      <div
                          className="pointer-events-none fixed top-0 left-0 z-top rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white shadow-lg"
                          ref={floatingBadgeRef}
                      >
                          {floatingTag.name}
                      </div>,
                      document.body,
                  )
                : null}
        </>
    );
};
