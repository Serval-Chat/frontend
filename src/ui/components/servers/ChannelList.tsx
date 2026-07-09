import React, { useCallback, useEffect, useMemo, useReducer } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import { Reorder } from 'framer-motion';

import { usePings } from '@/api/pings/pings.queries';
import {
    useServerDetails,
    useVoiceStates,
} from '@/api/servers/servers.queries';
import type { Category, Channel } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppSelector } from '@/store/hooks';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import { mergeReducer } from '@/utils/mergeReducer';
import { wsMessages } from '@/ws/messages';

import { ChannelListModals } from './ChannelListModals';
import { ChannelListRow } from './ChannelListRow';
import type { ListItem, VirtualListItem } from './channelListModel';
import { useChannelClick } from '@/hooks/useChannelClick';
import { useChannelListMenus } from '@/hooks/useChannelListMenus';
import { useChannelListReorder } from '@/hooks/useChannelListReorder';

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    hiddenChannelIds?: string[];
    hiddenCategoryIds?: string[];
}

interface ChannelListUiState {
    settingsCategory: Category | null;
    settingsChannel: Channel | null;
    selectedLinkChannel: Channel | null;
    createModalOpen: boolean;
    createCategoryModalOpen: boolean;
    createCategoryId: string | null;
    isLeaveModalOpen: boolean;
    isMobile: boolean;
}

const EMPTY_IDS: string[] = [];

/**
 * @description Renders the list of channels grouped by categories.
 */
