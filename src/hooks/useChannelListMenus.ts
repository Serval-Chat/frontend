import React, { useCallback } from 'react';

import {
    ArrowDown,
    ArrowUp,
    Copy,
    Folder,
    FolderPlus,
    Link as LinkIcon,
    LogOut,
    PanelBottomOpen,
    PanelLeftOpen,
    PanelRightOpen,
    PanelTopOpen,
    PanelsLeftRight,
    Plus,
    Settings,
} from 'lucide-react';

import type { Category, Channel } from '@/api/servers/servers.types';
import { useAppDispatch } from '@/store/hooks';
import { setSplitViewPane } from '@/store/slices/navSlice';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';

import type { ListItem } from '@/ui/components/servers/channelListModel';

interface UseChannelListMenusArgs {
    channels: Channel[];
    categories: Category[];
    canManageChannels: boolean;
    isMobile: boolean;
    isOwner: boolean;
    selectedServerId: string | null;
    handleMoveItemMobile: (
        item: ListItem,
        direction: 'up' | 'down',
    ) => Promise<void>;
    handleMoveToCategory: (
        channelId: string,
        categoryId: string | null,
    ) => Promise<void>;
    onEditChannel: (channel: Channel) => void;
    onEditCategory: (category: Category) => void;
    onCreateChannel: (categoryId: string | null) => void;
    onCreateCategory: () => void;
    onLeaveServer: () => void;
}

/**
 * builds the right-click context menus for channels, categories, and the empty
 * list area. Kept out of ChannelList so the component stays render-focused; the
 * builders read the freshest channels/categories via refs.
 */
export const useChannelListMenus = ({
    channels,
    categories,
    canManageChannels,
    isMobile,
    isOwner,
    selectedServerId,
    handleMoveItemMobile,
    handleMoveToCategory,
    onEditChannel,
    onEditCategory,
    onCreateChannel,
    onCreateCategory,
    onLeaveServer,
}: UseChannelListMenusArgs) => {
    const dispatch = useAppDispatch();

    const channelsRef = React.useRef(channels);
    const categoriesRef = React.useRef(categories);

    React.useEffect((): void => {
        channelsRef.current = channels;
        categoriesRef.current = categories;
    }, [channels, categories]);

    const getChannelMenuItems = useCallback(
        (channel: Channel): ContextMenuItem[] => {
            const items: ContextMenuItem[] = [
                {
                    label: 'Copy Channel Link',
                    icon: LinkIcon,
                    onClick: (): void => {
                        const url = `${globalThis.location.origin}/chat/@server/${channel.serverId}/channel/${channel.id}`;
                        void navigator.clipboard.writeText(url);
                    },
                },
                {
                    label: 'Copy Channel ID',
                    icon: Copy,
                    onClick: (): void => {
                        void navigator.clipboard.writeText(channel.id);
                    },
                },
            ];

            if (channel.type === 'text') {
                items.push(
                    { type: 'divider' },
                    {
                        label: 'Add to Split View',
                        type: 'submenu',
                        icon: PanelsLeftRight,
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
                                                channelId: channel.id,
                                            },
                                        }),
                                    );
                                },
                            },
                            {
                                label: isMobile ? 'Bottom Pane' : 'Right Side',
                                icon: isMobile
                                    ? PanelBottomOpen
                                    : PanelRightOpen,
                                onClick: (): void => {
                                    dispatch(
                                        setSplitViewPane({
                                            side: 'right',
                                            conversation: {
                                                type: 'channel',
                                                serverId: channel.serverId,
                                                channelId: channel.id,
                                            },
                                        }),
                                    );
                                },
                            },
                        ],
                    },
                );
            }

            if (canManageChannels) {
                items.push({
                    label: 'Edit Channel',
                    icon: Settings,
                    onClick: (): void => {
                        onEditChannel(channel);
                    },
                });

                if (isMobile) {
                    // check if it can move up/down
                    const siblings = channelsRef.current.filter(
                        (c): boolean => c.categoryId === channel.categoryId,
                    );
                    siblings.sort((a, b): number => a.position - b.position);
                    const index = siblings.findIndex(
                        (c): boolean => c.id === channel.id,
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
                                        id: channel.id,
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
                                        id: channel.id,
                                        data: channel,
                                    },
                                    'down',
                                ),
                        });
                    }
                }

                // move to category options
                const moveOptions: ContextMenuItem[] = [
                    {
                        label: 'Uncategorized',
                        icon: Folder,
                        onClick: (): undefined =>
                            void handleMoveToCategory(channel.id, null),
                    },
                    ...[...categoriesRef.current]
                        .sort((a, b): number => a.position - b.position)
                        .map((cat) => ({
                            label: cat.name,
                            icon: Folder,
                            onClick: (): undefined =>
                                void handleMoveToCategory(channel.id, cat.id),
                        })),
                ];

                // filter out current category
                const currentCatId = channel.categoryId || null;
                const availableOptions = moveOptions.filter((opt): boolean => {
                    if ('label' in opt && typeof opt.label === 'string') {
                        if (opt.label === 'Uncategorized')
                            return currentCatId !== null;
                        const targetCat = categoriesRef.current.find(
                            (c): boolean => c.name === opt.label,
                        );
                        return targetCat?.id !== currentCatId;
                    }
                    return false;
                });

                if (availableOptions.length > 0) {
                    items.push(
                        { type: 'divider' },
                        { label: 'Move to Category:', type: 'label' },
                        ...availableOptions,
                    );
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
            onEditChannel,
        ],
    );

    const getCategoryMenuItems = useCallback(
        (category: Category): ContextMenuItem[] => {
            const items: ContextMenuItem[] = [
                {
                    label: 'Copy Category ID',
                    icon: Copy,
                    onClick: (): void => {
                        void navigator.clipboard.writeText(category.id);
                    },
                },
            ];

            if (canManageChannels) {
                items.unshift({
                    label: 'Edit Category',
                    icon: Settings,
                    onClick: (): void => {
                        onEditCategory(category);
                    },
                });

                if (isMobile) {
                    const siblings = [...categoriesRef.current];
                    siblings.sort((a, b): number => a.position - b.position);
                    const index = siblings.findIndex(
                        (c): boolean => c.id === category.id,
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
                                        id: category.id,
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
                                        id: category.id,
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
        [canManageChannels, isMobile, handleMoveItemMobile, onEditCategory],
    );

    const getGlobalMenuItems = useCallback((): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (canManageChannels) {
            items.push(
                {
                    label: 'Create Channel',
                    icon: Plus,
                    onClick: (): void => {
                        onCreateChannel(null);
                    },
                },
                {
                    label: 'Create Category',
                    icon: FolderPlus,
                    onClick: (): void => {
                        onCreateCategory();
                    },
                },
            );
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
            items.push(
                { type: 'divider' },
                {
                    label: 'Leave Server',
                    icon: LogOut,
                    variant: 'danger',
                    onClick: (): void => {
                        onLeaveServer();
                    },
                },
            );
        }

        return items;
    }, [
        canManageChannels,
        selectedServerId,
        isOwner,
        onCreateChannel,
        onCreateCategory,
        onLeaveServer,
    ]);

    return { getChannelMenuItems, getCategoryMenuItems, getGlobalMenuItems };
};
