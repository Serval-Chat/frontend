import React, { useCallback, useMemo, useRef, useState } from 'react';

import { m } from 'framer-motion';
import { Search } from 'lucide-react';
import { useLockBodyScroll } from 'react-use';
import { List } from 'react-window';
import type { ListImperativeAPI, RowComponentProps } from 'react-window';

import type { Sticker } from '@/api/servers/servers.api';
import { useStickerInfoBox } from '@/hooks/useStickerInfoBox';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { StickerInfoBox } from '@/ui/components/emoji/StickerInfoBox';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

export interface StickerCategory {
    id: string;
    name: string;
    icon?: string;
    stickers: Sticker[];
}

interface StickerPickerProps {
    onStickerSelect: (sticker: Sticker) => void;
    categories: StickerCategory[];
    className?: string;
}

const PICKER_WIDTH = 620;
const PICKER_HEIGHT = 500;

const STICKER_BUTTON_SIZE = 96;
const STICKER_ICON_SIZE = 80;

const SIDEBAR_CATEGORY_SIZE = 29;
const SIDEBAR_WIDTH = 48;

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 104;

const SIDEBAR_CATEGORY_GAP = 'gap-2';
const SIDEBAR_PADDING_Y = 'py-2.5';
const HEADER_PADDING_Y = 'py-1';

type RowItem =
    | {
          type: 'header';
          id: string;
          name: string;
          icon?: string;
      }
    | {
          type: 'row';
          stickers: Sticker[];
          id: string;
      };

const buildStickerRows = ({
    categories,
    columnCount,
    width,
    height,
    searchQuery,
}: {
    categories: StickerCategory[];
    columnCount: number;
    width: number;
    height: number;
    searchQuery: string;
}): RowItem[] => {
    const rows: RowItem[] = [];
    if (columnCount <= 0 || width <= 0 || height <= 0) return rows;

    const normalizedQuery = searchQuery.trim().toLowerCase();

    for (const cat of categories) {
        const stickers = normalizedQuery
            ? cat.stickers.filter((s): boolean =>
                  s.name.toLowerCase().includes(normalizedQuery),
              )
            : cat.stickers;

        if (stickers.length === 0) continue;

        rows.push({
            type: 'header',
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
        });

        const count = stickers.length;
        for (let i = 0; i < count; i += columnCount) {
            rows.push({
                type: 'row',
                stickers: stickers.slice(i, i + columnCount),
                id: cat.id,
            });
        }
    }

    return rows;
};

