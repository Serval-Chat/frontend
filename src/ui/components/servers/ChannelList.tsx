import React, { useEffect, useState } from 'react';

import { Reorder } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    Copy,
    Folder,
    FolderPlus,
    Link as LinkIcon,
    LogOut,
    Plus,
    Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { usePings } from '@/api/pings/pings.queries';
import { serversApi } from '@/api/servers/servers.api';
import { useServerDetails } from '@/api/servers/servers.queries';
import type { Category, Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    addVoiceParticipant,
    joinVoiceRoom,
    setVoiceParticipants,
} from '@/store/slices/voiceSlice';
import { ConfirmLinkModal } from '@/ui/components/common/ConfirmLinkModal';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';
import { wsMessages } from '@/ws/messages';

import { ChannelItem } from './ChannelItem';
import { CategorySettingsModal } from './modals/CategorySettingsModal';
import { ChannelSettingsModal } from './modals/ChannelSettingsModal';
import { CreateCategoryModal } from './modals/CreateCategoryModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { LeaveServerModal } from './modals/LeaveServerModal';

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
}

type ListItem =
    | { type: 'category'; id: string; data: Category }
    | { type: 'channel'; id: string; data: Channel };

interface ChannelRowProps {
    channel: Channel;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    voiceParticipants: Record<string, string[]>;
    channelPings: Record<string, number>;
    canManageChannels: boolean;
    handleChannelClick: (channel: Channel) => void;
    setSettingsChannel: (channel: Channel) => void;
    getChannelMenuItems: (channel: Channel) => ContextMenuItem[];
}

const ChannelRow: React.FC<ChannelRowProps> = ({
    channel,
    selectedServerId,
    selectedChannelId,
    voiceParticipants,
    channelPings,
    canManageChannels,
    handleChannelClick,
    setSettingsChannel,
    getChannelMenuItems,
}) => {
    const { hasPermission, isLoading, permissions } = usePermissions(
        selectedServerId,
        channel._id,
    );
    const canView = hasPermission('viewChannels');
    const canConnect = hasPermission('connect');

    // Only hide if loading is finished and canView is explicitly false
    if (!isLoading && !canView) {
        console.warn(
            `[ChannelRow] Hiding channel "${channel.name}" (${channel._id}) — viewChannels=false.`,
            {
                channelPermissionOverrides: channel.permissions,
                computedPermissions: permissions,
                serverId: selectedServerId,
            },
        );
        return null;
    }

    const isUnread =
        channel.type !== 'link' &&
        channel.lastMessageAt &&
        (!channel.lastReadAt ||
            new Date(channel.lastMessageAt) > new Date(channel.lastReadAt));

    const connectedUserIds =
        channel.type === 'voice'
            ? voiceParticipants[channel._id] || []
            : undefined;

    return (
        <ContextMenu
            className="block w-full"
            items={getChannelMenuItems(channel)}
            key={channel._id}
        >
            <ChannelItem
                connectedUserIds={connectedUserIds}
                disabled={channel.type === 'voice' && !canConnect}
                icon={channel.icon}
                isActive={selectedChannelId === channel._id}
                isUnread={!!isUnread}
                name={channel.name}
                pingCount={channelPings[channel._id]}
                type={channel.type}
                onClick={() => handleChannelClick(channel)}
                onSettingsClick={
                    canManageChannels
                        ? (e) => {
                              e.stopPropagation();
                              setSettingsChannel(channel);
                          }
                        : undefined
                }
            />
        </ContextMenu>
    );
};

/**
 * @description Renders the list of channels grouped by categories.
 */
