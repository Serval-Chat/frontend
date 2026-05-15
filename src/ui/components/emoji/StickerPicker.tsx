import React, { useMemo, useState } from 'react';

import { useMeasure } from 'react-use';

import type { Sticker } from '@/api/servers/servers.api';
import { useStickerInfoBox } from '@/hooks/useStickerInfoBox';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
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

export const StickerPicker: React.FC<StickerPickerProps> = ({
    onStickerSelect,
    categories,
    className,
}) => {
    const [containerRef] = useMeasure<HTMLDivElement>();
    const [activeCategoryId, setActiveCategoryId] = useState<string>(
        categories[0]?.id || '',
    );

    const {
        selectedSticker,
        infoBoxPosition,
        server,
        showStickerInfo,
        closeInfoBox,
    } = useStickerInfoBox();

    const activeCategory = useMemo(
        () => categories.find((c) => c.id === activeCategoryId),
        [categories, activeCategoryId],
    );

    return (
        <div
            className={cn(
                'relative flex h-[420px] w-[350px] overflow-hidden rounded-xl border border-divider bg-background shadow-2xl',
                className,
            )}
            ref={containerRef}
        >
            <div className="flex h-full w-full overflow-hidden">
                {/* Sidebar */}
                <Box className="scrollbar-hide flex w-[44px] flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-divider/50 bg-bg-subtle/50 py-3 shadow-inner">
                    {categories.map((cat) => {
                        const isActive = activeCategoryId === cat.id;
                        return (
                            <Box
                                className="relative flex-shrink-0"
                                key={cat.id}
                            >
                                <ServerIcon
                                    className="!rounded-lg"
                                    isActive={isActive}
                                    server={{
                                        name: cat.name,
                                        icon: cat.icon,
                                    }}
                                    size="xs"
                                    onClick={() => setActiveCategoryId(cat.id)}
                                />
                                {isActive && (
                                    <div className="absolute top-1/2 -left-3.5 h-6 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {/* Content */}
                <Box className="relative flex min-w-0 flex-1 flex-col bg-background">
                    {activeCategory ? (
                        <>
                            <Box className="sticky top-0 z-10 flex h-[40px] items-center border-b border-divider/30 bg-background/80 px-3 py-1.5 backdrop-blur-md">
                                <Heading
                                    className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                                    level={4}
                                >
                                    {activeCategory.name}
                                </Heading>
                            </Box>
                            <div className="scrollbar-thin scrollbar-thumb-divider scrollbar-track-transparent flex-1 overflow-y-auto p-3">
                                {activeCategory.stickers.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeCategory.stickers.map(
                                            (sticker) => (
                                                <Tooltip
                                                    fullWidth
                                                    content={sticker.name}
                                                    key={sticker.id}
                                                    position="top"
                                                >
                                                    <Button
                                                        className="group relative aspect-square h-auto w-full p-2 hover:bg-bg-subtle"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            onStickerSelect(
                                                                sticker,
                                                            )
                                                        }
                                                        onContextMenu={(e) =>
                                                            showStickerInfo(
                                                                {
                                                                    id: sticker.id,
                                                                    name: sticker.name,
                                                                    url: sticker.imageUrl,
                                                                    serverId:
                                                                        sticker.serverId,
                                                                },
                                                                e,
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            alt={sticker.name}
                                                            className="h-full w-full object-contain"
                                                            src={
                                                                resolveApiUrl(
                                                                    sticker.imageUrl,
                                                                ) || ''
                                                            }
                                                        />
                                                    </Button>
                                                </Tooltip>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                                        <Text variant="muted">
                                            No stickers in this server.
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <Text variant="muted">
                                Select a server to see stickers.
                            </Text>
                        </div>
                    )}
                </Box>
            </div>

            {selectedSticker && infoBoxPosition && (
                <StickerInfoBox
                    position={infoBoxPosition}
                    server={server}
                    sticker={selectedSticker}
                    onClose={closeInfoBox}
                />
            )}
        </div>
    );
};
