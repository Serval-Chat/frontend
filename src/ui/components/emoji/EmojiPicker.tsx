import React, { useCallback } from 'react';

import { motion } from 'framer-motion';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import {
    type EmojiData,
    categories,
    categoryIconMap,
    getSpriteStyle,
    getUnicode,
    groupedEmojis,
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

const COLUMN_COUNT = 8;
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
      };

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
    onEmojiSelect,
    onCustomEmojiSelect,
    customCategories = [],
    className,
}) => {
    const listRef = React.useRef<List>(null);
    const [activeCategoryId, setActiveCategoryId] = React.useState<string>('');
    const [isScrollingTo, setIsScrollingTo] = React.useState(false);

    const displayCategories = React.useMemo(
        () => [
            ...customCategories.map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                type: 'custom' as const,
            })),
            ...categories.map((c) => ({
                id: c,
                name: c,
                type: 'standard' as const,
            })),
        ],
        [customCategories],
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
            for (let i = 0; i < emojiCount; i += COLUMN_COUNT) {
                rows.push({
                    type: 'row',
                    emojis: cat.emojis.slice(i, i + COLUMN_COUNT),
                    isCustom: true,
                    id: cat.id,
                });
            }
        });

        // Standard categories
        categories.forEach((catId) => {
            rows.push({
                type: 'header',
                id: catId,
                name: catId,
                isCustom: false,
                standardIcon: categoryIconMap[catId],
            });
            const emojis = groupedEmojis[catId] || [];
            const emojiCount = emojis.length;
            for (let i = 0; i < emojiCount; i += COLUMN_COUNT) {
                rows.push({
                    type: 'row',
                    emojis: emojis.slice(i, i + COLUMN_COUNT),
                    isCustom: false,
                    id: catId,
                });
            }
        });

        return rows;
    }, [customCategories]);

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
        if (firstVisibleRow) {
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

            if (row.type === 'header') {
                return (
                    <Box
                        className="px-3 py-1 bg-background/95 backdrop-blur-sm z-[var(--z-effect-md)] border-b border-divider/50 flex items-center gap-2"
                        style={style}
                    >
                        {row.isCustom ? (
                            <ServerIcon
                                className="!rounded-sm !cursor-default"
                                server={
                                    {
                                        name: row.name,
                                        icon: row.icon,
                                    } as any
                                }
                                size="xs"
                            />
                        ) : (
                            <div className="w-4 h-4 flex items-center justify-center overflow-hidden">
                                <span
                                    className="scale-75 flex-shrink-0"
                                    style={getSpriteStyle(row.standardIcon)}
                                />
                            </div>
                        )}
                        <Text className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                            {row.name}
                        </Text>
                    </Box>
                );
            }

            return (
                <div className="flex px-1 items-center" style={style}>
                    {row.emojis.map((emoji) => {
                        if (row.isCustom) {
                            const customEmoji = emoji as {
                                id: string;
                                name: string;
                                url: string;
                            };
                            return (
                                <button
                                    className="w-[12.5%] aspect-square p-1.5 hover:bg-white/5 rounded transition-transform active:scale-90 flex items-center justify-center group/emoji"
                                    key={customEmoji.id}
                                    title={customEmoji.name}
                                    onClick={() =>
                                        onCustomEmojiSelect?.(customEmoji)
                                    }
                                >
                                    <img
                                        alt={customEmoji.name}
                                        className="w-full h-full object-contain group-hover/emoji:scale-110 transition-transform duration-200"
                                        src={
                                            resolveApiUrl(customEmoji.url) || ''
                                        }
                                    />
                                </button>
                            );
                        } else {
                            const standardEmoji = emoji as EmojiData;
                            return (
                                <button
                                    className="w-[12.5%] aspect-square p-1.5 hover:bg-white/5 rounded transition-transform active:scale-90 flex items-center justify-center group/emoji"
                                    key={standardEmoji.unified}
                                    title={standardEmoji.short_name}
                                    onClick={() =>
                                        onEmojiSelect(getUnicode(standardEmoji))
                                    }
                                >
                                    <span
                                        aria-label={standardEmoji.short_name}
                                        className="scale-90 group-hover/emoji:scale-110 transition-transform duration-200"
                                        style={getSpriteStyle(standardEmoji)}
                                    />
                                </button>
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
                'flex h-[380px] w-[350px] bg-background border border-divider rounded-xl shadow-2xl overflow-hidden',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {/* Sidebar */}
            <Box className="w-[44px] flex-shrink-0 flex flex-col items-center bg-bg-subtle/50 overflow-y-auto py-3 gap-2 border-r border-divider/50 scrollbar-hide shadow-inner">
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
                                        } as any
                                    }
                                    size="xs"
                                    onClick={() => handleCategoryClick(cat.id)}
                                />
                                {isActive && (
                                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                )}
                            </Box>
                        );
                    }

                    return (
                        <Button
                            className={cn(
                                'w-9 h-9 flex-shrink-0 relative group !bg-transparent',
                                isActive
                                    ? 'text-primary scale-110 !rounded-lg'
                                    : 'text-muted-foreground hover:text-foreground hover:scale-105',
                            )}
                            key={cat.id}
                            title={cat.name}
                            variant="nav"
                            onClick={() => handleCategoryClick(cat.id)}
                        >
                            <div className="w-8 h-8 p-1 flex items-center justify-center overflow-hidden">
                                <span
                                    aria-label={cat.name}
                                    className="flex-shrink-0 scale-90"
                                    style={getSpriteStyle(
                                        categoryIconMap[cat.id],
                                    )}
                                />
                            </div>
                            {isActive && (
                                <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </Button>
                    );
                })}
            </Box>

            {/* Scrolling List */}
            <Box className="flex-1 min-w-0 flex flex-col bg-background">
                <Box className="px-3 py-1.5 bg-background/80 backdrop-blur-md border-b border-divider/30 sticky top-0 z-[var(--z-content)] flex items-center justify-between h-[32px]">
                    <Text className="font-bold text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {(
                            flatRows.find(
                                (r) =>
                                    r.type === 'header' &&
                                    r.id === activeCategoryId,
                            ) as { name?: string } | undefined
                        )?.name || 'Emojis'}
                    </Text>
                </Box>
                <div className="flex-1 w-full h-full relative">
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
