import React, { useEffect } from 'react';

import {
    useCategories,
    useChannels,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedChannelId } from '@/store/slices/navSlice';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

import { ChannelList } from './ChannelList';
import { ServerBanner } from './ServerBanner';

/**
 * @description Orchestrates server-specific navigation (banner, channels, categories).
 */
export const ServerSection: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId
    );

    const { data: server, isLoading: isLoadingServer } =
        useServerDetails(selectedServerId);
    const { data: channels, isLoading: isLoadingChannels } =
        useChannels(selectedServerId);
    const { data: categories, isLoading: isLoadingCategories } =
        useCategories(selectedServerId);

    useEffect(() => {
        if (
            !isLoadingChannels &&
            channels &&
            channels.length > 0 &&
            !selectedChannelId
        ) {
            // Default to first channel by position
            const sorted = [...channels].sort(
                (a, b) => a.position - b.position
            );
            const defaultChannel = sorted[0];
            dispatch(setSelectedChannelId(defaultChannel._id));
        }
    }, [isLoadingChannels, channels, selectedChannelId, dispatch]);

    const handleChannelSelect = (channelId: string) => {
        dispatch(setSelectedChannelId(channelId));
    };

    if (!selectedServerId) return null;

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto no-scrollbar custom-scrollbar">
            <ServerBanner
                name={server?.name || ''}
                banner={server?.banner}
                loading={isLoadingServer}
            />

            {isLoadingChannels || isLoadingCategories ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <ChannelList
                    channels={channels || []}
                    categories={categories || []}
                    selectedChannelId={selectedChannelId}
                    onChannelSelect={handleChannelSelect}
                />
            )}
        </div>
    );
};
