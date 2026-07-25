import React, { useCallback, useMemo, useRef, useState } from 'react';

import { m } from 'framer-motion';
import { Search } from 'lucide-react';
import { useLockBodyScroll, useMeasure } from 'react-use';
import { List } from 'react-window';
import type { ListImperativeAPI, RowComponentProps } from 'react-window';

import { useEmojiInfoBox } from '@/hooks/useEmojiInfoBox';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { EmojiInfoBox } from '@/ui/components/emoji/EmojiInfoBox';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import {
    type EmojiData,
    categories,
    categoryIconMap,
    getUnicode,
    groupedEmojis,
} from '@/utils/emoji';

export interface CustomEmojiCategory {
    id: string;
    name: string;
    icon?: string;
    emojis: { id: string; name: string; url: string; serverId?: string }[];
}

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onCustomEmojiSelect?: (emoji: {
        id: string;
        name: string;
        url: string;
    }) => void;
    customCategories?: CustomEmojiCategory[];
    className?: string;
}

const PICKER_WIDTH = 620;
const PICKER_HEIGHT = 500;

const EMOJI_BUTTON_SIZE = 52;
const EMOJI_ICON_SIZE = 42;

const SIDEBAR_CATEGORY_SIZE = 29;
const SIDEBAR_WIDTH = 48;

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 56;

const SIDEBAR_CATEGORY_GAP = 'gap-2';
const SIDEBAR_PADDING_Y = 'py-2.5';
const HEADER_PADDING_Y = 'py-1';

type RowItem =
    | {
        type: 'header';
        id: string;
        name: string;
        icon?: string;
        isCustom: boolean;
        standardIcon?: EmojiData;
    }
    | {
        type: 'row';
        emojis: (EmojiData | { id: string; name: string; url: string })[];
        isCustom: boolean;
        id: string;
    };

const buildEmojiRows = ({
    customCategories,
    columnCount,
    width,
    height,
    searchQuery,
}: {
    customCategories: CustomEmojiCategory[];
    columnCount: number;
    width: number;
    height: number;
    searchQuery: string;
}): RowItem[] => {
    const rows: RowItem[] = [];
    if (columnCount <= 0 || width <= 0 || height <= 0) return rows;

    const normalizedQuery = searchQuery.trim().toLowerCase();

    for (const cat of [...customCategories].reverse()) {
        const emojis = normalizedQuery
            ? cat.emojis.filter((e): boolean =>
                e.name.toLowerCase().includes(normalizedQuery),
            )
            : cat.emojis;

        if (emojis.length === 0) continue;

        rows.push({
            type: 'header',
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            isCustom: true,
        });
        const count = emojis.length;
        for (let i = 0; i < count; i += columnCount) {
            rows.push({
                type: 'row',
                emojis: emojis.slice(i, i + columnCount),
                isCustom: true,
                id: cat.id,
            });
        }
    }

    for (const catId of categories) {
        const emojis = groupedEmojis[catId] || [];
        const filteredEmojis = normalizedQuery
            ? emojis.filter((e): boolean => {
                const matchName = e.name
                    ?.toLowerCase()
                    .includes(normalizedQuery);
                const matchShortName = e.short_name
                    ?.toLowerCase()
                    .includes(normalizedQuery);
                const matchShortNames = e.short_names?.some((sn): boolean =>
                    sn.toLowerCase().includes(normalizedQuery),
                );
                return matchName || matchShortName || matchShortNames;
            })
            : emojis;

        if (filteredEmojis.length === 0) continue;

        rows.push({
            type: 'header',
            id: catId,
            name: catId,
            isCustom: false,
            standardIcon: categoryIconMap[catId],
        });
        const count = filteredEmojis.length;
        for (let i = 0; i < count; i += columnCount) {
            rows.push({
                type: 'row',
                emojis: filteredEmojis.slice(i, i + columnCount),
                isCustom: false,
                id: catId,
            });
        }
    }
    return rows;
};

