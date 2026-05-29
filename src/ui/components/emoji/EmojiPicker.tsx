import React, { useCallback, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
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
    emojis: Array<{ id: string; name: string; url: string; serverId?: string }>;
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

const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 48;
const SIDEBAR_WIDTH = 44;

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
    const [isScrollingTo, setIsScrollingTo] = useState(false);
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
        return Math.max(1, Math.floor((listAreaWidth - 16) / 42));
    }, [listAreaWidth, width]);

    const flatRows = useMemo((): RowItem[] => {
        const rows: RowItem[] = [];
        if (columnCount <= 0 || width <= 0 || height <= 0) return rows;

        const normalizedQuery = searchQuery.trim().toLowerCase();

        customCategories.forEach((cat): void => {
            const emojis = normalizedQuery
                ? cat.emojis.filter((e): boolean =>
                      e.name.toLowerCase().includes(normalizedQuery),
                  )
                : cat.emojis;

            if (emojis.length === 0) return;

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
        });

        categories.forEach((catId): void => {
            const emojis = groupedEmojis[catId] || [];
            const filteredEmojis = normalizedQuery
                ? emojis.filter((e): boolean => {
                      const matchName = e.name
                          ?.toLowerCase()
                          .includes(normalizedQuery);
                      const matchShortName = e.short_name
                          ?.toLowerCase()
                          .includes(normalizedQuery);
                      const matchShortNames = e.short_names?.some(
                          (sn): boolean =>
                              sn.toLowerCase().includes(normalizedQuery),
                      );
                      return matchName || matchShortName || matchShortNames;
                  })
                : emojis;

            if (filteredEmojis.length === 0) return;

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
        });
        return rows;
    }, [customCategories, columnCount, width, height, searchQuery]);

    const categoryOffsets = useMemo((): Record<string, number> => {
        const offsets: Record<string, number> = {};
        if (width <= 0 || height <= 0) return offsets;
        let currentOffset = 0;
        flatRows.forEach((row): void => {
            if (row.type === 'header' && !offsets[row.id])
                offsets[row.id] = currentOffset;
            currentOffset += row.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT;
        });
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
            else setTimeout((): void => setIsScrollingTo(false), 50);
        };

        setIsScrollingTo(true);
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
            if (isScrollingTo) return;
            const firstVisibleRow = flatRows[visibleStartIndex];
            if (firstVisibleRow && firstVisibleRow.id !== activeCategoryId) {
                setActiveCategoryId(firstVisibleRow.id);
            }
        },
        [isScrollingTo, flatRows, activeCategoryId],
    );

    const handleScroll = useCallback(
        ({ scrollOffset }: { scrollOffset: number }): void => {
            scrollOffsetRef.current = scrollOffset;
        },
        [],
    );

    const displayCategories = useMemo(
        () => [
            ...customCategories.map(
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

    React.useEffect((): void => {
        if (width <= 0 || height <= 0) return;
        if (displayCategories.length > 0 && !activeCategoryId) {
            setActiveCategoryId(displayCategories[0].id);
        }
    }, [displayCategories, activeCategoryId, width, height]);

    const Row = useCallback(
        ({ index, style }: RowComponentProps) => {
            const row = flatRows[index];
            if (!row) return null;

            if (row.type === 'header') {
                return (
                    <Box
                        className="z-[var(--z-index-effect-md)] flex items-center gap-2 border-b border-divider/50 bg-background/95 px-3 py-1 backdrop-blur-sm"
                        style={style}
                    >
                        {row.isCustom ? (
                            <ServerIcon
                                className="!cursor-default !rounded-sm"
                                server={{ name: row.name, icon: row.icon }}
                                size="xs"
                            />
                        ) : (
                            <div className="flex h-4 w-4 items-center justify-center overflow-hidden">
                                {row.standardIcon ? (
                                    <ParsedUnicodeEmoji
                                        className="inline-block h-[22px] w-[22px] flex-shrink-0"
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
                    className="flex flex-nowrap gap-0.5 overflow-hidden p-1"
                    style={style}
                >
                    {row.emojis.map((emoji) => {
                        if (
                            emoji &&
                            typeof emoji === 'object' &&
                            'unified' in emoji
                        ) {
                            const unicode = getUnicode(emoji as EmojiData);
                            return (
                                <Tooltip
                                    content={`:${(emoji as EmojiData).short_name}:`}
                                    key={(emoji as EmojiData).unified}
                                    position="top"
                                >
                                    <Button
                                        className="h-10 w-10 shrink-0 rounded-md transition-colors hover:bg-bg-subtle"
                                        variant="ghost"
                                        onClick={(): void =>
                                            onEmojiSelect(unicode)
                                        }
                                    >
                                        <ParsedUnicodeEmoji
                                            className="h-8 w-8"
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
                                        className="h-10 w-10 shrink-0 rounded-md transition-colors hover:bg-bg-subtle"
                                        variant="ghost"
                                        onClick={(): void | undefined =>
                                            onCustomEmojiSelect?.(custom)
                                        }
                                        onContextMenu={(e): void =>
                                            showEmojiInfo(custom, e)
                                        }
                                    >
                                        <img
                                            alt={custom.name}
                                            className="h-8 w-8 object-contain"
                                            src={
                                                resolveApiUrl(custom.url) || ''
                                            }
                                        />
                                    </Button>
                                </Tooltip>
                            );
                        }
                        return null;
                    })}
                </Box>
            );
        },
        [flatRows, onEmojiSelect, onCustomEmojiSelect, showEmojiInfo],
    );

    if (width <= 0 || height <= 0) return null;

    return (
        <div className="flex h-full w-full overflow-hidden">
            <Box className="scrollbar-hide flex w-[44px] flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-divider/50 bg-bg-subtle/50 py-3 shadow-inner">
                {displayCategories.map((cat) => {
                    const isActive = activeCategoryId === cat.id;
                    return cat.type === 'custom' ? (
                        <Box className="relative flex-shrink-0" key={cat.id}>
                            <ServerIcon
                                className="!rounded-lg transition-transform"
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
                                onClick={(): void =>
                                    handleCategoryClick(cat.id)
                                }
                            />
                            {isActive && (
                                <div className="absolute top-1/2 -left-3.5 h-6 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </Box>
                    ) : (
                        <Button
                            className={cn(
                                'group relative h-9 w-9 flex-shrink-0 !bg-transparent',
                                isActive
                                    ? 'scale-110 !rounded-lg text-primary'
                                    : 'text-muted-foreground hover:scale-105 hover:text-foreground',
                            )}
                            key={cat.id}
                            title={cat.name}
                            variant="nav"
                            onClick={(): void => handleCategoryClick(cat.id)}
                        >
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden p-1">
                                {categoryIconMap[cat.id] && (
                                    <ParsedUnicodeEmoji
                                        className="inline-block h-[24px] w-[24px] flex-shrink-0"
                                        content={getUnicode(
                                            categoryIconMap[cat.id]!,
                                        )}
                                    />
                                )}
                            </div>
                            {isActive && (
                                <div className="absolute top-1/2 -left-3.5 h-6 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </Button>
                    );
                })}
            </Box>

            <Box className="relative flex min-w-0 flex-1 flex-col bg-background">
                <Box className="sticky top-0 z-[var(--z-index-content)] flex flex-col border-b border-divider/30 bg-background/80 px-3 py-1.5 backdrop-blur-md">
                    <Box className="mb-2 w-full">
                        <Input
                            className="h-8 text-sm"
                            icon={<Search size={14} />}
                            placeholder="Search emojis..."
                            value={searchQuery}
                            onChange={(e): void =>
                                setSearchQuery(e.target.value)
                            }
                        />
                    </Box>
                    <Box className="flex h-[20px] items-center justify-between">
                        <Text className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/70 uppercase">
                            {searchQuery
                                ? 'Search Results'
                                : (
                                      flatRows.find(
                                          (r) =>
                                              r.type === 'header' &&
                                              r.id === activeCategoryId,
                                      ) as
                                          | (RowItem & { type: 'header' })
                                          | undefined
                                  )?.name || 'Emojis'}
                        </Text>
                    </Box>
                </Box>

                <List
                    className="scrollbar-thin scrollbar-thumb-divider hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pr-1"
                    listRef={listRef}
                    rowComponent={Row}
                    rowCount={flatRows.length}
                    rowHeight={getRowHeight}
                    rowProps={{}}
                    style={{ height: height - 72, width: listAreaWidth }}
                    onRowsRendered={({
                        startIndex,
                    }: {
                        startIndex: number;
                    }): void =>
                        handleItemsRendered({ visibleStartIndex: startIndex })
                    }
                    onScroll={(e: React.UIEvent<HTMLDivElement>): void =>
                        handleScroll({
                            scrollOffset: e.currentTarget.scrollTop,
                        })
                    }
                />

                {selectedEmoji && infoBoxPosition && (
                    <EmojiInfoBox
                        emoji={selectedEmoji}
                        position={infoBoxPosition}
                        server={server}
                        onClose={closeInfoBox}
                    />
                )}
            </Box>
        </div>
    );
};

export const EmojiPicker = ({
    onEmojiSelect,
    onCustomEmojiSelect,
    customCategories = [],
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
        <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                'relative flex h-[500px] w-[min(480px,calc(100vw-24px))] overflow-hidden rounded-xl border border-divider bg-background shadow-2xl',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={containerRef}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {width > 0 && height > 0 && (
                <EmojiPickerContent
                    customCategories={customCategories}
                    height={height}
                    width={width}
                    onCustomEmojiSelect={onCustomEmojiSelect}
                    onEmojiSelect={onEmojiSelect}
                />
            )}
        </motion.div>
    );
};
