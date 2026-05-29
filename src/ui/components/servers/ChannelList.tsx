import React, { useCallback, useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import { Reorder } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    Copy,
    Folder,
    FolderPlus,
    GripVertical,
    Link as LinkIcon,
    LogOut,
    PanelBottomOpen,
    PanelLeftOpen,
    PanelRightOpen,
    PanelTopOpen,
    Plus,
    Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS, PREFETCH_LIMIT } from '@/api/chat/chat.queries';
import { usePings } from '@/api/pings/pings.queries';
import { serversApi } from '@/api/servers/servers.api';
import {
    useServerDetails,
    useVoiceStates,
} from '@/api/servers/servers.queries';
import type { Category, Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSplitViewPane } from '@/store/slices/navSlice';
import { addVoiceParticipant, joinVoiceRoom } from '@/store/slices/voiceSlice';
import { ConfirmLinkModal } from '@/ui/components/common/ConfirmLinkModal';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';
import { wsMessages } from '@/ws/messages';

import { ChannelItem } from './ChannelItem';

const CategorySettingsModal = React.lazy(() =>
    import('./modals/CategorySettingsModal').then((m) => ({
        default: m.CategorySettingsModal,
    })),
);

const ChannelSettingsModal = React.lazy(() =>
    import('./modals/ChannelSettingsModal').then((m) => ({
        default: m.ChannelSettingsModal,
    })),
);

const CreateCategoryModal = React.lazy(() =>
    import('./modals/CreateCategoryModal').then((m) => ({
        default: m.CreateCategoryModal,
    })),
);

const CreateChannelModal = React.lazy(() =>
    import('./modals/CreateChannelModal').then((m) => ({
        default: m.CreateChannelModal,
    })),
);

const LeaveServerModal = React.lazy(() =>
    import('./modals/LeaveServerModal').then((m) => ({
        default: m.LeaveServerModal,
    })),
);

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    hiddenChannelIds?: string[];
    hiddenCategoryIds?: string[];
}

type ListItem =
    | { type: 'category'; id: string; data: Category }
    | { type: 'channel'; id: string; data: Channel };

type VirtualListItem = ListItem & { virtualRow: VirtualItem };

interface ChannelRowProps {
    channel: Channel;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    connectedUserIds: string[] | undefined;
    channelPings: Record<string, number>;
    canManageChannels: boolean;
    handleChannelClick: (channel: Channel) => void;
    setSettingsChannel: (channel: Channel) => void;
    getChannelMenuItems: (channel: Channel) => ContextMenuItem[];
}