const EmojiPickerRow = ({
    row,
    style,
    onEmojiSelect,
    onCustomEmojiSelect,
    onShowInfo,
}: {
    row: RowItem;
    style: React.CSSProperties;
    onEmojiSelect: (emoji: string) => void;
    onCustomEmojiSelect?: (emoji: {
        id: string;
        name: string;
        url: string;
    }) => void;
    onShowInfo: (
        custom: { id: string; name: string; url: string },
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
                {row.isCustom ? (
                    <ServerIcon
                        className="!cursor-default !rounded-sm"
                        server={{ name: row.name, icon: row.icon }}
                        size="xs"
                    />
                ) : (
                    <div className="flex h-4 w-4 items-center justify-center">
                        {row.standardIcon ? (
                            <ParsedUnicodeEmoji
                                className="inline-block h-[16px] w-[16px] flex-shrink-0 !top-0"
                                content={getUnicode(row.standardIcon)}
                            />
                        ) : (
                            <Text size="xs">?</Text>
                        )}
                    </div>
                )}
                <Text className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {row.name}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            className="flex flex-nowrap gap-0.5 overflow-hidden px-1 py-0.5"
            style={style}
        >
            {row.emojis.map((emoji) => {
                if (emoji && typeof emoji === 'object' && 'unified' in emoji) {
                    const unicode = getUnicode(emoji);
                    return (
                        <Tooltip
                            content={`:${emoji.short_name}:`}
                            key={emoji.unified}
                            position="top"
                        >
                            <Button
                                className="flex shrink-0 items-center justify-center rounded-md p-0 transition-colors hover:bg-bg-subtle"
                                style={{
                                    width: EMOJI_BUTTON_SIZE,
                                    height: EMOJI_BUTTON_SIZE,
                                }}
                                variant="ghost"
                                onMouseDown={(e): void => e.preventDefault()}
                                onClick={(): void => {
                                    onEmojiSelect(unicode);
                                }}
                            >
                                <ParsedUnicodeEmoji
                                    className="!top-0"
                                    style={{
                                        width: EMOJI_ICON_SIZE,
                                        height: EMOJI_ICON_SIZE,
                                    }}
                                    content={unicode}
                                />
                            </Button>
                        </Tooltip>
                    );
                }
                if (
                    emoji &&
                    typeof emoji === 'object' &&
                    'id' in emoji &&
                    'url' in emoji
                ) {
                    const custom = emoji as {
                        id: string;
                        name: string;
                        url: string;
                    };
                    return (
                        <Tooltip
                            content={`:${custom.name}:`}
                            key={custom.id}
                            position="top"
                        >
                            <Button
                                className="flex shrink-0 items-center justify-center rounded-md p-0 transition-colors hover:bg-bg-subtle"
                                style={{
                                    width: EMOJI_BUTTON_SIZE,
                                    height: EMOJI_BUTTON_SIZE,
                                }}
                                variant="ghost"
                                onMouseDown={(e): void => e.preventDefault()}
                                onClick={(): void | undefined =>
                                    onCustomEmojiSelect?.(custom)
                                }
                                onContextMenu={(e): void => {
                                    onShowInfo(custom, e);
                                }}
                            >
                                <img
                                    alt={custom.name}
                                    className="object-contain"
                                    style={{
                                        width: EMOJI_ICON_SIZE,
                                        height: EMOJI_ICON_SIZE,
                                    }}
                                    src={resolveApiUrl(custom.url) || ''}
                                />
                            </Button>
                        </Tooltip>
                    );
                }
                return null;
            })}
        </Box>
    );
};

const EmojiPickerContent = ({
    width,
    height,
    customCategories,
    onEmojiSelect,
    onCustomEmojiSelect,
}: {
    width: number;
    height: number;
    customCategories: CustomEmojiCategory[];
    onEmojiSelect: (emoji: string) => void;
    onCustomEmojiSelect?: (emoji: {
        id: string;
        name: string;
        url: string;
    }) => void;
}) => {
    const listRef = React.useRef<ListImperativeAPI>(null);
    const scrollOffsetRef = React.useRef<number>(0);
    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const isScrollingToRef = useRef(false);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        selectedEmoji,
        infoBoxPosition,
        server,
        showEmojiInfo,
        closeInfoBox,
    } = useEmojiInfoBox();

    const listAreaWidth = width - SIDEBAR_WIDTH;
    const columnCount = useMemo((): number => {
        if (width <= 0) return 1;
        return Math.max(1, Math.floor((listAreaWidth - 16) / EMOJI_BUTTON_SIZE));
    }, [listAreaWidth, width]);

    const flatRows = useMemo(
        (): RowItem[] =>
            buildEmojiRows({
                customCategories,
                columnCount,
                width,
                height,
                searchQuery,
            }),
        [customCategories, columnCount, width, height, searchQuery],
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
            if (firstVisibleRow && firstVisibleRow.id !== activeCategoryId) {
                setActiveCategoryId(firstVisibleRow.id);
            }
        },
        [flatRows, activeCategoryId],
    );

    const handleScroll = useCallback(
        ({ scrollOffset }: { scrollOffset: number }): void => {
            scrollOffsetRef.current = scrollOffset;
        },
        [],
    );

    const displayCategories = useMemo(
        () => [
            ...[...customCategories].reverse().map(
                (
                    c,
                ): {
                    id: string;
                    name: string;
                    icon: string | undefined;
                    type: 'custom';
                } => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon,
                    type: 'custom' as const,
                }),
            ),
            ...categories.map(
                (c): { id: string; name: string; type: 'standard' } => ({
                    id: c,
                    name: c,
                    type: 'standard' as const,
                }),
            ),
        ],
        [customCategories],
    );

    const resolvedActiveCategoryId =
        activeCategoryId ??
        (width > 0 && height > 0 ? (displayCategories[0]?.id ?? null) : null);

    const Row = useCallback(
        ({ index, style }: RowComponentProps) => {
            const row = flatRows[index];
            if (!row) return null;

            return (
                <EmojiPickerRow
                    row={row}
                    style={style}
                    onCustomEmojiSelect={onCustomEmojiSelect}
                    onEmojiSelect={onEmojiSelect}
                    onShowInfo={showEmojiInfo}
                />
            );
        },
        [flatRows, onEmojiSelect, onCustomEmojiSelect, showEmojiInfo],
    );

    if (width <= 0 || height <= 0) return null;

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Emoji picker sidebar: renders custom server icons and standard category emoji buttons */}
            <Box
                className={cn(
                    'scrollbar-hide flex flex-shrink-0 flex-col items-center overflow-y-auto border-r border-divider/50 bg-bg-subtle/50 shadow-inner',
                    SIDEBAR_CATEGORY_GAP,
                    SIDEBAR_PADDING_Y,
                )}
                style={{ width: SIDEBAR_WIDTH }}
            >
                {displayCategories.map((cat) => {
                    const isActive = resolvedActiveCategoryId === cat.id;
                    return cat.type === 'custom' ? (
                        <Box
                            className="relative flex flex-shrink-0 items-center justify-center"
                            style={{
                                width: SIDEBAR_CATEGORY_SIZE,
                                height: SIDEBAR_CATEGORY_SIZE,
                            }}
                            key={cat.id}
                        >
                            <ServerIcon
                                className={cn(
                                    '!rounded-lg transition-transform',
                                    isActive ? 'scale-110' : 'hover:scale-105',
                                )}
                                style={{
                                    width: SIDEBAR_CATEGORY_SIZE,
                                    height: SIDEBAR_CATEGORY_SIZE,
                                }}
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
                                onClick={(): void => {
                                    handleCategoryClick(cat.id);
                                }}
                            />
                            {isActive ? (
                                <div
                                    className="absolute top-1/2 -left-3.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                    style={{ height: SIDEBAR_CATEGORY_SIZE * 0.75 }}
                                />
                            ) : null}
                        </Box>
                    ) : (
                        <Box
                            className="relative flex flex-shrink-0 items-center justify-center"
                            style={{
                                width: SIDEBAR_CATEGORY_SIZE,
                                height: SIDEBAR_CATEGORY_SIZE,
                            }}
                            key={cat.id}
                        >
                            <Button
                                className={cn(
                                    'group relative flex-shrink-0 !bg-transparent p-0',
                                    isActive
                                        ? 'scale-110 text-primary'
                                        : 'text-muted-foreground hover:scale-105 hover:text-foreground',
                                )}
                                style={{
                                    width: SIDEBAR_CATEGORY_SIZE,
                                    height: SIDEBAR_CATEGORY_SIZE,
                                    minWidth: 0,
                                    minHeight: 0,
                                }}
                                title={cat.name}
                                variant="ghost"
                                onClick={(): void => {
                                    handleCategoryClick(cat.id);
                                }}
                            >
                                <div
                                    className="flex items-center justify-center"
                                    style={{
                                        width: SIDEBAR_CATEGORY_SIZE,
                                        height: SIDEBAR_CATEGORY_SIZE,
                                    }}
                                >
                                    {categoryIconMap[cat.id] ? (
                                        <ParsedUnicodeEmoji
                                            className="inline-block flex-shrink-0 !top-0"
                                            style={{
                                                width: SIDEBAR_CATEGORY_SIZE,
                                                height: SIDEBAR_CATEGORY_SIZE,
                                            }}
                                            content={getUnicode(
                                                categoryIconMap[cat.id]!,
                                            )}
                                        />
                                    ) : null}
                                </div>
                            </Button>
                            {isActive ? (
                                <div
                                    className="absolute top-1/2 -left-3.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                    style={{ height: SIDEBAR_CATEGORY_SIZE * 0.75 }}
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
                            placeholder="Search emojis..."
                            value={searchQuery}
                            onChange={(e): void => {
                                setSearchQuery(e.target.value);
                            }}
                        />
                    </Box>
                </Box>

                <List
                    className="scrollbar-thin scrollbar-thumb-divider hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pr-1"
                    listRef={listRef}
                    rowComponent={Row}
                    rowCount={flatRows.length}
                    rowHeight={getRowHeight}
                    rowProps={{}}
                    style={{ height: height - 44, width: listAreaWidth }}
                    onRowsRendered={({
                        startIndex,
                    }: {
                        startIndex: number;
                    }): void => {
                        handleItemsRendered({ visibleStartIndex: startIndex });
                    }}
                    onScroll={(e: React.UIEvent<HTMLDivElement>): void => {
                        handleScroll({
                            scrollOffset: e.currentTarget.scrollTop,
                        });
                    }}
                />

                {selectedEmoji && infoBoxPosition ? (
                    <EmojiInfoBox
                        emoji={selectedEmoji}
                        position={infoBoxPosition}
                        server={server}
                        onClose={closeInfoBox}
                    />
                ) : null}
            </Box>
        </div>
    );
};

const EMPTY_CUSTOM_CATEGORIES: CustomEmojiCategory[] = [];

export const EmojiPicker = ({
    onEmojiSelect,
    onCustomEmojiSelect,
    customCategories = EMPTY_CUSTOM_CATEGORIES,
    className,
}: EmojiPickerProps) => {
    const [containerRef, { width, height }] = useMeasure<HTMLDivElement>();

    useLockBodyScroll(true);

    React.useEffect((): (() => void) => {
        document.body.classList.add('picker-open');
        return (): void => {
            document.body.classList.remove('picker-open');
        };
    }, []);

    return (
        <m.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                'relative flex overflow-hidden rounded-xl border border-divider bg-background shadow-2xl',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={containerRef}
            style={{
                width: `min(${PICKER_WIDTH}px, calc(100vw - 24px))`,
                height: PICKER_HEIGHT,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {width > 0 && height > 0 ? (
                <EmojiPickerContent
                    customCategories={customCategories}
                    height={height}
                    width={width}
                    onCustomEmojiSelect={onCustomEmojiSelect}
                    onEmojiSelect={onEmojiSelect}
                />
            ) : null}
        </m.div>
    );
};
