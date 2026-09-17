import React, { useEffect, useRef } from 'react';

import { Hash, Tag, Users } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useOnboarding,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useServerWS } from '@/hooks/ws/useServerWS';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    clearLastOpenedChannelForServer,
    setSelectedChannelId,
    setTargetMessageId,
} from '@/store/slices/navSlice';
import { SERVER_SUBPAGE_PATHS, isServerSubpage } from '@/utils/serverSubpages';

import { ChannelItem } from './ChannelItem';
import { ChannelList } from './ChannelList';
import { ServerBanner } from './ServerBanner';
import { SidebarSkeleton } from './SidebarSkeleton';

const MEMBER_MANAGEMENT_PERMISSIONS = [
    'banMembers',
    'kickMembers',
    'moderateMembers',
] as const;

const ServerOnboardingModal = React.lazy(() =>
    import('./onboarding/ServerOnboardingModals').then((m) => ({
        default: m.ServerOnboardingModal,
    })),
);

/**
 * @description Orchestrates server-specific navigation (banner, channels, categories).
 */
export const ServerSection = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { channelId } = useParams();
    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state): string | null => state.nav.selectedChannelId,
    );
    const lastOpenedChannelByServer = useAppSelector(
        (state): Record<string, string> => state.nav.lastOpenedChannelByServer,
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
    const { hasPermission, isOwner } = usePermissions(selectedServerId);
    const canViewMembers =
        isOwner ||
        MEMBER_MANAGEMENT_PERMISSIONS.some((permission): boolean =>
            hasPermission(permission),
        );

    useServerWS(selectedServerId ?? undefined);

    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const isSpecialView = isServerSubpage(location.pathname);

    useEffect((): void => {
        if (!selectedServerId) return;
        if (isSpecialView) return;

        if (isServerError || isChannelsError) {
            void navigate('/chat/@me', { replace: true });
            return;
        }

        if (!isPlaceholderChannels && channels) {
            if (selectedChannelId) {
                const channelExists = channels.some(
                    (c): boolean => c.id === selectedChannelId,
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
                const sortedChannels = channels.toSorted(
                    (a, b): number => a.position - b.position,
                );
                const firstChannel = sortedChannels.find(
                    (c): boolean => c.type !== 'link',
                );
                const lastChannelExists =
                    lastChannelId !== undefined &&
                    sortedChannels.some((c): boolean => c.id === lastChannelId);
                if (lastChannelId !== undefined && !lastChannelExists) {
                    dispatch(clearLastOpenedChannelForServer(selectedServerId));
                }

                const targetChannelId = lastChannelExists
                    ? lastChannelId
                    : firstChannel?.id;

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
        isSpecialView,
    ]);

    if (!selectedServerId) return null;

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <ServerBanner
                banner={server?.banner}
                loading={isLoadingServer}
                name={server?.name || ''}
                verified={server?.verified}
            />

            <div
                className="custom-scrollbar flex flex-1 flex-col overflow-y-auto"
                ref={scrollRef}
            >
                {(!channels && !isPlaceholderChannels) ||
                (!categories && !isPlaceholderCategories) ? (
                    <SidebarSkeleton />
                ) : (
                    <>
                        <div className="shrink-0 border-b border-border-subtle px-2 py-2">
                            {canViewMembers ? (
                                <ChannelItem
                                    iconComponent={Users}
                                    name="Members"
                                    type="text"
                                    onClick={(): void => {
                                        void navigate(
                                            `/chat/@server/${selectedServerId}${SERVER_SUBPAGE_PATHS.members}`,
                                        );
                                    }}
                                />
                            ) : null}
                            {(onboarding?.onboarding.selfAssignableRoleIds
                                .length ?? 0) > 0 ? (
                                <ChannelItem
                                    iconComponent={Tag}
                                    name="Self-assignable roles"
                                    type="text"
                                    onClick={(): void => {
                                        void navigate(
                                            `/chat/@server/${selectedServerId}${SERVER_SUBPAGE_PATHS.selfRoles}`,
                                        );
                                    }}
                                />
                            ) : null}
                            <ChannelItem
                                iconComponent={Hash}
                                name="Channels & Categories"
                                type="text"
                                onClick={(): void => {
                                    void navigate(
                                        `/chat/@server/${selectedServerId}${SERVER_SUBPAGE_PATHS.channelsAndCategories}`,
                                    );
                                }}
                            />
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
            </div>

            <React.Suspense fallback={null}>
                <ServerOnboardingModal serverId={selectedServerId} />
            </React.Suspense>
        </div>
    );
};
