import React, { useCallback, useMemo, useState } from 'react';

import { Reorder } from 'framer-motion';
import { ChevronDown, Copy, Folder } from 'lucide-react';

import { serversApi } from '@/api/servers/servers.api';
import type { Category, Channel } from '@/api/servers/servers.types';
import { useAppSelector } from '@/store/hooks';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { cn } from '@/utils/cn';

import { ChannelItem } from './ChannelItem';

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
    onChannelSelect: (channelId: string) => void;
}

/**
 * @description Renders a list of channels grouped by categories with contexts for reordering said channels
 */
export const ChannelList: React.FC<ChannelListProps> = ({
    channels,
    categories,
    selectedChannelId,
    onChannelSelect,
}) => {
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );

    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
        new Set(),
    );

    // initial sort
    const initialSortedChannels = useMemo(
        () => [...channels].sort((a, b) => a.position - b.position),
        [channels],
    );

    // group channels by categoryId
    const channelsByCategory = useMemo(
        () =>
            initialSortedChannels.reduce(
                (acc, channel) => {
                    const catId = channel.categoryId || 'uncategorized';
                    if (!acc[catId]) acc[catId] = [];
                    acc[catId].push(channel);
                    return acc;
                },
                {} as Record<string, Channel[]>,
            ),
        [initialSortedChannels],
    );

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.position - b.position),
        [categories],
    );

    const toggleCategory = (categoryId: string): void => {
        setCollapsedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const handleReorder = useCallback(
        async (reorderedChannels: Channel[]) => {
            if (!selectedServerId) return;

            const positions = reorderedChannels.map((ch, idx) => ({
                channelId: ch._id,
                position: idx,
            }));

            try {
                await serversApi.reorderChannels(selectedServerId, positions);
            } catch (error) {
                console.error('Failed to reorder channels:', error);
            }
        },
        [selectedServerId],
    );

    const onReorder = (newOrder: Channel[]): void => {
        void handleReorder(newOrder);
    };

    const handleMoveToCategory = async (
        channelId: string,
        categoryId: string | null,
    ): Promise<void> => {
        if (!selectedServerId) return;

        try {
            await serversApi.updateChannel(selectedServerId, channelId, {
                categoryId,
            });
        } catch (error) {
            console.error('Failed to move channel to category:', error);
        }
    };

    const getChannelMenuItems = (channel: Channel): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            {
                label: 'Copy Channel ID',
                icon: Copy,
                onClick: () => {
                    void navigator.clipboard.writeText(channel._id);
                },
            },
        ];

        // Move to Category options
        const moveOptions: ContextMenuItem[] = [
            {
                label: 'Uncategorized',
                icon: Folder,
                onClick: () => void handleMoveToCategory(channel._id, null),
            },
            ...sortedCategories.map((cat) => ({
                label: cat.name,
                icon: Folder,
                onClick: () => void handleMoveToCategory(channel._id, cat._id),
            })),
        ];

        // Filter out current category
        const currentCatId = channel.categoryId || null;
        const availableOptions = moveOptions.filter((opt) => {
            if (opt.type === 'divider') return false;
            if (opt.label === 'Uncategorized') return currentCatId !== null;
            const targetCat = sortedCategories.find(
                (c) => c.name === opt.label,
            );
            return targetCat?._id !== currentCatId;
        });

        if (availableOptions.length > 0) {
            if (items.length > 0) {
                items.push({ type: 'divider' });
            }
            items.push({ label: 'Move to Category:', type: 'label' });
            items.push(...availableOptions);
        }

        return items;
    };

    const renderChannel = (channel: Channel): React.ReactNode => (
        <ContextMenu items={getChannelMenuItems(channel)} key={channel._id}>
            <ChannelItem
                icon={channel.icon}
                isActive={selectedChannelId === channel._id}
                name={channel.name}
                type={channel.type}
                onClick={() => onChannelSelect(channel._id)}
            />
        </ContextMenu>
    );

    return (
        <div className="flex flex-col px-2 space-y-4 py-4">
            {/* Uncategorized channels first */}
            <Reorder.Group
                axis="y"
                className="space-y-0.5"
                values={channelsByCategory['uncategorized'] || []}
                onReorder={(newOrder) => onReorder(newOrder)}
            >
                {channelsByCategory['uncategorized']?.map((channel) => (
                    <Reorder.Item key={channel._id} value={channel}>
                        {renderChannel(channel)}
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {sortedCategories.map((category) => {
                const isCollapsed = collapsedCategories.has(category._id);
                const categoryChannels = channelsByCategory[category._id] || [];

                return (
                    <div className="space-y-1" key={category._id}>
                        <div
                            className="flex items-center px-1 group cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleCategory(category._id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    toggleCategory(category._id);
                                }
                            }}
                        >
                            <ChevronDown
                                className={cn(
                                    'w-3 h-3 mr-0.5 text-foreground-muted transition-transform duration-200',
                                    isCollapsed ? '-rotate-90' : '',
                                )}
                            />
                            <span className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider group-hover:text-foreground/80 transition-colors">
                                {category.name}
                            </span>
                        </div>
                        {!isCollapsed && (
                            <Reorder.Group
                                axis="y"
                                className="space-y-0.5"
                                values={categoryChannels}
                                onReorder={(newOrder) => onReorder(newOrder)}
                            >
                                {categoryChannels.map((channel) => (
                                    <Reorder.Item
                                        key={channel._id}
                                        value={channel}
                                    >
                                        {renderChannel(channel)}
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
