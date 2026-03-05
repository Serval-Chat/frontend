import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useServerWS } from '@/hooks/ws/useServerWS';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setTargetMessageId,
} from '@/store/slices/navSlice';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

import { ChannelList } from './ChannelList';
import { ServerBanner } from './ServerBanner';

/**
 * @description Orchestrates server-specific navigation (banner, channels, categories).
 */
export const ServerSection: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );

    const {
        data: server,
        isLoading: isLoadingServer,
        isError: isServerError,
    } = useServerDetails(selectedServerId);
    const {
        data: channels,
        isLoading: isLoadingChannels,
        isError: isChannelsError,
    } = useChannels(selectedServerId);
    const { data: categories, isLoading: isLoadingCategories } =
        useCategories(selectedServerId);

    useServerWS(selectedServerId ?? undefined);

    useEffect(() => {
        if (!selectedServerId) return;

        if (isServerError || isChannelsError) {
            void navigate('/chat/@me', { replace: true });
            return;
        }

        if (!isLoadingChannels && channels) {
            if (selectedChannelId) {
                const channelExists = channels.some(
                    (c) => c._id === selectedChannelId,
                );
                if (!channelExists) {
                    dispatch(setSelectedChannelId(null));
                    dispatch(setTargetMessageId(null));
                    void navigate(`/chat/@server/${selectedServerId}`, {
                        replace: true,
                    });
                }
            } else {
                const sortedChannels = [...channels].sort(
                    (a, b) => a.position - b.position,
                );
                const firstChannel = sortedChannels.find(
                    (c) => c.type !== 'link',
                );
                if (firstChannel) {
                    void navigate(
                        `/chat/@server/${selectedServerId}/channel/${firstChannel._id}`,
                        { replace: true },
                    );
                }
            }
        }
    }, [
        isServerError,
        isChannelsError,
        isLoadingChannels,
        channels,
        selectedChannelId,
        selectedServerId,
        dispatch,
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
