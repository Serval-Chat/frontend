import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { VirtualItem } from '@tanstack/react-virtual';
import { Reorder } from 'framer-motion';
import { ChevronDown, GripVertical, Plus, Settings } from 'lucide-react';

import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS, LIMIT } from '@/api/chat/chat.queries';
import type { Category, Channel } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';

import { ChannelItem } from './ChannelItem';
import type { ListItem } from './channelListModel';

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
            channel.id,
        );
        const canView = hasPermission('viewChannels');
        const canConnect = hasPermission('connect');

        const handleMouseEnter = React.useCallback((): void => {
            if (channel.type !== 'text' || !selectedServerId) return;

            void queryClient.prefetchInfiniteQuery({
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    selectedServerId,
                    channel.id,
                    null,
                ),
                queryFn: ({ pageParam }) =>
                    chatApi.getChannelMessages(
                        selectedServerId,
                        channel.id,
                        LIMIT,
                        pageParam as string | undefined,
                    ),
                initialPageParam: undefined,
                staleTime: Infinity,
            });
        }, [queryClient, selectedServerId, channel.id, channel.type]);

        // Only hide if loading is finished and canView is explicitly false
        if (!isLoading && !canView) {
            console.warn(
                `[ChannelRow] Hiding channel "${channel.name}" (${channel.id}) - viewChannels=false.`,
                {
                    channelPermissionOverrides: channel.permissions,
                    computedPermissions: permissions,
                    serverId: selectedServerId,
                },
            );
            return null;
        }

        const isUnread =
            selectedChannelId !== channel.id &&
            channel.type !== 'link' &&
            channel.lastMessageAt &&
            (!channel.lastReadAt ||
                new Date(channel.lastMessageAt) > new Date(channel.lastReadAt));

        return (
            <ContextMenu
                className="block w-full"
                items={getChannelMenuItems(channel)}
                key={channel.id}
            >
                <ChannelItem
                    connectedUserIds={connectedUserIds}
                    disabled={
                        channel.type === 'voice' ? !canConnect : undefined
                    }
                    emoji={channel.emoji}
                    emojiType={channel.emojiType}
                    icon={channel.icon}
                    isActive={selectedChannelId === channel.id}
                    isUnread={!!isUnread}
                    name={channel.name}
                    pingCount={channelPings[channel.id]}
                    type={channel.type}
                    onClick={(): void => {
                        handleChannelClick(channel);
                    }}
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

const REORDER_WHILE_DRAG = {
    scale: 1.02,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
};

interface ReorderRowProps {
    item: ListItem;
    virtualRow: VirtualItem | null;
    measureElement: (el: HTMLElement | null) => void;
    dragEnabled: boolean;
    onDragEnd: () => void;
    onDragStart: (id: string) => void;
    children: React.ReactNode;
}

const ReorderRow = ({
    item,
    virtualRow,
    measureElement,
    dragEnabled,
    onDragEnd,
    onDragStart,
    children,
}: ReorderRowProps): React.ReactNode => (
    <Reorder.Item
        className="m-0 w-full p-0"
        // read by the virtualizer's measureElement to map measurements back to
        // rows; without it, dynamic channel-row heights break.
        data-index={virtualRow ? virtualRow.index : undefined}
        dragListener={dragEnabled}
        layout={virtualRow ? undefined : 'position'}
        ref={virtualRow ? measureElement : undefined}
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
        whileDrag={REORDER_WHILE_DRAG}
        onDragEnd={onDragEnd}
        onDragStart={(): void => {
            onDragStart(item.id);
        }}
    >
        {children}
    </Reorder.Item>
);

interface ChannelListRowProps {
    item: ListItem;
    virtualRow: VirtualItem | null;
    measureElement: (el: HTMLElement | null) => void;
    canManageChannels: boolean;
    isMobile: boolean;
    isReordering: boolean;
    collapsedCategories: Record<string, boolean>;
    existingCategoryIds: Set<string>;
    selectedChannelId: string | null;
    selectedServerId: string | null;
    channelPings: Record<string, number>;
    voiceParticipants: Record<string, string[]>;
    getCategoryMenuItems: (category: Category) => ContextMenuItem[];
    getChannelMenuItems: (channel: Channel) => ContextMenuItem[];
    onToggleCategory: (categoryId: string) => void;
    onEditCategory: (category: Category) => void;
    onCreateChannelInCategory: (categoryId: string) => void;
    onEditChannel: (channel: Channel) => void;
    onChannelClick: (channel: Channel) => void;
    onDragEnd: () => void;
    onDragStart: (id: string) => void;
}

export const ChannelListRow = ({
    item,
    virtualRow,
    measureElement,
    canManageChannels,
    isMobile,
    isReordering,
    collapsedCategories,
    existingCategoryIds,
    selectedChannelId,
    selectedServerId,
    channelPings,
    voiceParticipants,
    getCategoryMenuItems,
    getChannelMenuItems,
    onToggleCategory,
    onEditCategory,
    onCreateChannelInCategory,
    onEditChannel,
    onChannelClick,
    onDragEnd,
    onDragStart,
}: ChannelListRowProps): React.ReactNode => {
    const dragEnabled = canManageChannels && !isMobile;

    if (item.type === 'category') {
        const category = item.data;
        const isCollapsed = collapsedCategories[category.id];

        return (
            <ReorderRow
                dragEnabled={dragEnabled}
                item={item}
                measureElement={measureElement}
                virtualRow={virtualRow}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
            >
                <ContextMenu
                    className="m-0 w-full p-0 pt-3"
                    items={getCategoryMenuItems(category)}
                >
                    <div className="group flex items-center px-1 select-none">
                        <button
                            className="flex min-w-0 flex-1 cursor-pointer items-center overflow-hidden border-0 bg-transparent p-0 text-left"
                            type="button"
                            onClick={(e): void => {
                                e.stopPropagation();
                                onToggleCategory(category.id);
                            }}
                        >
                            {canManageChannels ? (
                                <GripVertical className="mr-0.5 h-3 w-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                            ) : null}
                            <ChevronDown
                                className={cn(
                                    'mr-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
                                    isCollapsed ? '-rotate-90' : '',
                                )}
                            />
                            <span className="truncate text-[12px] font-bold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground/80">
                                {category.name}
                            </span>
                        </button>
                        {canManageChannels ? (
                            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                <IconButton
                                    className="p-0.5"
                                    icon={Settings}
                                    iconSize={14}
                                    title="Edit Category"
                                    variant="ghost"
                                    onClick={(e): void => {
                                        e.stopPropagation();
                                        onEditCategory(category);
                                    }}
                                />
                                <IconButton
                                    className="p-0.5"
                                    icon={Plus}
                                    iconSize={14}
                                    title="Create Channel"
                                    variant="ghost"
                                    onClick={(e): void => {
                                        e.stopPropagation();
                                        onCreateChannelInCategory(category.id);
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                </ContextMenu>
            </ReorderRow>
        );
    }

    const channel = item.data;
    const isCollapsed =
        channel.categoryId && existingCategoryIds.has(channel.categoryId)
            ? collapsedCategories[channel.categoryId]
            : false;

    if (isCollapsed && !isReordering) return null;

    return (
        <ReorderRow
            dragEnabled={dragEnabled}
            item={item}
            measureElement={measureElement}
            virtualRow={virtualRow}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            <ChannelRow
                canManageChannels={canManageChannels}
                channel={channel}
                channelPings={channelPings}
                connectedUserIds={
                    channel.type === 'voice'
                        ? voiceParticipants[channel.id]
                        : undefined
                }
                getChannelMenuItems={getChannelMenuItems}
                handleChannelClick={onChannelClick}
                selectedChannelId={selectedChannelId}
                selectedServerId={selectedServerId}
                setSettingsChannel={onEditChannel}
            />
        </ReorderRow>
    );
};