export const ChannelList = ({
    channels,
    categories,
    selectedChannelId,
    scrollRef,
    hiddenChannelIds = EMPTY_IDS,
    hiddenCategoryIds = EMPTY_IDS,
}: ChannelListProps) => {
    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const voiceParticipants = useAppSelector(
        (state): Record<string, string[]> => state.voice.voiceParticipants,
    );
    const { data: pingsData } = usePings();

    const channelPings = useMemo((): Record<string, number> => {
        const counts: Record<string, number> = {};
        for (const p of pingsData?.pings || []) {
            if (p.channelId) {
                counts[p.channelId] = (counts[p.channelId] || 0) + 1;
            }
        }
        return counts;
    }, [pingsData]);

    const [ui, patchUi] = useReducer(mergeReducer<ChannelListUiState>, {
        settingsCategory: null,
        settingsChannel: null,
        selectedLinkChannel: null,
        createModalOpen: false,
        createCategoryModalOpen: false,
        createCategoryId: null,
        isLeaveModalOpen: false,
        isMobile: window.innerWidth < 768,
    });
    const {
        settingsCategory,
        settingsChannel,
        selectedLinkChannel,
        createModalOpen,
        createCategoryModalOpen,
        createCategoryId,
        isLeaveModalOpen,
        isMobile,
    } = ui;

    const { hasPermission, isOwner } = usePermissions(selectedServerId);
    const canManageChannels = hasPermission('manageChannels');
    const { data: server } = useServerDetails(selectedServerId);

    useVoiceStates(selectedServerId);

    const existingCategoryIds = useMemo(
        (): Set<string> => new Set(categories.map((cat): string => cat.id)),
        [categories],
    );
    const hiddenChannels = useMemo(
        (): Set<string> => new Set(hiddenChannelIds),
        [hiddenChannelIds],
    );
    const hiddenCategories = useMemo(
        (): Set<string> => new Set(hiddenCategoryIds),
        [hiddenCategoryIds],
    );

    const {
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
    } = useChannelListReorder({
        channels,
        categories,
        selectedServerId,
        canManageChannels,
        existingCategoryIds,
        hiddenChannels,
        hiddenCategories,
    });

    const { getChannelMenuItems, getCategoryMenuItems, getGlobalMenuItems } =
        useChannelListMenus({
            channels,
            categories,
            canManageChannels,
            isMobile,
            isOwner,
            selectedServerId,
            handleMoveItemMobile,
            handleMoveToCategory,
            onEditChannel: (channel): void => {
                patchUi({ settingsChannel: channel });
            },
            onEditCategory: (category): void => {
                patchUi({ settingsCategory: category });
            },
            onCreateChannel: (categoryId): void => {
                patchUi({
                    createCategoryId: categoryId,
                    createModalOpen: true,
                });
            },
            onCreateCategory: (): void => {
                patchUi({ createCategoryModalOpen: true });
            },
            onLeaveServer: (): void => {
                patchUi({ isLeaveModalOpen: true });
            },
        });

    // eslint-disable-next-line react-hooks/incompatible-library
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

    useEffect((): (() => void) => {
        const handleResize = (): void => {
            patchUi({ isMobile: window.innerWidth < 768 });
        };
        window.addEventListener('resize', handleResize);
        return (): void => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Mark channel as read when opened
    useEffect((): void => {
        if (!selectedChannelId || !selectedServerId) return;

        const channel = channels.find(
            (c): boolean => c.id === selectedChannelId,
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

    const handleChannelClick = useChannelClick({
        activeItemId,
        isReordering,
        syncLock,
        selectedServerId,
        onSelectLinkChannel: (channel): void => {
            patchUi({ selectedLinkChannel: channel });
        },
    });

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

                        return (
                            <ChannelListRow
                                canManageChannels={canManageChannels}
                                channelPings={channelPings}
                                collapsedCategories={collapsedCategories}
                                existingCategoryIds={existingCategoryIds}
                                getCategoryMenuItems={getCategoryMenuItems}
                                getChannelMenuItems={getChannelMenuItems}
                                isMobile={isMobile}
                                isReordering={isReordering}
                                item={item}
                                key={item.id}
                                measureElement={rowVirtualizer.measureElement}
                                selectedChannelId={selectedChannelId}
                                selectedServerId={selectedServerId}
                                virtualRow={virtualRow}
                                voiceParticipants={voiceParticipants}
                                onChannelClick={handleChannelClick}
                                onCreateChannelInCategory={(
                                    categoryId,
                                ): void => {
                                    patchUi({
                                        createCategoryId: categoryId,
                                        createModalOpen: true,
                                    });
                                }}
                                onDragEnd={(): void => {
                                    void handleDragEnd();
                                }}
                                onDragStart={handleDragStartItem}
                                onEditCategory={(category): void => {
                                    patchUi({ settingsCategory: category });
                                }}
                                onEditChannel={(channel): void => {
                                    patchUi({ settingsChannel: channel });
                                }}
                                onToggleCategory={toggleCategory}
                            />
                        );
                    })}
                </Reorder.Group>

                <ChannelListModals
                    createCategoryId={createCategoryId}
                    createCategoryModalOpen={createCategoryModalOpen}
                    createModalOpen={createModalOpen}
                    isLeaveModalOpen={isLeaveModalOpen}
                    selectedLinkChannel={selectedLinkChannel}
                    selectedServerId={selectedServerId}
                    serverName={server?.name || ''}
                    settingsCategory={settingsCategory}
                    settingsChannel={settingsChannel}
                    onCloseCategorySettings={(): void => {
                        patchUi({ settingsCategory: null });
                    }}
                    onCloseChannelSettings={(): void => {
                        patchUi({ settingsChannel: null });
                    }}
                    onCloseCreateCategory={(): void => {
                        patchUi({ createCategoryModalOpen: false });
                    }}
                    onCloseCreateChannel={(): void => {
                        patchUi({
                            createModalOpen: false,
                            createCategoryId: null,
                        });
                    }}
                    onCloseLeave={(): void => {
                        patchUi({ isLeaveModalOpen: false });
                    }}
                    onCloseLink={(): void => {
                        patchUi({ selectedLinkChannel: null });
                    }}
                    onConfirmLink={(): void => {
                        window.open(
                            selectedLinkChannel?.link || '#',
                            '_blank',
                            'noopener,noreferrer',
                        );
                        patchUi({ selectedLinkChannel: null });
                    }}
                />
            </div>
        </ContextMenu>
    );
};
