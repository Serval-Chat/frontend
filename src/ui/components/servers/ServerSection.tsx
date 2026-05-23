import React, { useEffect, useRef } from 'react';

import { Hash, Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useOnboarding,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useServerWS } from '@/hooks/ws/useServerWS';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    clearLastOpenedChannelForServer,
    setSelectedChannelId,
    setTargetMessageId,
} from '@/store/slices/navSlice';

import { ChannelItem } from './ChannelItem';
import { ChannelList } from './ChannelList';
import { ServerBanner } from './ServerBanner';
import { SidebarSkeleton } from './SidebarSkeleton';

const ServerOnboardingModal = React.lazy(() =>
    import('./onboarding/ServerOnboardingModals').then((m) => ({
        default: m.ServerOnboardingModal,
    })),
);

const ServerSelfRolesModal = React.lazy(() =>
    import('./onboarding/ServerOnboardingModals').then((m) => ({
        default: m.ServerSelfRolesModal,
    })),
);

const ChannelPreferencesModal = React.lazy(() =>
    import('./onboarding/ServerOnboardingModals').then((m) => ({
        default: m.ChannelPreferencesModal,
    })),
);

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
    const { data: onboarding } = useOnboarding(selectedServerId);
    const [isRolesOpen, setIsRolesOpen] = React.useState(false);
    const [isChannelPrefsOpen, setIsChannelPrefsOpen] = React.useState(false);

    useServerWS(selectedServerId ?? undefined);

    const scrollRef = useRef<HTMLDivElement>(null);

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
                    dispatch(clearLastOpenedChannelForServer(selectedServerId));
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
                const lastChannelExists =
                    lastChannelId !== undefined &&
                    sortedChannels.some((c) => c._id === lastChannelId);
                if (lastChannelId !== undefined && !lastChannelExists) {
                    dispatch(clearLastOpenedChannelForServer(selectedServerId));
                }

                const targetChannelId = lastChannelExists
                    ? lastChannelId
                    : firstChannel?._id;

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
        <div
            className="no-scrollbar custom-scrollbar flex h-full w-full flex-col overflow-y-auto"
            ref={scrollRef}
        >
            <ServerBanner
                banner={server?.banner}
                loading={isLoadingServer}
                name={server?.name || ''}
                verified={server?.verified}
            />

            {(!channels && !isPlaceholderChannels) ||
            (!categories && !isPlaceholderCategories) ? (
                <SidebarSkeleton />
            ) : (
                <>
                    <div className="shrink-0 border-b border-border-subtle px-2 py-2">
                        <div className="ml-3">
                            {(onboarding?.onboarding.selfAssignableRoleIds
                                .length ?? 0) > 0 && (
                                <ChannelItem
                                    iconComponent={Shield}
                                    name="Roles"
                                    type="text"
                                    onClick={() => setIsRolesOpen(true)}
                                />
                            )}
                            <ChannelItem
                                iconComponent={Hash}
                                name="Channels & Categories"
                                type="text"
                                onClick={() => setIsChannelPrefsOpen(true)}
                            />
                        </div>
                    </div>
                    <ChannelList
                        categories={categories || []}
                        channels={channels || []}
                        hiddenCategoryIds={
                            onboarding?.member.hiddenCategoryIds ?? []
                        }
                        hiddenChannelIds={
                            onboarding?.member.hiddenChannelIds ?? []
                        }
                        scrollRef={scrollRef}
                        selectedChannelId={selectedChannelId}
                    />
                </>
            )}

            <React.Suspense fallback={null}>
                <ServerOnboardingModal serverId={selectedServerId} />
                <ServerSelfRolesModal
                    isOpen={isRolesOpen}
                    serverId={selectedServerId}
                    onClose={() => setIsRolesOpen(false)}
                />
                <ChannelPreferencesModal
                    isOpen={isChannelPrefsOpen}
                    serverId={selectedServerId}
                    onClose={() => setIsChannelPrefsOpen(false)}
                />
            </React.Suspense>
        </div>
    );
};