const StickerPickerRow = ({
    row,
    style,
    onStickerSelect,
    onShowInfo,
}: {
    row: RowItem;
    style: React.CSSProperties;
    onStickerSelect: (sticker: Sticker) => void;
    onShowInfo: (
        sticker: { id: string; name: string; url: string; serverId?: string },
        e: React.MouseEvent,
    ) => void;
}) => {
    if (row.type === 'header') {
        return (
            <Box
                className={cn(
                    'z-[var(--z-index-effect-md)] flex items-center gap-1.5 border-b border-divider/50 bg-background/95 px-3 backdrop-blur-sm',
                    HEADER_PADDING_Y,
                )}
                style={style}
            >
                <ServerIcon
                    className="!cursor-default !rounded-sm"
                    server={{ name: row.name, icon: row.icon }}
                    size="xs"
                />
                <Text className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {row.name}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            className="flex flex-nowrap gap-2 overflow-hidden px-3 py-1"
            style={style}
        >
            {row.stickers.map((sticker) => (
                <Tooltip
                    content={sticker.name}
                    key={sticker.id}
                    position="top"
                >
                    <Button
                        className="group relative flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors hover:bg-bg-subtle"
                        style={{
                            width: STICKER_BUTTON_SIZE,
                            height: STICKER_BUTTON_SIZE,
                        }}
                        variant="ghost"
                        onClick={(): void => {
                            onStickerSelect(sticker);
                        }}
                        onContextMenu={(e): void => {
                            onShowInfo(
                                {
                                    id: sticker.id,
                                    name: sticker.name,
                                    url: sticker.imageUrl,
                                    serverId: sticker.serverId,
                                },
                                e,
                            );
                        }}
                        onMouseDown={(e): void => e.preventDefault()}
                    >
                        <img
                            alt={sticker.name}
                            className="object-contain"
                            src={resolveApiUrl(sticker.imageUrl) || ''}
                            style={{
                                width: STICKER_ICON_SIZE,
                                height: STICKER_ICON_SIZE,
                            }}
                        />
                    </Button>
                </Tooltip>
            ))}
        </Box>
    );
};

const StickerPickerContent = ({
    width,
    height,
    categories,
    onStickerSelect,
}: {
    width: number;
    height: number;
    categories: StickerCategory[];
    onStickerSelect: (sticker: Sticker) => void;
}) => {
    const listRef = React.useRef<ListImperativeAPI>(null);
    const scrollOffsetRef = React.useRef<number>(0);
    const [activeCategoryId, setActiveCategoryId] = useState<string>(
        categories[0]?.id || '',
    );
    const activeCategoryIdRef = useRef(activeCategoryId);
    React.useEffect(() => {
        activeCategoryIdRef.current = activeCategoryId;
    }, [activeCategoryId]);
    const isScrollingToRef = useRef(false);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        selectedSticker,
        infoBoxPosition,
        server,
        showStickerInfo,
        closeInfoBox,
    } = useStickerInfoBox();

    const listAreaWidth = width - SIDEBAR_WIDTH;
    const columnCount = useMemo((): number => {
        if (width <= 0) return 1;
        return Math.max(
            1,
            Math.floor((listAreaWidth - 24) / (STICKER_BUTTON_SIZE + 8)),
        );
    }, [listAreaWidth, width]);

    const flatRows = useMemo(
        (): RowItem[] =>
            buildStickerRows({
                categories,
                columnCount,
                width,
                height,
                searchQuery,
            }),
        [categories, columnCount, width, height, searchQuery],
    );

    const categoryOffsets = useMemo((): Record<string, number> => {
        const offsets: Record<string, number> = {};
        if (width <= 0 || height <= 0) return offsets;
        let currentOffset = 0;
        for (const row of flatRows) {
            if (row.type === 'header' && !offsets[row.id])
                offsets[row.id] = currentOffset;
            currentOffset += row.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT;
        }
        return offsets;
    }, [flatRows, width, height]);

    const getRowHeight = useCallback(
        (index: number): number =>
            flatRows[index]?.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT,
        [flatRows],
    );

    const smoothScrollTo = useCallback((targetOffset: number): void => {
        if (!listRef.current) return;
        const startOffset = scrollOffsetRef.current;
        const distance = targetOffset - startOffset;
        const duration = 300;
        const startTime = performance.now();

        const animateScroll = (currentTime: number): void => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentScroll = startOffset + distance * easeProgress;
            if (listRef.current?.element) {
                listRef.current.element.scrollTop = currentScroll;
            }

            if (progress < 1) requestAnimationFrame(animateScroll);
            else
                setTimeout((): void => {
                    isScrollingToRef.current = false;
                }, 50);
        };

        isScrollingToRef.current = true;
        requestAnimationFrame(animateScroll);
    }, []);

    const handleCategoryClick = (categoryId: string): void => {
        const offset = categoryOffsets[categoryId];
        if (offset !== undefined) {
            smoothScrollTo(offset);
            setActiveCategoryId(categoryId);
        }
    };

    const handleItemsRendered = useCallback(
        ({ visibleStartIndex }: { visibleStartIndex: number }): void => {
            if (isScrollingToRef.current) return;
            const firstVisibleRow = flatRows[visibleStartIndex];
            if (
                firstVisibleRow &&
                firstVisibleRow.id !== activeCategoryIdRef.current
            ) {
                setActiveCategoryId(firstVisibleRow.id);
            }
        },
        [flatRows],
    );

    const handleScroll = useCallback(
        ({ scrollOffset }: { scrollOffset: number }): void => {
            scrollOffsetRef.current = scrollOffset;
        },
        [],
    );

    const resolvedActiveCategoryId =
        activeCategoryId ||
        (width > 0 && height > 0 ? (categories[0]?.id ?? null) : null);

    const Row = useCallback(
        ({ index, style }: RowComponentProps) => {
            const row = flatRows[index];
            if (!row) return null;

            return (
                <StickerPickerRow
                    row={row}
                    style={style}
                    onShowInfo={showStickerInfo}
                    onStickerSelect={onStickerSelect}
                />
            );
        },
        [flatRows, onStickerSelect, showStickerInfo],
    );

    const onRowsRendered = useCallback(
        ({ startIndex }: { startIndex: number }): void => {
            handleItemsRendered({
                visibleStartIndex: startIndex,
            });
        },
        [handleItemsRendered],
    );

    if (width <= 0 || height <= 0) return null;

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Sticker picker sidebar: renders server icons */}
            <Box
                className={cn(
                    'scrollbar-hide flex flex-shrink-0 flex-col items-center overflow-y-auto border-r border-divider/50 bg-bg-subtle/50 shadow-inner',
                    SIDEBAR_CATEGORY_GAP,
                    SIDEBAR_PADDING_Y,
                )}
                style={{ width: SIDEBAR_WIDTH }}
            >
                {categories.map((cat) => {
                    const isActive = resolvedActiveCategoryId === cat.id;
                    return (
                        <Box
                            className="relative flex flex-shrink-0 items-center justify-center"
                            key={cat.id}
                            style={{
                                width: SIDEBAR_CATEGORY_SIZE,
                                height: SIDEBAR_CATEGORY_SIZE,
                            }}
                        >
                            <ServerIcon
                                className={cn(
                                    '!rounded-lg transition-transform',
                                    isActive ? 'scale-110' : 'hover:scale-105',
                                )}
                                isActive={isActive}
                                server={
                                    {
                                        name: cat.name,
                                        icon: cat.icon,
                                    } as Parameters<
                                        typeof ServerIcon
                                    >[0]['server']
                                }
                                size="xs"
                                style={{
                                    width: SIDEBAR_CATEGORY_SIZE,
                                    height: SIDEBAR_CATEGORY_SIZE,
                                }}
                                onClick={(): void => {
                                    handleCategoryClick(cat.id);
                                }}
                            />
                            {isActive ? (
                                <div
                                    className="absolute top-1/2 -left-3.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                    style={{
                                        height: SIDEBAR_CATEGORY_SIZE * 0.75,
                                    }}
                                />
                            ) : null}
                        </Box>
                    );
                })}
            </Box>

            <Box className="relative flex min-w-0 flex-1 flex-col bg-background">
                <Box className="sticky top-0 z-[var(--z-index-content)] flex flex-col border-b border-divider/30 bg-background/80 px-3 py-1.5 backdrop-blur-md">
                    <Box className="w-full">
                        <Input
                            className="h-8 text-sm"
                            icon={<Search size={14} />}
                            placeholder="Search stickers..."
                            value={searchQuery}
                            onChange={(e): void => {
                                setSearchQuery(e.target.value);
                            }}
                        />
                    </Box>
                </Box>

                {flatRows.length > 0 ? (
                    <List
                        className="scrollbar-thin scrollbar-thumb-divider hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pr-1"
                        listRef={listRef}
                        rowComponent={Row}
                        rowCount={flatRows.length}
                        rowHeight={getRowHeight}
                        rowProps={{}}
                        style={{ height: height - 44, width: listAreaWidth }}
                        onRowsRendered={onRowsRendered}
                        onScroll={(e: React.UIEvent<HTMLDivElement>): void => {
                            handleScroll({
                                scrollOffset: e.currentTarget.scrollTop,
                            });
                        }}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                        <Text variant="muted">
                            {searchQuery
                                ? 'No stickers found.'
                                : 'No stickers available.'}
                        </Text>
                    </div>
                )}

                {selectedSticker && infoBoxPosition ? (
                    <StickerInfoBox
                        position={infoBoxPosition}
                        server={server}
                        sticker={selectedSticker}
                        onClose={closeInfoBox}
                    />
                ) : null}
            </Box>
        </div>
    );
};

export const StickerPicker = ({
    onStickerSelect,
    categories,
    className,
}: StickerPickerProps) => {
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 1024,
    );

    useLockBodyScroll(true);

    React.useEffect((): (() => void) => {
        const handleResize = (): void => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        document.body.classList.add('picker-open');
        return (): void => {
            window.removeEventListener('resize', handleResize);
            document.body.classList.remove('picker-open');
        };
    }, []);

    const width = Math.min(
        PICKER_WIDTH,
        Math.max(300, windowWidth - 24),
    );
    const height = PICKER_HEIGHT;

    return (
        <m.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                'relative flex overflow-hidden rounded-xl border border-divider bg-background shadow-2xl',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
                width: `min(${PICKER_WIDTH}px, calc(100vw - 24px))`,
                height: PICKER_HEIGHT,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <StickerPickerContent
                categories={categories}
                height={height}
                width={width}
                onStickerSelect={onStickerSelect}
            />
        </m.div>
    );
};

