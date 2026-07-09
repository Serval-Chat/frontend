import React, {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useState,
} from 'react';

import { serversApi } from '@/api/servers/servers.api';
import type { Category, Channel } from '@/api/servers/servers.types';

import {
    type ListItem,
    buildListItems,
    channelListReducer,
    initialChannelListState,
} from '@/ui/components/servers/channelListModel';

interface UseChannelListReorderArgs {
    channels: Channel[];
    categories: Category[];
    selectedServerId: string | null;
    canManageChannels: boolean;
    existingCategoryIds: Set<string>;
    hiddenChannels: Set<string>;
    hiddenCategories: Set<string>;
}

/**
 * owns the channel-list ordering model: the list-state reducer, the optimistic
 * drag/reorder + mobile move handlers, and the props-sync / server-reset /
 * sync-lock lifecycle. Extracted from ChannelList so the component only wires
 * this model to the rendered rows.
 */
export const useChannelListReorder = ({
    channels,
    categories,
    selectedServerId,
    canManageChannels,
    existingCategoryIds,
    hiddenChannels,
    hiddenCategories,
}: UseChannelListReorderArgs) => {
    const [listState, dispatchList] = useReducer(
        channelListReducer,
        initialChannelListState,
    );
    const { items, collapsedCategories, isReordering, activeItemId, syncLock } =
        listState;
    const syncLockTimeoutRef = React.useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    const nextItems = useMemo(
        (): ListItem[] =>
            buildListItems({
                categories,
                channels,
                existingCategoryIds,
                hiddenCategories,
                hiddenChannels,
            }),
        [
            categories,
            channels,
            existingCategoryIds,
            hiddenCategories,
            hiddenChannels,
        ],
    );
    // Sync the list to freshly-built items when props change (outside a drag),
    // tracking the previous value in state per React's "adjust state during
    // render" pattern rather than a render-time ref.
    const [prevSyncItems, setPrevSyncItems] = useState<ListItem[]>(nextItems);

    if (nextItems !== prevSyncItems && !isReordering && !syncLock) {
        setPrevSyncItems(nextItems);
        dispatchList({ type: 'sync', items: nextItems });
    }

    useEffect((): void => {
        dispatchList({ type: 'reset' });

        if (syncLockTimeoutRef.current) {
            clearTimeout(syncLockTimeoutRef.current);
            syncLockTimeoutRef.current = null;
        }
    }, [selectedServerId]);

    useEffect(
        (): (() => void) => (): void => {
            if (syncLockTimeoutRef.current) {
                clearTimeout(syncLockTimeoutRef.current);
                syncLockTimeoutRef.current = null;
            }
        },
        [],
    );

    const visibleItems = useMemo(
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

    const toggleCategory = (categoryId: string): void => {
        dispatchList({ type: 'toggleCategory', categoryId });
    };

    const handleReorder = (newVisibleItems: ListItem[]): void => {
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
        for (const item of updatedVisible) {
            fullNewList.push(item);
            if (item.type === 'category') {
                const hiddenChildren = items.filter(
                    (i): boolean =>
                        i.type === 'channel' &&
                        i.data.categoryId === item.id &&
                        !!collapsedCategories[item.id],
                );
                fullNewList.push(...hiddenChildren);
            }
        }

        dispatchList({ type: 'reorder', items: fullNewList });
    };

    const handleDragEnd = useCallback(async (): Promise<void> => {
        if (!selectedServerId || !canManageChannels) {
            dispatchList({ type: 'dragCancelled' });
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

            for (const item of items) {
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
                            id: channel.id,
                            updates: { categoryId: currentCategoryId },
                        });
                    }
                    channelPositions.push({
                        channelId: channel.id,
                        position: channelPos++,
                    });
                }
            }

            // Parallel updates
            const promises: Promise<unknown>[] = [];

            // Update category IDs if changed
            for (const update of channelUpdates) {
                promises.push(
                    serversApi.updateChannel(
                        selectedServerId,
                        update.id,
                        update.updates,
                    ),
                );
            }

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
        } finally {
            dispatchList({ type: 'dragEnd' });
            syncLockTimeoutRef.current = setTimeout((): void => {
                dispatchList({ type: 'syncUnlock' });
                syncLockTimeoutRef.current = null;
            }, 500);
        }
    }, [selectedServerId, canManageChannels, items]);

    const handleDragStartItem = useCallback((id: string): void => {
        dispatchList({ type: 'dragStart', id });
    }, []);

    const handleMoveToCategory = useCallback(
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

    const handleMoveItemMobile = useCallback(
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
                const channel = itemToMove.data;
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
            if (!targetItem) return;

            // Optimistic UI update
            const newItems = [...items];
            if (itemToMove.type === 'category') {
                const idxA = newItems.findIndex(
                    (i): boolean => i.id === itemToMove.id,
                );
                const idxB = newItems.findIndex(
                    (i): boolean => i.id === targetItem.id,
                );
                const itemA = newItems[idxA];
                const itemB = newItems[idxB];
                if (idxA === -1 || idxB === -1 || !itemA || !itemB) return;
                const blockA = [
                    itemA,
                    ...newItems.filter(
                        (i): boolean =>
                            i.type === 'channel' &&
                            i.data.categoryId === itemToMove.id,
                    ),
                ];
                const blockB = [
                    itemB,
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
                dispatchList({ type: 'sync', items: filtered });
            } else {
                const idxA = newItems.findIndex(
                    (i): boolean => i.id === itemToMove.id,
                );
                const idxB = newItems.findIndex(
                    (i): boolean => i.id === targetItem.id,
                );
                const valueA = items[idxA];
                const valueB = items[idxB];
                if (idxA === -1 || idxB === -1 || !valueA || !valueB) return;

                newItems[idxA] = valueB;
                newItems[idxB] = valueA;
                dispatchList({ type: 'sync', items: newItems });
            }

            try {
                dispatchList({ type: 'syncLock' });

                if (itemToMove.type === 'category') {
                    const item1 = itemToMove.data;
                    const item2 = targetItem.data as Category;

                    await serversApi.reorderCategories(selectedServerId, [
                        { categoryId: item1.id, position: item2.position },
                        { categoryId: item2.id, position: item1.position },
                    ]);
                } else {
                    const item1 = itemToMove.data;
                    const item2 = targetItem.data as Channel;
                    await serversApi.reorderChannels(selectedServerId, [
                        { channelId: item1.id, position: item2.position },
                        { channelId: item2.id, position: item1.position },
                    ]);
                }
            } catch (error) {
                console.error('Failed to reorder items:', error);
            } finally {
                syncLockTimeoutRef.current = setTimeout((): void => {
                    dispatchList({ type: 'syncUnlock' });
                    syncLockTimeoutRef.current = null;
                }, 500);
            }
        },
        [selectedServerId, canManageChannels, items],
    );

    return {
        items,
        visibleItems,
        collapsedCategories,
        isReordering,
        activeItemId,
        syncLock,
        toggleCategory,
        handleReorder,
        handleDragEnd,
        handleDragStartItem,
        handleMoveToCategory,
        handleMoveItemMobile,
    };
};
