import React, { useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

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
    const { channelId } = useParams();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );
    const lastOpenedChannelByServer = useAppSelector(
        (state) => state.nav.lastOpenedChannelByServer,
    );

    const {
        data: server,
        isLoading: isLoadingServer,
        isError: isServerError,
    } = useServerDetails(selectedServerId);
    const {
        data: channels,
        isPlaceholderData: isPlaceholderChannels,
        isError: isChannelsError,
    } = useChannels(selectedServerId);
    const { data: categories, isPlaceholderData: isPlaceholderCategories } =
        useCategories(selectedServerId);

    useServerWS(selectedServerId ?? undefined);

    useEffect(() => {
        if (!selectedServerId) return;

        if (isServerError || isChannelsError) {
            void navigate('/chat/@me', { replace: true });
            return;
        }

        if (!isPlaceholderChannels && channels) {
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
                if (channelId) return;

                // On mobile, if we are at the server root, don't auto-navigate
                const isMobile = window.innerWidth < 768;
                if (isMobile) return;

                const lastChannelId =
                    lastOpenedChannelByServer[selectedServerId];
                const sortedChannels = [...channels].sort(
                    (a, b) => a.position - b.position,
                );
                const firstChannel = sortedChannels.find(
                    (c) => c.type !== 'link',
                );

                const targetChannelId = lastChannelId || firstChannel?._id;

                if (targetChannelId) {
                    void navigate(
                        `/chat/@server/${selectedServerId}/channel/${targetChannelId}`,
                        { replace: true },
                    );
                }
            }
        }
    }, [
        isServerError,
        isChannelsError,
        isPlaceholderChannels,
        channels,
        selectedChannelId,
        selectedServerId,
        lastOpenedChannelByServer,
        dispatch,
        navigate,
        channelId,
    ]);

    if (!selectedServerId) return null;

    return (
        <div className="no-scrollbar custom-scrollbar flex h-full w-full flex-col overflow-y-auto">
            <ServerBanner
                banner={server?.banner}
                loading={isLoadingServer}
                name={server?.name || ''}
                verified={server?.verified}
            />

            {(!channels && !isPlaceholderChannels) ||
            (!categories && !isPlaceholderCategories) ? (
                <div className="flex flex-1 items-center justify-center">
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