export const ChannelList: React.FC<ChannelListProps> = ({
    channels,
    categories,
    selectedChannelId,
}) => {
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const dispatch = useAppDispatch();
    const voiceParticipants = useAppSelector(
        (state) => state.voice.voiceParticipants,
    );
    const { data: me } = useMe();
    const { data: pingsData } = usePings();

    const channelPings = React.useMemo(() => {
        const counts: Record<string, number> = {};
        pingsData?.pings.forEach((p) => {
            if (p.channelId) {
                counts[p.channelId] = (counts[p.channelId] || 0) + 1;
            }
        });
        return counts;
    }, [pingsData]);

    const [collapsedCategories, setCollapsedCategories] = useState<
        Record<string, boolean>
    >({});

    const [settingsCategory, setSettingsCategory] = useState<Category | null>(
        null,
    );
    const [settingsChannel, setSettingsChannel] = useState<Channel | null>(
        null,
    );
    const [selectedLinkChannel, setSelectedLinkChannel] =
        useState<Channel | null>(null);

    const { hasPermission, isOwner } = usePermissions(selectedServerId);
    const canManageChannels = hasPermission('manageChannels');
    const { data: server } = useServerDetails(selectedServerId);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createCategoryModalOpen, setCreateCategoryModalOpen] =
        useState(false);
    const [createCategoryId, setCreateCategoryId] = useState<string | null>(
        null,
    );
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    const [items, setItems] = useState<ListItem[]>([]);
    const [isReordering, setIsReordering] = useState(false);
    const [syncLock, setSyncLock] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        if (selectedServerId) {
            serversApi
                .getVoiceStates(selectedServerId)
                .then((states) => {
                    Object.entries(states).forEach(([channelId, userIds]) => {
                        dispatch(setVoiceParticipants({ channelId, userIds }));
                    });
                })
                .catch(() => {});
        }
    }, [selectedServerId, dispatch]);

    useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const handleMoveItemMobile = async (
        itemToMove: ListItem,
        direction: 'up' | 'down',
    ): Promise<void> => {
        if (!selectedServerId || !canManageChannels) return;

        // Find items of the same type and scope to determine who to swap with
        let siblings: ListItem[] = [];
        if (itemToMove.type === 'category') {
            siblings = items.filter((i) => i.type === 'category');
        } else {
            const channel = itemToMove.data as Channel;
            siblings = items.filter(
                (i) =>
                    i.type === 'channel' &&
                    i.data.categoryId === channel.categoryId,
            );
        }

        const currentIndex = siblings.findIndex((i) => i.id === itemToMove.id);
        const targetIndex =
            direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        const targetItem = siblings[targetIndex];

        // Optimistic UI update
        const newItems = [...items];
        if (itemToMove.type === 'category') {
            const idxA = newItems.findIndex((i) => i.id === itemToMove.id);
            const idxB = newItems.findIndex((i) => i.id === targetItem.id);
            const blockA = [
                newItems[idxA],
                ...newItems.filter(
                    (i) =>
                        i.type === 'channel' &&
                        i.data.categoryId === itemToMove.id,
                ),
            ];
            const blockB = [
                newItems[idxB],
                ...newItems.filter(
                    (i) =>
                        i.type === 'channel' &&
                        i.data.categoryId === targetItem.id,
                ),
            ];
            const minIdx = Math.min(idxA, idxB);

            const filtered = newItems.filter(
                (i) =>
                    !(
                        i.id === itemToMove.id ||
                        i.id === targetItem.id ||
                        (i.type === 'channel' &&
                            (i.data.categoryId === itemToMove.id ||
                                i.data.categoryId === targetItem.id))
                    ),
            );

            if (direction === 'up') {
                filtered.splice(minIdx, 0, ...blockA, ...blockB);
            } else {
                filtered.splice(minIdx, 0, ...blockB, ...blockA);
            }
            setItems(filtered);
        } else {
            const idxA = newItems.findIndex((i) => i.id === itemToMove.id);
            const idxB = newItems.findIndex((i) => i.id === targetItem.id);

            newItems[idxA] = items[idxB];
            newItems[idxB] = items[idxA];
            setItems(newItems);
        }

        try {
            setSyncLock(true);

            if (itemToMove.type === 'category') {
                const item1 = itemToMove.data as Category;
                const item2 = targetItem.data as Category;

                await serversApi.reorderCategories(selectedServerId, [
                    { categoryId: item1._id, position: item2.position },
                    { categoryId: item2._id, position: item1.position },
                ]);
            } else {
                const item1 = itemToMove.data as Channel;
                const item2 = targetItem.data as Channel;
                await serversApi.reorderChannels(selectedServerId, [
                    { channelId: item1._id, position: item2.position },
                    { channelId: item2._id, position: item1.position },
                ]);
            }
        } catch (error) {
            console.error('Failed to reorder items:', error);
        } finally {
            setTimeout(() => setSyncLock(false), 500);
        }
    };

    const getChannelMenuItems = (channel: Channel): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            {
                label: 'Copy Channel Link',
                icon: LinkIcon,
                onClick: () => {
                    const url = `${window.location.origin}/chat/@server/${channel.serverId}/channel/${channel._id}`;
                    void navigator.clipboard.writeText(url);
                },
            },
            {
                label: 'Copy Channel ID',
                icon: Copy,
                onClick: () => {
                    void navigator.clipboard.writeText(channel._id);
                },
            },
        ];

        if (canManageChannels) {
            items.push({
                label: 'Edit Channel',
                icon: Settings,
                onClick: () => {
                    setSettingsChannel(channel);
                },
            });

            if (isMobile) {
                // Check if it can move up/down
                const siblings = channels
                    .filter((c) => c.categoryId === channel.categoryId)
                    .sort((a, b) => a.position - b.position);
                const index = siblings.findIndex((c) => c._id === channel._id);

                items.push({ type: 'divider' });

                if (index > 0) {
                    items.push({
                        label: 'Move Up',
                        icon: ArrowUp,
                        onClick: () =>
                            void handleMoveItemMobile(
                                {
                                    type: 'channel',
                                    id: channel._id,
                                    data: channel,
                                },
                                'up',
                            ),
                    });
                }
                if (index < siblings.length - 1) {
                    items.push({
                        label: 'Move Down',
                        icon: ArrowDown,
                        onClick: () =>
                            void handleMoveItemMobile(
                                {
                                    type: 'channel',
                                    id: channel._id,
                                    data: channel,
                                },
                                'down',
                            ),
                    });
                }
            }

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
                if ('label' in opt && typeof opt.label === 'string') {
                    if (opt.label === 'Uncategorized')
                        return currentCatId !== null;
                    const targetCat = categories.find(
                        (c) => c.name === opt.label,
                    );
                    return targetCat?._id !== currentCatId;
                }
                return false;
            });

            if (availableOptions.length > 0) {
                items.push({ type: 'divider' });
                items.push({ label: 'Move to Category:', type: 'label' });
                items.push(...availableOptions);
            }
        }

        return items;
    };

    const getCategoryMenuItems = (category: Category): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            {
                label: 'Copy Category ID',
                icon: Copy,
                onClick: () => {
                    void navigator.clipboard.writeText(category._id);
                },
            },
        ];

        if (canManageChannels) {
            items.unshift({
                label: 'Edit Category',
                icon: Settings,
                onClick: () => {
                    setSettingsCategory(category);
                },
            });

            if (isMobile) {
                const siblings = [...categories].sort(
                    (a, b) => a.position - b.position,
                );
                const index = siblings.findIndex((c) => c._id === category._id);

                const moveItems: ContextMenuItem[] = [];
                if (index > 0) {
                    moveItems.push({
                        label: 'Move Up',
                        icon: ArrowUp,
                        onClick: () =>
                            void handleMoveItemMobile(
                                {
                                    type: 'category',
                                    id: category._id,
                                    data: category,
                                },
                                'up',
                            ),
                    });
                }
                if (index < siblings.length - 1) {
                    moveItems.push({
                        label: 'Move Down',
                        icon: ArrowDown,
                        onClick: () =>
                            void handleMoveItemMobile(
                                {
                                    type: 'category',
                                    id: category._id,
                                    data: category,
                                },
                                'down',
                            ),
                    });
                }

                if (moveItems.length > 0) {
                    items.splice(1, 0, { type: 'divider' }, ...moveItems);
                }
            }
        }

        return items;
    };

    const getGlobalMenuItems = (): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (canManageChannels) {
            items.push({
                label: 'Create Channel',
                icon: Plus,
                onClick: () => {
                    setCreateCategoryId(null);
                    setCreateModalOpen(true);
                },
            });
            items.push({
                label: 'Create Category',
                icon: FolderPlus,
                onClick: () => {
                    setCreateCategoryModalOpen(true);
                },
            });
        }

        if (selectedServerId) {
            if (items.length > 0) items.push({ type: 'divider' });
            items.push({
                label: 'Copy Server ID',
                icon: Copy,
                onClick: () => {
                    void navigator.clipboard.writeText(selectedServerId);
                },
            });
        }

        if (selectedServerId && !isOwner) {
            items.push({ type: 'divider' });
            items.push({
                label: 'Leave Server',
                icon: LogOut,
                variant: 'danger',
                onClick: () => setIsLeaveModalOpen(true),
            });
        }

        return items;
    };

    const navigate = useNavigate();

    const handleChannelClick = (channel: Channel): void => {
        if (activeItemId || isReordering || syncLock) return;

        if (channel.type === 'voice') {
            if (selectedServerId) {
                dispatch(
                    joinVoiceRoom({
                        serverId: selectedServerId,
                        channelId: channel._id,
                    }),
                );

                if (me?._id) {
                    dispatch(
                        addVoiceParticipant({
                            channelId: channel._id,
                            userId: me._id,
                        }),
                    );
                }
            }
            return;
        }

        if (channel.type === 'link') {
            const url = channel.link || '#';
            try {
                const parsed = new URL(url);
                if (
                    parsed.hostname === 'catfla.re' ||
                    parsed.hostname.endsWith('.catfla.re')
                ) {
                    if (parsed.pathname.startsWith('/chat/@setting')) {
                        void navigate(parsed.pathname);
                        return;
                    }
                    window.open(url, '_blank', 'noopener,noreferrer');
                    return;
                }
            } catch {
                // Ignore
            }
            setSelectedLinkChannel(channel);
            return;
        }

        if (selectedServerId) {
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${channel._id}`,
            );
        }
    };

    return (
        <ContextMenu className="flex-1" items={getGlobalMenuItems()}>
            <div className="flex min-h-full flex-col space-y-0.5 px-2 py-4">
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
                                    dragListener={
                                        canManageChannels && !isMobile
                                    }
                                    key={item.id}
                                    layout="position"
                                    value={item}
                                    onDragEnd={() => void handleDragEnd()}
                                    onDragStart={() => setActiveItemId(item.id)}
                                >
                                    <ContextMenu
                                        className="pt-4 first:pt-0"
                                        items={getCategoryMenuItems(category)}
                                    >
                                        <div
                                            className="group flex cursor-pointer items-center px-1"
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
                                                    toggleCategory(
                                                        category._id,
                                                    );
                                                }
                                            }}
                                        >
                                            <ChevronDown
                                                className={cn(
                                                    'mr-0.5 h-3 w-3 text-muted-foreground transition-transform duration-200',
                                                    isCollapsed
                                                        ? '-rotate-90'
                                                        : '',
                                                )}
                                            />
                                            <span className="flex-1 text-[12px] font-bold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground/80">
                                                {category.name}
                                            </span>
                                            {canManageChannels && (
                                                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                                    <IconButton
                                                        className="p-0.5"
                                                        icon={Settings}
                                                        iconSize={14}
                                                        title="Edit Category"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSettingsCategory(
                                                                category,
                                                            );
                                                        }}
                                                    />
                                                    <IconButton
                                                        className="p-0.5"
                                                        icon={Plus}
                                                        iconSize={14}
                                                        title="Create Channel"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCreateCategoryId(
                                                                category._id,
                                                            );
                                                            setCreateModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </ContextMenu>
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
                                    dragListener={
                                        canManageChannels && !isMobile
                                    }
                                    key={item.id}
                                    layout="position"
                                    value={item}
                                    onDragEnd={() => void handleDragEnd()}
                                    onDragStart={() => setActiveItemId(item.id)}
                                >
                                    <ChannelRow
                                        canManageChannels={canManageChannels}
                                        channel={channel}
                                        channelPings={channelPings}
                                        getChannelMenuItems={
                                            getChannelMenuItems
                                        }
                                        handleChannelClick={handleChannelClick}
                                        selectedChannelId={selectedChannelId}
                                        selectedServerId={selectedServerId}
                                        setSettingsChannel={setSettingsChannel}
                                        voiceParticipants={voiceParticipants}
                                    />
                                </Reorder.Item>
                            );
                        }
                    })}
                </Reorder.Group>

                {settingsCategory && (
                    <CategorySettingsModal
                        category={settingsCategory}
                        isOpen={!!settingsCategory}
                        onClose={() => setSettingsCategory(null)}
                    />
                )}

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

                {selectedServerId && (
                    <CreateCategoryModal
                        isOpen={createCategoryModalOpen}
                        serverId={selectedServerId}
                        onClose={() => setCreateCategoryModalOpen(false)}
                    />
                )}

                {selectedLinkChannel && (
                    <ConfirmLinkModal
                        isOpen={!!selectedLinkChannel}
                        url={selectedLinkChannel.link || '#'}
                        onClose={() => setSelectedLinkChannel(null)}
                        onConfirm={() => {
                            window.open(
                                selectedLinkChannel.link || '#',
                                '_blank',
                                'noopener,noreferrer',
                            );
                            setSelectedLinkChannel(null);
                        }}
                    />
                )}

                <LeaveServerModal
                    isOpen={isLeaveModalOpen}
                    serverId={selectedServerId || ''}
                    serverName={server?.name || ''}
                    onClose={() => setIsLeaveModalOpen(false)}
                />
            </div>
        </ContextMenu>
    );
};
