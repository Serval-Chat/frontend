import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useServerWS } from '@/hooks/ws/useServerWS';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

import { ChannelList } from './ChannelList';
import { ServerBanner } from './ServerBanner';

/**
 * @description Orchestrates server-specific navigation (banner, channels, categories).
 */
export const ServerSection: React.FC = () => {
    const navigate = useNavigate();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );

    const { data: server, isLoading: isLoadingServer } =
        useServerDetails(selectedServerId);
    const { data: channels, isLoading: isLoadingChannels } =
        useChannels(selectedServerId);
    const { data: categories, isLoading: isLoadingCategories } =
        useCategories(selectedServerId);

    useServerWS(selectedServerId ?? undefined);

    // When a server is selected but no channel is active, navigate to the first channel.
    useEffect(() => {
        if (
            !isLoadingChannels &&
            channels &&
            channels.length > 0 &&
            !selectedChannelId &&
            selectedServerId
        ) {
            const sorted = [...channels].sort(
                (a, b) => a.position - b.position,
            );
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${sorted[0]._id}`,
                { replace: true },
            );
        }
    }, [
        isLoadingChannels,
        channels,
        selectedChannelId,
        selectedServerId,
        navigate,
    ]);

    if (!selectedServerId) return null;

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto no-scrollbar custom-scrollbar">
            <ServerBanner
                banner={server?.banner}
                loading={isLoadingServer}
                name={server?.name || ''}
            />

            {isLoadingChannels || isLoadingCategories ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <ChannelList
                    categories={categories || []}
                    channels={channels || []}
                    selectedChannelId={selectedChannelId}
                />
            )}
        </div>
    );
};
