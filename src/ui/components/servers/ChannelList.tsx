import React, { useEffect, useState } from 'react';

import { Reorder } from 'framer-motion';
import { ChevronDown, Copy, Folder, Plus, Settings } from 'lucide-react';

import { serversApi } from '@/api/servers/servers.api';
import type { Category, Channel } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppSelector } from '@/store/hooks';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';
import { wsMessages } from '@/ws/messages';

import { ChannelItem } from './ChannelItem';
import { ChannelSettingsModal } from './modals/ChannelSettingsModal';
import { CreateChannelModal } from './modals/CreateChannelModal';

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
    onChannelSelect: (channelId: string) => void;
}

type ListItem =
    | { type: 'category'; id: string; data: Category }
    | { type: 'channel'; id: string; data: Channel };

/**
 * @description Renders the list of channels grouped by categories.
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

    const [collapsedCategories, setCollapsedCategories] = useState<
        Record<string, boolean>
    >({});

    const [settingsChannel, setSettingsChannel] = useState<Channel | null>(
        null,
    );

    const { hasPermission } = usePermissions(selectedServerId);
    const canManageChannels = hasPermission('manageChannels');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createCategoryId, setCreateCategoryId] = useState<string | null>(
        null,
    );

    const [items, setItems] = useState<ListItem[]>([]);
    const [isReordering, setIsReordering] = useState(false);
    const [syncLock, setSyncLock] = useState(false);

    // Sync items when props change (only when not reordering and not locked)
    useEffect(() => {
        if (isReordering || syncLock) return;

        const sortedCategories = [...categories].sort(
            (a, b) => a.position - b.position,
        );
        const sortedChannels = [...channels].sort(
            (a, b) => a.position - b.position,
        );

        const newList: ListItem[] = [];

        // Add uncategorized channels
        const uncategorized = sortedChannels.filter((c) => !c.categoryId);
        uncategorized.forEach((c) =>
            newList.push({ type: 'channel', id: c._id, data: c }),
        );

        // Add categories and their channels
        sortedCategories.forEach((cat) => {
            newList.push({ type: 'category', id: cat._id, data: cat });
            const catChannels = sortedChannels.filter(
                (c) => c.categoryId === cat._id,
            );
            catChannels.forEach((c) =>
                newList.push({ type: 'channel', id: c._id, data: c }),
            );
        });

        setItems(newList);
    }, [categories, channels, isReordering, syncLock]);

    // Mark channel as read when opened
    useEffect(() => {
        if (!selectedChannelId || !selectedServerId) return;

        const channel = channels.find((c) => c._id === selectedChannelId);
        if (!channel) return;

        const isUnread =
            channel.lastMessageAt &&
            (!channel.lastReadAt ||
                new Date(channel.lastMessageAt) > new Date(channel.lastReadAt));

        if (isUnread) {
            wsMessages.markChannelRead(selectedServerId, selectedChannelId);
        }
    }, [selectedChannelId, selectedServerId, channels]);

    const toggleCategory = (categoryId: string): void => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const handleReorder = (newItems: ListItem[]): void => {
        setIsReordering(true);

        // If a category is being dragged, move its children with it
        const activeItem = items.find((i) => i.id === activeItemId);
        if (activeItem?.type === 'category') {
            const categoryId = activeItem.id;

            const childrenItems = items.filter(
                (i) => i.type === 'channel' && i.data.categoryId === categoryId,
            );

            if (childrenItems.length > 0) {
                const childrenIds = new Set(childrenItems.map((i) => i.id));
                const newCategoryIndex = newItems.findIndex(
                    (i) => i.id === categoryId,
                );

                const updatedItems = newItems.filter(
                    (i) => !childrenIds.has(i.id),
                );
                updatedItems.splice(newCategoryIndex + 1, 0, ...childrenItems);

                setItems(updatedItems);
                return;
            }
        }

        setItems(newItems);
    };

    const handleDragEnd = async (): Promise<void> => {
        if (!selectedServerId || !canManageChannels) {
            setIsReordering(false);
            return;
        }

        try {
            const channelUpdates: {
                id: string;
                updates: Partial<Channel>;
            }[] = [];
            const categoryPositions: {
                categoryId: string;
                position: number;
            }[] = [];
            const channelPositions: { channelId: string; position: number }[] =
                [];

            let currentCategoryId: string | null = null;
            let channelPos = 0;
            let categoryPos = 0;

            items.forEach((item) => {
                if (item.type === 'category') {
                    currentCategoryId = item.id;
                    categoryPositions.push({
                        categoryId: item.id,
                        position: categoryPos++,
                    });
                } else {
                    const channel = item.data;
                    if (channel.categoryId !== currentCategoryId) {
                        channelUpdates.push({
                            id: channel._id,
                            updates: { categoryId: currentCategoryId },
                        });
                    }
                    channelPositions.push({
                        channelId: channel._id,
                        position: channelPos++,
                    });
                }
            });

            // Parallel updates
            const promises: Promise<unknown>[] = [];

            // Update category IDs if changed
            channelUpdates.forEach((update) => {
                promises.push(
                    serversApi.updateChannel(
                        selectedServerId,
                        update.id,
                        update.updates,
                    ),
                );
            });

            // Reorder channels
            if (channelPositions.length > 0) {
                promises.push(
                    serversApi.reorderChannels(
                        selectedServerId,
                        channelPositions,
                    ),
                );
            }

            // Reorder categories
            if (categoryPositions.length > 0) {
                promises.push(
                    serversApi.reorderCategories(
                        selectedServerId,
                        categoryPositions,
                    ),
                );
            }

            await Promise.all(promises);
        } catch (error) {
            console.error('Failed to reorder:', error);
            setIsReordering(false);
        } finally {
            setIsReordering(false);
            setActiveItemId(null);
            setSyncLock(true);
            setTimeout(() => setSyncLock(false), 500);
        }
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
            {
                label: 'Edit Channel',
                icon: Settings,
                onClick: () => {
                    setSettingsChannel(channel);
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
            ...[...categories]
                .sort((a, b) => a.position - b.position)
                .map((cat) => ({
                    label: cat.name,
                    icon: Folder,
                    onClick: () =>
                        void handleMoveToCategory(channel._id, cat._id),
                })),
        ];

        // Filter out current category
        const currentCatId = channel.categoryId || null;
        const availableOptions = moveOptions.filter((opt) => {
            if (opt.type === 'divider') return false;
            if (opt.label === 'Uncategorized') return currentCatId !== null;
            const targetCat = categories.find((c) => c.name === opt.label);
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

    const renderChannel = (channel: Channel): React.ReactNode => {
        const isUnread =
            channel.lastMessageAt &&
            (!channel.lastReadAt ||
                new Date(channel.lastMessageAt) > new Date(channel.lastReadAt));

        return (
            <ContextMenu
                className="block w-full"
                items={getChannelMenuItems(channel)}
                key={channel._id}
            >
                <ChannelItem
                    icon={channel.icon}
                    isActive={selectedChannelId === channel._id}
                    isUnread={!!isUnread}
                    name={channel.name}
                    type={channel.type}
                    onClick={() => onChannelSelect(channel._id)}
                />
            </ContextMenu>
        );
    };

    return (
        <ContextMenu
            className="flex-1"
            items={
                canManageChannels
                    ? [
                          {
                              label: 'Create Channel',
                              icon: Plus,
                              onClick: () => {
                                  setCreateCategoryId(null);
                                  setCreateModalOpen(true);
                              },
                          },
                      ]
                    : []
            }
        >
            <div className="flex flex-col px-2 space-y-0.5 py-4 min-h-full">
                <Reorder.Group
                    axis="y"
                    className="space-y-0.5"
                    values={items}
                    onReorder={handleReorder}
                >
                    {items.map((item) => {
                        if (item.type === 'category') {
                            const category = item.data;
                            const isCollapsed =
                                collapsedCategories[category._id];

                            return (
                                <Reorder.Item
                                    className="pt-4 first:pt-0"
                                    key={item.id}
                                    value={item}
                                    onDragEnd={() => void handleDragEnd()}
                                    onDragStart={() => setActiveItemId(item.id)}
                                >
                                    <div
                                        className="flex items-center px-1 group cursor-pointer"
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategory(category._id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                toggleCategory(category._id);
                                            }
                                        }}
                                    >
                                        <ChevronDown
                                            className={cn(
                                                'w-3 h-3 mr-0.5 text-muted-foreground transition-transform duration-200',
                                                isCollapsed ? '-rotate-90' : '',
                                            )}
                                        />
                                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground/80 transition-colors flex-1">
                                            {category.name}
                                        </span>
                                        {canManageChannels && (
                                            <IconButton
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                                icon={Plus}
                                                iconSize={14}
                                                title="Create Channel"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCreateCategoryId(
                                                        category._id,
                                                    );
                                                    setCreateModalOpen(true);
                                                }}
                                            />
                                        )}
                                    </div>
                                </Reorder.Item>
                            );
                        } else {
                            const channel = item.data;
                            const isCollapsed = channel.categoryId
                                ? collapsedCategories[channel.categoryId]
                                : false;

                            if (isCollapsed) return null;

                            return (
                                <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    onDragEnd={() => void handleDragEnd()}
                                    onDragStart={() => setActiveItemId(item.id)}
                                >
                                    {renderChannel(channel)}
                                </Reorder.Item>
                            );
                        }
                    })}
                </Reorder.Group>

                {settingsChannel && (
                    <ChannelSettingsModal
                        channel={settingsChannel}
                        isOpen={!!settingsChannel}
                        onClose={() => setSettingsChannel(null)}
                    />
                )}

                {selectedServerId && (
                    <CreateChannelModal
                        categoryId={createCategoryId}
                        isOpen={createModalOpen}
                        serverId={selectedServerId}
                        onClose={() => {
                            setCreateModalOpen(false);
                            setCreateCategoryId(null);
                        }}
                    />
                )}
            </div>
        </ContextMenu>
    );
};
