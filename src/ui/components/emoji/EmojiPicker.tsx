import React, { useCallback } from 'react';

import { motion } from 'framer-motion';
import { useMeasure } from 'react-use';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

import type { Server } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import {
    type EmojiData,
    getFullEmojiMetadata,
    getUnicode,
    loadFullEmojiData,
} from '@/utils/emoji';

export interface CustomEmojiCategory {
    id: string;
    name: string;
    icon?: string;
    emojis: Array<{ id: string; name: string; url: string }>;
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

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 40;

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
      }
    | {
          type: 'loading';
      };

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
    onEmojiSelect,
    onCustomEmojiSelect,
    customCategories = [],
    className,
}) => {
    const listRef = React.useRef<List>(null);
    const [listContainerRef, { width: listWidth }] =
        useMeasure<HTMLDivElement>();
    const [activeCategoryId, setActiveCategoryId] = React.useState<string>('');
    const [isScrollingTo, setIsScrollingTo] = React.useState(false);
    const [standardData, setStandardData] = React.useState<{
        grouped: Record<string, EmojiData[]>;
        cats: string[];
        icons: Record<string, EmojiData | undefined>;
    } | null>(null);

    React.useEffect(() => {
        const init = async () => {
            const data = await loadFullEmojiData();
            const metadata = getFullEmojiMetadata(data);
            setStandardData(metadata);
        };
        void init();
    }, []);

    // Compute dynamic column count based on width. Min 8 columns, scale up if wider.
    const columnCount = React.useMemo(() => {
        if (!listWidth) return 8; // Default to 8 until measured
        return Math.max(1, Math.floor((listWidth - 8) / 40));
    }, [listWidth]);

    const displayCategories = React.useMemo(
        () => [
            ...customCategories.map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                type: 'custom' as const,
            })),
            ...(standardData?.cats.map((c) => ({
                id: c,
                name: c,
                type: 'standard' as const,
            })) || []),
        ],
        [customCategories, standardData],
    );

    const flatRows = React.useMemo(() => {
        const rows: RowItem[] = [];

        // Custom categories
        customCategories.forEach((cat) => {
            rows.push({
                type: 'header',
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                isCustom: true,
            });
            const emojiCount = cat.emojis.length;
            for (let i = 0; i < emojiCount; i += columnCount) {
                rows.push({
                    type: 'row',
                    emojis: cat.emojis.slice(i, i + columnCount),
                    isCustom: true,
                    id: cat.id,
                });
            }
        });

        if (!standardData) {
            rows.push({ type: 'loading' });
            return rows;
        }

        // Standard categories
        standardData.cats.forEach((catId) => {
            rows.push({
                type: 'header',
                id: catId,
                name: catId,
                isCustom: false,
                standardIcon: standardData.icons[catId],
            });
            const emojis = standardData.grouped[catId] || [];
            const emojiCount = emojis.length;
            for (let i = 0; i < emojiCount; i += columnCount) {
                rows.push({
                    type: 'row',
                    emojis: emojis.slice(i, i + columnCount),
                    isCustom: false,
                    id: catId,
                });
            }
        });

        return rows;
    }, [customCategories, columnCount, standardData]);

    // Initial active category
    React.useEffect(() => {
        if (displayCategories.length > 0 && !activeCategoryId) {
            setActiveCategoryId(displayCategories[0].id);
        }
    }, [displayCategories, activeCategoryId]);

    const categoryOffsets = React.useMemo(() => {
        const offsets: Record<string, number> = {};
        let currentOffset = 0;
        flatRows.forEach((row) => {
            if (row.type === 'header' && !offsets[row.id]) {
                offsets[row.id] = currentOffset;
            }
            currentOffset += row.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT;
        });
        return offsets;
    }, [flatRows]);

    const getRowHeight = useCallback(
        (index: number): number =>
            flatRows[index].type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT,
        [flatRows],
    );

    const smoothScrollTo = useCallback((targetOffset: number): void => {
        if (!listRef.current) return;

        const startOffset = (
            listRef.current as unknown as { state: { scrollOffset: number } }
        ).state.scrollOffset;
        const distance = targetOffset - startOffset;
        const duration = 300;
        const startTime = performance.now();

        const animateScroll = (currentTime: number): void => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentScroll = startOffset + distance * easeProgress;
            if (listRef.current) {
                listRef.current.scrollTo(currentScroll);
            }

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                setTimeout(() => setIsScrollingTo(false), 50);
            }
        };

        setIsScrollingTo(true);
        requestAnimationFrame(animateScroll);
    }, []);

    const handleCategoryClick = (categoryId: string): void => {
        const offset = categoryOffsets[categoryId];
        if (offset !== undefined && listRef.current) {
            smoothScrollTo(offset);
            setActiveCategoryId(categoryId);
        }
    };

    const handleItemsRendered = ({
        visibleStartIndex,
    }: {
        visibleStartIndex: number;
    }): void => {
        if (isScrollingTo) return;

        const firstVisibleRow = flatRows[visibleStartIndex];
        if (firstVisibleRow && firstVisibleRow.type !== 'loading') {
            const categoryId = firstVisibleRow.id;
            if (categoryId && categoryId !== activeCategoryId) {
                setActiveCategoryId(categoryId);
            }
        }
    };

    const Row = useCallback(
        ({
            index,
            style,
        }: {
            index: number;
            style: React.CSSProperties;
        }): React.ReactElement | null => {
            const row = flatRows[index];
            if (!row) return null;

            if (row.type === 'loading') {
                return (
                    <div
                        className="flex animate-pulse items-center justify-center py-4"
                        style={style}
                    >
                        <Text size="xs" variant="muted">
                            Loading emojis...
                        </Text>
                    </div>
                );
            }

            if (row.type === 'header') {
                return (
                    <Box
                        className="z-[var(--z-index-effect-md)] flex items-center gap-2 border-b border-divider/50 bg-background/95 px-3 py-1 backdrop-blur-sm"
                        style={style}
                    >
                        {row.isCustom ? (
                            <ServerIcon
                                className="!cursor-default !rounded-sm"
                                server={
                                    {
                                        name: row.name,
                                        icon: row.icon,
                                    } as Omit<Server, '_id' | 'ownerId'>
                                }
                                size="xs"
                            />
                        ) : (
                            <div className="flex h-4 w-4 items-center justify-center overflow-hidden">
                                {row.standardIcon ? (
                                    <ParsedUnicodeEmoji
                                        className="inline-block h-[14px] w-[14px] flex-shrink-0"
                                        content={getUnicode(
                                            row.standardIcon.unified,
                                        )}
                                    />
                                ) : null}
                            </div>
                        )}
                        <Text className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            {row.name}
                        </Text>
                    </Box>
                );
            }

            return (
                <div className="flex items-center px-1" style={style}>
                    {row.emojis.map((emoji) => {
                        if (row.isCustom) {
                            const customEmoji = emoji as {
                                id: string;
                                name: string;
                                url: string;
                            };
                            return (
                                <Button
                                    className="group/emoji flex h-10 w-10 items-center justify-center rounded border-none p-1.5 shadow-none transition-transform hover:bg-white/5 active:scale-90"
                                    key={customEmoji.id}
                                    title={customEmoji.name}
                                    variant="ghost"
                                    onClick={() =>
                                        onCustomEmojiSelect?.(customEmoji)
                                    }
                                >
                                    <img
                                        alt={customEmoji.name}
                                        className="h-full w-full object-contain transition-transform duration-200 group-hover/emoji:scale-110"
                                        src={
                                            resolveApiUrl(customEmoji.url) || ''
                                        }
                                    />
                                </Button>
                            );
                        } else {
                            const standardEmoji = emoji as EmojiData;
                            return (
                                <Button
                                    className="group/emoji flex h-10 w-10 items-center justify-center rounded border-none p-1.5 shadow-none transition-transform hover:bg-white/5 active:scale-90"
                                    key={standardEmoji.unified}
                                    title={standardEmoji.short_name}
                                    variant="ghost"
                                    onClick={() =>
                                        onEmojiSelect(
                                            getUnicode(standardEmoji.unified),
                                        )
                                    }
                                >
                                    <ParsedUnicodeEmoji
                                        className="inline-block h-[26px] w-[26px] transition-transform duration-200 group-hover/emoji:scale-110"
                                        content={getUnicode(
                                            standardEmoji.unified,
                                        )}
                                    />
                                </Button>
                            );
                        }
                    })}
                </div>
            );
        },
        [flatRows, onEmojiSelect, onCustomEmojiSelect],
    );

    return (
        <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                'flex h-[380px] w-[350px] overflow-hidden rounded-xl border border-divider bg-background shadow-2xl',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {/* Sidebar */}
            <Box className="scrollbar-hide flex w-[44px] flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-divider/50 bg-bg-subtle/50 py-3 shadow-inner">
                {displayCategories.map((cat) => {
                    const isActive = activeCategoryId === cat.id;

                    if (cat.type === 'custom') {
                        return (
                            <Box
                                className="relative flex-shrink-0"
                                key={cat.id}
                            >
                                <ServerIcon
                                    className="!rounded-lg transition-transform"
                                    isActive={isActive}
                                    server={
                                        {
                                            name: cat.name,
                                            icon: cat.icon,
                                        } as Omit<Server, '_id' | 'ownerId'>
                                    }
                                    size="xs"
                                    onClick={() => handleCategoryClick(cat.id)}
                                />
                                {isActive && (
                                    <div className="absolute top-1/2 -left-3.5 h-6 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                )}
                            </Box>
                        );
                    }

                    return (
                        <Button
                            className={cn(
                                'group relative h-9 w-9 flex-shrink-0 !bg-transparent',
                                isActive
                                    ? 'scale-110 !rounded-lg text-primary'
                                    : 'text-muted-foreground hover:scale-105 hover:text-foreground',
                            )}
                            disabled={!standardData}
                            key={cat.id}
                            title={cat.name}
                            variant="nav"
                            onClick={() => handleCategoryClick(cat.id)}
                        >
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden p-1">
                                {standardData?.icons[cat.id] ? (
                                    <ParsedUnicodeEmoji
                                        className="inline-block h-[24px] w-[24px] flex-shrink-0"
                                        content={getUnicode(
                                            standardData.icons[cat.id]!.unified,
                                        )}
                                    />
                                ) : null}
                            </div>
                            {isActive && (
                                <div className="absolute top-1/2 -left-3.5 h-6 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </Button>
                    );
                })}
            </Box>

            {/* Scrolling List */}
            <Box className="flex min-w-0 flex-1 flex-col bg-background">
                <Box className="sticky top-0 z-[var(--z-index-content)] flex h-[32px] items-center justify-between border-b border-divider/30 bg-background/80 px-3 py-1.5 backdrop-blur-md">
                    <Text className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/70 uppercase">
                        {(
                            flatRows.find(
                                (r) =>
                                    r.type === 'header' &&
                                    r.id === activeCategoryId,
                            ) as { name?: string } | undefined
                        )?.name || 'Emojis'}
                    </Text>
                </Box>
                <div
                    className="relative h-full w-full flex-1"
                    ref={listContainerRef}
                >
                    <AutoSizer
                        renderProp={({ height, width }) => {
                            if (!height || !width) return null;
                            return (
                                <List
                                    className="scrollbar-thin scrollbar-thumb-divider hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pr-1"
                                    height={height}
                                    itemCount={flatRows.length}
                                    itemSize={getRowHeight}
                                    ref={listRef}
                                    width={width}
                                    onItemsRendered={handleItemsRendered}
                                >
                                    {Row}
                                </List>
                            );
                        }}
                    />
                </div>
            </Box>
        </motion.div>
    );
};
