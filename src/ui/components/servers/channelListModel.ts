import type { VirtualItem } from '@tanstack/react-virtual';

import type { Category, Channel } from '@/api/servers/servers.types';

export type ListItem =
    | { type: 'category'; id: string; data: Category }
    | { type: 'channel'; id: string; data: Channel };

export type VirtualListItem = ListItem & { virtualRow: VirtualItem };

export const buildListItems = ({
    categories,
    channels,
    existingCategoryIds,
    hiddenCategories,
    hiddenChannels,
}: {
    categories: Category[];
    channels: Channel[];
    existingCategoryIds: Set<string>;
    hiddenCategories: Set<string>;
    hiddenChannels: Set<string>;
}): ListItem[] => {
    const visibleCategories = categories.filter(
        (category): boolean => !hiddenCategories.has(category.id),
    );
    const visibleChannels = channels.filter((channel): boolean => {
        if (hiddenChannels.has(channel.id)) return false;
        if (channel.categoryId && hiddenCategories.has(channel.categoryId)) {
            return false;
        }
        return true;
    });

    const sortedCategories = [...visibleCategories];
    sortedCategories.sort((a, b): number => a.position - b.position);
    const sortedChannels = [...visibleChannels];
    sortedChannels.sort((a, b): number => a.position - b.position);

    const newList: ListItem[] = [];

    const uncategorized = sortedChannels.filter(
        (c): boolean => !c.categoryId || !existingCategoryIds.has(c.categoryId),
    );
    for (const c of uncategorized)
        newList.push({ type: 'channel', id: c.id, data: c });

    for (const cat of sortedCategories) {
        newList.push({ type: 'category', id: cat.id, data: cat });
        const catChannels = sortedChannels.filter(
            (c): boolean => c.categoryId === cat.id,
        );
        for (const c of catChannels)
            newList.push({ type: 'channel', id: c.id, data: c });
    }

    return newList;
};

// items/collapsedCategories/isReordering/activeItemId/syncLock all transition
// together (reset on server change, settle together at drag end, etc.), so
// they're one reducer instead of 5 separately-set useState calls.
export interface ChannelListState {
    items: ListItem[];
    collapsedCategories: Record<string, boolean>;
    isReordering: boolean;
    activeItemId: string | null;
    syncLock: boolean;
}

export const initialChannelListState: ChannelListState = {
    items: [],
    collapsedCategories: {},
    isReordering: false,
    activeItemId: null,
    syncLock: false,
};

export type ChannelListAction =
    | { type: 'reset' }
    | { type: 'sync'; items: ListItem[] }
    | { type: 'toggleCategory'; categoryId: string }
    | { type: 'reorder'; items: ListItem[] }
    | { type: 'dragStart'; id: string }
    | { type: 'dragCancelled' }
    | { type: 'dragEnd' }
    | { type: 'syncLock' }
    | { type: 'syncUnlock' };

export function channelListReducer(
    state: ChannelListState,
    action: ChannelListAction,
): ChannelListState {
    switch (action.type) {
        case 'reset': {
            return initialChannelListState;
        }
        case 'sync': {
            return { ...state, items: action.items };
        }
        case 'toggleCategory': {
            return {
                ...state,
                collapsedCategories: {
                    ...state.collapsedCategories,
                    [action.categoryId]:
                        !state.collapsedCategories[action.categoryId],
                },
            };
        }
        case 'reorder': {
            return { ...state, items: action.items, isReordering: true };
        }
        case 'dragStart': {
            return { ...state, activeItemId: action.id, isReordering: true };
        }
        case 'dragCancelled': {
            return { ...state, isReordering: false };
        }
        case 'dragEnd': {
            return {
                ...state,
                isReordering: false,
                activeItemId: null,
                syncLock: true,
            };
        }
        case 'syncLock': {
            return { ...state, syncLock: true };
        }
        case 'syncUnlock': {
            return { ...state, syncLock: false };
        }
        default: {
            return state;
        }
    }
}