const ChannelRow = React.memo(
    ({
        channel,
        selectedServerId,
        selectedChannelId,
        connectedUserIds,
        channelPings,
        canManageChannels,
        handleChannelClick,
        setSettingsChannel,
        getChannelMenuItems,
    }: ChannelRowProps) => {
        const queryClient = useQueryClient();
        const { hasPermission, isLoading, permissions } = usePermissions(
            selectedServerId,
            channel._id,
        );
        const canView = hasPermission('viewChannels');
        const canConnect = hasPermission('connect');

        const handleMouseEnter = React.useCallback((): void => {
            if (channel.type !== 'text' || !selectedServerId) return;

            void queryClient.prefetchInfiniteQuery({
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    selectedServerId,
                    channel._id,
                    null,
                ),
                queryFn: ({ pageParam }) =>
                    chatApi.getChannelMessages(
                        selectedServerId,
                        channel._id,
                        PREFETCH_LIMIT,
                        pageParam as string | undefined,
                    ),
                initialPageParam: undefined,
                staleTime: Infinity,
            });
        }, [queryClient, selectedServerId, channel._id, channel.type]);

        // Only hide if loading is finished and canView is explicitly false
        if (!isLoading && !canView) {
            console.warn(
                `[ChannelRow] Hiding channel "${channel.name}" (${channel._id}) - viewChannels=false.`,
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

        return (
            <ContextMenu
                className="block w-full"
                items={getChannelMenuItems(channel)}
                key={channel._id}
            >
                <ChannelItem
                    connectedUserIds={connectedUserIds}
                    disabled={channel.type === 'voice' && !canConnect}
                    emoji={channel.emoji}
                    emojiType={channel.emojiType}
                    icon={channel.icon}
                    isActive={selectedChannelId === channel._id}
                    isUnread={!!isUnread}
                    name={channel.name}
                    pingCount={channelPings[channel._id]}
                    type={channel.type}
                    onClick={(): void => handleChannelClick(channel)}
                    onMouseEnter={handleMouseEnter}
                    onSettingsClick={
                        canManageChannels
                            ? (e): void => {
                                  e.stopPropagation();
                                  setSettingsChannel(channel);
                              }
                            : undefined
                    }
                />
            </ContextMenu>
        );
    },
);

ChannelRow.displayName = 'ChannelRow';

/**
 * @description Renders the list of channels grouped by categories.
 */
export const ChannelList = ({
    channels,
    categories,
    selectedChannelId,
    scrollRef,
    hiddenChannelIds = [],
    hiddenCategoryIds = [],
}: ChannelListProps) => {
    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const dispatch = useAppDispatch();
    const voiceParticipants = useAppSelector(
        (state): Record<string, string[]> => state.voice.voiceParticipants,
    );
    const { data: me } = useMe();
    const { data: pingsData } = usePings();

    const channelPings = React.useMemo((): Record<string, number> => {
        const counts: Record<string, number> = {};
        pingsData?.pings.forEach((p): void => {
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

    useVoiceStates(selectedServerId);

    const existingCategoryIds = React.useMemo(
        (): Set<string> => new Set(categories.map((cat): string => cat._id)),
        [categories],
    );
    const hiddenChannels = React.useMemo(
        (): Set<string> => new Set(hiddenChannelIds),
        [hiddenChannelIds],
    );
    const hiddenCategories = React.useMemo(
        (): Set<string> => new Set(hiddenCategoryIds),
        [hiddenCategoryIds],
    );

    useEffect((): (() => void) => {
        const handleResize = (): void => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return (): void => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync items when props change
    useEffect((): void => {
        if (isReordering || syncLock) return;

        const visibleCategories = categories.filter(
            (category): boolean => !hiddenCategories.has(category._id),
        );
        const visibleChannels = channels.filter((channel): boolean => {
            if (hiddenChannels.has(channel._id)) return false;
            if (
                channel.categoryId &&
                hiddenCategories.has(channel.categoryId)
            ) {
                return false;
            }
            return true;
        });

        const sortedCategories = [...visibleCategories].sort(
            (a, b): number => a.position - b.position,
        );
        const sortedChannels = [...visibleChannels].sort(
            (a, b): number => a.position - b.position,
        );

        const newList: ListItem[] = [];

        const uncategorized = sortedChannels.filter(
            (c): boolean =>
                !c.categoryId || !existingCategoryIds.has(c.categoryId),
        );
        uncategorized.forEach((c): number =>
            newList.push({ type: 'channel', id: c._id, data: c }),
        );

        // Add categories and their channels
        sortedCategories.forEach((cat): void => {
            newList.push({ type: 'category', id: cat._id, data: cat });
            const catChannels = sortedChannels.filter(
                (c): boolean => c.categoryId === cat._id,
            );
            catChannels.forEach((c): number =>
                newList.push({ type: 'channel', id: c._id, data: c }),
            );
        });

        setItems(newList);
    }, [
        categories,
        channels,
        isReordering,
        syncLock,
        existingCategoryIds,
        hiddenChannels,
        hiddenCategories,
    ]);

    // Mark channel as read when opened
    useEffect((): void => {
        if (!selectedChannelId || !selectedServerId) return;

        const channel = channels.find(
            (c): boolean => c._id === selectedChannelId,
        );
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
        setCollapsedCategories((prev): { [x: string]: boolean } => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const visibleItems = React.useMemo(
        (): ListItem[] =>
            items.filter((item): boolean => {
                if (
                    item.type === 'channel' &&
                    item.data.categoryId &&
                    existingCategoryIds.has(item.data.categoryId)
                ) {
                    return !collapsedCategories[item.data.categoryId];
                }
                return true;
            }),
        [items, collapsedCategories, existingCategoryIds],
    );

    const rowVirtualizer = useVirtualizer({
        count: visibleItems.length,
        getScrollElement: (): HTMLDivElement | null => scrollRef.current,
        estimateSize: useCallback(
            (index: number): number => {
                const item = visibleItems[index];
                if (!item) return 0;
                if (item.type === 'category') return 32;
                if (item.type === 'channel' && item.data.type === 'voice') {
                    const participants = voiceParticipants[item.id] || [];
                    return 32 + participants.length * 28;
                }
                return 32;
            },
            [visibleItems, voiceParticipants],
        ),
        measureElement: (el): number => el.getBoundingClientRect().height,
        overscan: 10,
    });

    const handleReorder = (newVisibleItems: ListItem[]): void => {
        setIsReordering(true);

        const activeItem = items.find((i): boolean => i.id === activeItemId);
        let updatedVisible = [...newVisibleItems];

        if (activeItem?.type === 'category') {
            const categoryId = activeItem.id;
            const visibleChildren = items.filter(
                (i): boolean =>
                    i.type === 'channel' &&
                    i.data.categoryId === categoryId &&
                    !collapsedCategories[categoryId],
            );

            if (visibleChildren.length > 0) {
                const childIds = new Set(
                    visibleChildren.map((c): string => c.id),
                );
                const newCategoryIndex = updatedVisible.findIndex(
                    (i): boolean => i.id === categoryId,
                );

                updatedVisible = updatedVisible.filter(
                    (i): boolean => !childIds.has(i.id),
                );
                updatedVisible.splice(
                    newCategoryIndex + 1,
                    0,
                    ...visibleChildren,
                );
            }
        }

        const fullNewList: ListItem[] = [];
        updatedVisible.forEach((item): void => {
            fullNewList.push(item);
            if (item.type === 'category') {
                const hiddenChildren = items.filter(
                    (i): boolean =>
                        i.type === 'channel' &&
                        i.data.categoryId === item.id &&
                        collapsedCategories[item.id],
                );
                fullNewList.push(...hiddenChildren);
            }
        });

        setItems(fullNewList);
    };

    const handleDragEnd = React.useCallback(async (): Promise<void> => {
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

            items.forEach((item): void => {
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
            channelUpdates.forEach((update): void => {
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
            setTimeout((): void => setSyncLock(false), 500);
        }
    }, [selectedServerId, canManageChannels, items]);

    const handleDragStartItem = React.useCallback((id: string): void => {
        setActiveItemId(id);
        setIsReordering(true);
    }, []);

    const handleMoveToCategory = React.useCallback(
        async (channelId: string, categoryId: string | null): Promise<void> => {
            if (!selectedServerId) return;

            try {
                await serversApi.updateChannel(selectedServerId, channelId, {
                    categoryId,
                });
            } catch (error) {
                console.error('Failed to move channel to category:', error);
            }
        },
        [selectedServerId],
    );

    const handleMoveItemMobile = React.useCallback(
        async (
            itemToMove: ListItem,
            direction: 'up' | 'down',
        ): Promise<void> => {
            if (!selectedServerId || !canManageChannels) return;

            // Find items of the same type and scope to determine who to swap with
            let siblings: ListItem[] = [];
            if (itemToMove.type === 'category') {
                siblings = items.filter((i): boolean => i.type === 'category');
            } else {
                const channel = itemToMove.data as Channel;
                siblings = items.filter(
                    (i): boolean =>
                        i.type === 'channel' &&
                        i.data.categoryId === channel.categoryId,
                );
            }

            const currentIndex = siblings.findIndex(
                (i): boolean => i.id === itemToMove.id,
            );
            const targetIndex =
                direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (targetIndex < 0 || targetIndex >= siblings.length) return;

            const targetItem = siblings[targetIndex];

            // Optimistic UI update
            const newItems = [...items];
            if (itemToMove.type === 'category') {
                const idxA = newItems.findIndex(
                    (i): boolean => i.id === itemToMove.id,
                );
                const idxB = newItems.findIndex(
                    (i): boolean => i.id === targetItem.id,
                );
                const blockA = [
                    newItems[idxA],
                    ...newItems.filter(
                        (i): boolean =>
                            i.type === 'channel' &&
                            i.data.categoryId === itemToMove.id,
                    ),
                ];
                const blockB = [
                    newItems[idxB],
                    ...newItems.filter(
                        (i): boolean =>
                            i.type === 'channel' &&
                            i.data.categoryId === targetItem.id,
                    ),
                ];
                const minIdx = Math.min(idxA, idxB);

                const filtered = newItems.filter(
                    (i): boolean =>
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
                const idxA = newItems.findIndex(
                    (i): boolean => i.id === itemToMove.id,
                );
                const idxB = newItems.findIndex(
                    (i): boolean => i.id === targetItem.id,
                );

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
                setTimeout((): void => setSyncLock(false), 500);
            }
        },
        [selectedServerId, canManageChannels, items],
    );

    const channelsRef = React.useRef(channels);
    const categoriesRef = React.useRef(categories);

    React.useEffect((): void => {
        channelsRef.current = channels;
        categoriesRef.current = categories;
    }, [channels, categories]);

    const getChannelMenuItems = React.useCallback(
        (channel: Channel): ContextMenuItem[] => {
            const items: ContextMenuItem[] = [
                {
                    label: 'Copy Channel Link',
                    icon: LinkIcon,
                    onClick: (): void => {
                        const url = `${window.location.origin}/chat/@server/${channel.serverId}/channel/${channel._id}`;
                        void navigator.clipboard.writeText(url);
                    },
                },
                {
                    label: 'Copy Channel ID',
                    icon: Copy,
                    onClick: (): void => {
                        void navigator.clipboard.writeText(channel._id);
                    },
                },
            ];

            if (channel.type === 'text') {
                items.push({ type: 'divider' });
                items.push({
                    label: 'Add to Split View',
                    type: 'submenu',
                    items: [
                        {
                            label: isMobile ? 'Top Pane' : 'Left Side',
                            icon: isMobile ? PanelTopOpen : PanelLeftOpen,
                            onClick: (): void => {
                                dispatch(
                                    setSplitViewPane({
                                        side: 'left',
                                        conversation: {
                                            type: 'channel',
                                            serverId: channel.serverId,
                                            channelId: channel._id,
                                        },
                                    }),
                                );
                            },
                        },
                        {
                            label: isMobile ? 'Bottom Pane' : 'Right Side',
                            icon: isMobile ? PanelBottomOpen : PanelRightOpen,
                            onClick: (): void => {
                                dispatch(
                                    setSplitViewPane({
                                        side: 'right',
                                        conversation: {
                                            type: 'channel',
                                            serverId: channel.serverId,
                                            channelId: channel._id,
                                        },
                                    }),
                                );
                            },
                        },
                    ],
                });
            }

            if (canManageChannels) {
                items.push({
                    label: 'Edit Channel',
                    icon: Settings,
                    onClick: (): void => {
                        setSettingsChannel(channel);
                    },
                });

                if (isMobile) {
                    // Check if it can move up/down
                    const siblings = channelsRef.current
                        .filter(
                            (c): boolean => c.categoryId === channel.categoryId,
                        )
                        .sort((a, b): number => a.position - b.position);
                    const index = siblings.findIndex(
                        (c): boolean => c._id === channel._id,
                    );

                    items.push({ type: 'divider' });

                    if (index > 0) {
                        items.push({
                            label: 'Move Up',
                            icon: ArrowUp,
                            onClick: (): undefined =>
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
                            onClick: (): undefined =>
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
                        onClick: (): undefined =>
                            void handleMoveToCategory(channel._id, null),
                    },
                    ...[...categoriesRef.current]
                        .sort((a, b): number => a.position - b.position)
                        .map((cat) => ({
                            label: cat.name,
                            icon: Folder,
                            onClick: (): undefined =>
                                void handleMoveToCategory(channel._id, cat._id),
                        })),
                ];

                // Filter out current category
                const currentCatId = channel.categoryId || null;
                const availableOptions = moveOptions.filter((opt): boolean => {
                    if ('label' in opt && typeof opt.label === 'string') {
                        if (opt.label === 'Uncategorized')
                            return currentCatId !== null;
                        const targetCat = categoriesRef.current.find(
                            (c): boolean => c.name === opt.label,
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
        },
        [
            canManageChannels,
            dispatch,
            isMobile,
            handleMoveItemMobile,
            handleMoveToCategory,
        ],
    );

    const getCategoryMenuItems = React.useCallback(
        (category: Category): ContextMenuItem[] => {
            const items: ContextMenuItem[] = [
                {
                    label: 'Copy Category ID',
                    icon: Copy,
                    onClick: (): void => {
                        void navigator.clipboard.writeText(category._id);
                    },
                },
            ];

            if (canManageChannels) {
                items.unshift({
                    label: 'Edit Category',
                    icon: Settings,
                    onClick: (): void => {
                        setSettingsCategory(category);
                    },
                });

                if (isMobile) {
                    const siblings = [...categoriesRef.current].sort(
                        (a, b): number => a.position - b.position,
                    );
                    const index = siblings.findIndex(
                        (c): boolean => c._id === category._id,
                    );

                    const moveItems: ContextMenuItem[] = [];
                    if (index > 0) {
                        moveItems.push({
                            label: 'Move Up',
                            icon: ArrowUp,
                            onClick: (): undefined =>
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
                            onClick: (): undefined =>
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
        },
        [canManageChannels, isMobile, handleMoveItemMobile],
    );

    const getGlobalMenuItems = React.useCallback((): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (canManageChannels) {
            items.push({
                label: 'Create Channel',
                icon: Plus,
                onClick: (): void => {
                    setCreateCategoryId(null);
                    setCreateModalOpen(true);
                },
            });
            items.push({
                label: 'Create Category',
                icon: FolderPlus,
                onClick: (): void => {
                    setCreateCategoryModalOpen(true);
                },
            });
        }

        if (selectedServerId) {
            if (items.length > 0) items.push({ type: 'divider' });
            items.push({
                label: 'Copy Server ID',
                icon: Copy,
                onClick: (): void => {
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
                onClick: (): void => setIsLeaveModalOpen(true),
            });
        }

        return items;
    }, [canManageChannels, selectedServerId, isOwner]);

    const navigate = useNavigate();

    const handleChannelClick = React.useCallback(
        (channel: Channel): void => {
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
                            React.startTransition((): void => {
                                void navigate(parsed.pathname);
                            });
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
                React.startTransition((): void => {
                    void navigate(
                        `/chat/@server/${selectedServerId}/channel/${channel._id}`,
                    );
                });
            }
        },
        [
            activeItemId,
            isReordering,
            syncLock,
            selectedServerId,
            dispatch,
            me?._id,
            navigate,
        ],
    );

    return (
        <ContextMenu className="flex-1" items={getGlobalMenuItems()}>
            <div className="flex min-h-full flex-col space-y-0.5 px-2">
                <Reorder.Group
                    axis="y"
                    className="relative space-y-0.5"
                    style={{
                        height: isReordering
                            ? 'auto'
                            : `${rowVirtualizer.getTotalSize()}px`,
                    }}
                    values={visibleItems}
                    onReorder={handleReorder}
                >
                    {(isReordering
                        ? visibleItems
                        : rowVirtualizer.getVirtualItems().map(
                              (v): VirtualListItem =>
                                  ({
                                      ...visibleItems[v.index],
                                      virtualRow: v,
                                  }) as VirtualListItem,
                          )
                    ).map((itemOrVirtual): React.ReactNode => {
                        const item: ListItem =
                            'virtualRow' in itemOrVirtual
                                ? (itemOrVirtual as VirtualListItem)
                                : itemOrVirtual;
                        const virtualRow: VirtualItem | null =
                            'virtualRow' in itemOrVirtual
                                ? (itemOrVirtual as VirtualListItem).virtualRow
                                : null;

                        const renderContent = (): React.ReactNode => {
                            if (item.type === 'category') {
                                const category = item.data;
                                const isCollapsed =
                                    collapsedCategories[category._id];

                                return (
                                    <Reorder.Item
                                        className="m-0 w-full p-0"
                                        dragListener={
                                            canManageChannels && !isMobile
                                        }
                                        key={item.id}
                                        layout={
                                            virtualRow ? undefined : 'position'
                                        }
                                        ref={
                                            virtualRow
                                                ? rowVirtualizer.measureElement
                                                : undefined
                                        }
                                        style={
                                            virtualRow
                                                ? {
                                                      position: 'absolute',
                                                      top: `${virtualRow.start}px`,
                                                      left: 0,
                                                      width: '100%',
                                                  }
                                                : {}
                                        }
                                        value={item}
                                        whileDrag={{
                                            scale: 1.02,
                                            backgroundColor:
                                                'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '4px',
                                        }}
                                        onDragEnd={(): void => {
                                            void handleDragEnd();
                                        }}
                                        onDragStart={(): void =>
                                            handleDragStartItem(item.id)
                                        }
                                    >
                                        <ContextMenu
                                            className="m-0 w-full p-0 pt-3"
                                            items={getCategoryMenuItems(
                                                category,
                                            )}
                                        >
                                            <div
                                                className="group flex cursor-pointer items-center px-1 select-none"
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e): void => {
                                                    e.stopPropagation();
                                                    toggleCategory(
                                                        category._id,
                                                    );
                                                }}
                                                onKeyDown={(e): void => {
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
                                                <div className="flex flex-1 items-center overflow-hidden">
                                                    {canManageChannels && (
                                                        <GripVertical className="mr-0.5 h-3 w-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                    <ChevronDown
                                                        className={cn(
                                                            'mr-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
                                                            isCollapsed
                                                                ? '-rotate-90'
                                                                : '',
                                                        )}
                                                    />
                                                    <span className="truncate text-[12px] font-bold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground/80">
                                                        {category.name}
                                                    </span>
                                                </div>
                                                {canManageChannels && (
                                                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                                        <IconButton
                                                            className="p-0.5"
                                                            icon={Settings}
                                                            iconSize={14}
                                                            title="Edit Category"
                                                            variant="ghost"
                                                            onClick={(
                                                                e,
                                                            ): void => {
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
                                                            onClick={(
                                                                e,
                                                            ): void => {
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
                                const isCollapsed =
                                    channel.categoryId &&
                                    existingCategoryIds.has(channel.categoryId)
                                        ? collapsedCategories[
                                              channel.categoryId
                                          ]
                                        : false;

                                if (isCollapsed && !isReordering) return null;

                                return (
                                    <Reorder.Item
                                        className="m-0 w-full p-0"
                                        dragListener={
                                            canManageChannels && !isMobile
                                        }
                                        key={item.id}
                                        layout={
                                            virtualRow ? undefined : 'position'
                                        }
                                        ref={
                                            virtualRow
                                                ? rowVirtualizer.measureElement
                                                : undefined
                                        }
                                        style={
                                            virtualRow
                                                ? {
                                                      position: 'absolute',
                                                      top: `${virtualRow.start}px`,
                                                      left: 0,
                                                      width: '100%',
                                                  }
                                                : {}
                                        }
                                        value={item}
                                        whileDrag={{
                                            scale: 1.02,
                                            backgroundColor:
                                                'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '4px',
                                        }}
                                        onDragEnd={(): void => {
                                            void handleDragEnd();
                                        }}
                                        onDragStart={(): void =>
                                            handleDragStartItem(item.id)
                                        }
                                    >
                                        <ChannelRow
                                            canManageChannels={
                                                canManageChannels
                                            }
                                            channel={channel}
                                            channelPings={channelPings}
                                            connectedUserIds={
                                                channel.type === 'voice'
                                                    ? voiceParticipants[
                                                          channel._id
                                                      ]
                                                    : undefined
                                            }
                                            getChannelMenuItems={
                                                getChannelMenuItems
                                            }
                                            handleChannelClick={
                                                handleChannelClick
                                            }
                                            selectedChannelId={
                                                selectedChannelId
                                            }
                                            selectedServerId={selectedServerId}
                                            setSettingsChannel={
                                                setSettingsChannel
                                            }
                                        />
                                    </Reorder.Item>
                                );
                            }
                        };

                        return renderContent();
                    })}
                </Reorder.Group>

                {settingsCategory && (
                    <React.Suspense fallback={null}>
                        <CategorySettingsModal
                            category={settingsCategory}
                            isOpen={!!settingsCategory}
                            onClose={(): void => setSettingsCategory(null)}
                        />
                    </React.Suspense>
                )}

                {settingsChannel && (
                    <React.Suspense fallback={null}>
                        <ChannelSettingsModal
                            channel={settingsChannel}
                            isOpen={!!settingsChannel}
                            onClose={(): void => setSettingsChannel(null)}
                        />
                    </React.Suspense>
                )}

                {selectedServerId && createModalOpen && (
                    <React.Suspense fallback={null}>
                        <CreateChannelModal
                            categoryId={createCategoryId}
                            isOpen={createModalOpen}
                            serverId={selectedServerId}
                            onClose={(): void => {
                                setCreateModalOpen(false);
                                setCreateCategoryId(null);
                            }}
                        />
                    </React.Suspense>
                )}

                {selectedServerId && createCategoryModalOpen && (
                    <React.Suspense fallback={null}>
                        <CreateCategoryModal
                            isOpen={createCategoryModalOpen}
                            serverId={selectedServerId}
                            onClose={(): void =>
                                setCreateCategoryModalOpen(false)
                            }
                        />
                    </React.Suspense>
                )}

                {selectedLinkChannel && (
                    <ConfirmLinkModal
                        isOpen={!!selectedLinkChannel}
                        url={selectedLinkChannel.link || '#'}
                        onClose={(): void => setSelectedLinkChannel(null)}
                        onConfirm={(): void => {
                            window.open(
                                selectedLinkChannel.link || '#',
                                '_blank',
                                'noopener,noreferrer',
                            );
                            setSelectedLinkChannel(null);
                        }}
                    />
                )}

                {isLeaveModalOpen && (
                    <React.Suspense fallback={null}>
                        <LeaveServerModal
                            isOpen={isLeaveModalOpen}
                            serverId={selectedServerId || ''}
                            serverName={server?.name || ''}
                            onClose={(): void => setIsLeaveModalOpen(false)}
                        />
                    </React.Suspense>
                )}
            </div>
        </ContextMenu>
    );
};
