import React from 'react';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Provider, useStore } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import type { RootState } from '@/store';
import {
    useAppDispatch,
    useAppSelector,
    useAppShallowSelector,
} from '@/store/hooks';
import {
    type SplitViewConversation,
    type SplitViewSide,
    closeSplitView,
    closeSplitViewToConversation,
    toggleMobileMemberListForSplitView,
} from '@/store/slices/navSlice';
import { useMobileSwipeContext } from '@/ui/MobileSwipeContext';
import { TertiarySidebar } from '@/ui/TertiarySidebar';
import { MainChat } from '@/ui/components/chat/MainChat';
import { IconButton } from '@/ui/components/common/IconButton';
import { Text } from '@/ui/components/common/Text';
import { FriendRequestList } from '@/ui/components/friends/FriendRequestList';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { SERVER_SUBPAGE_PATHS } from '@/utils/serverSubpages';

const ActiveVoiceRoom = React.lazy(
    (): Promise<{ default: never } | { default: () => null }> =>
        import('@/ui/components/chat/ActiveVoiceRoom').then(
            (m): { default: () => null } => ({
                default: m.ActiveVoiceRoom,
            }),
        ),
);

const ServerRolesPage = React.lazy(() =>
    import('@/ui/components/servers/onboarding/ServerRolesPage').then((m) => ({
        default: m.ServerRolesPage,
    })),
);

const ServerChannelsPage = React.lazy(() =>
    import('@/ui/components/servers/onboarding/ServerChannelsPage').then(
        (m) => ({
            default: m.ServerChannelsPage,
        }),
    ),
);

const ServerMembersPage = React.lazy(() =>
    import('@/ui/components/servers/ServerMembersPage').then((m) => ({
        default: m.ServerMembersPage,
    })),
);

const ActiveVoiceRoomMount = React.memo(() => {
    const hasActiveVoiceRoom = useAppSelector(
        (state): boolean =>
            !!state.voice.activeVoiceServerId &&
            !!state.voice.activeVoiceChannelId,
    );

    if (!hasActiveVoiceRoom) return null;

    return (
        <React.Suspense fallback={null}>
            <ActiveVoiceRoom />
        </React.Suspense>
    );
});
ActiveVoiceRoomMount.displayName = 'ActiveVoiceRoomMount';

/**
 * @description A wrapper that intercepts Redux state to trick child components into
 * thinking they are in a specific channel/friend context. Used for rendering the
 * chat UI in the background during swipe gestures.
 */
const ProxyProvider = ({
    overrideServerId,
    overrideChannelId,
    overrideFriendId,
    overrideTargetMessageId,
    children,
}: {
    overrideServerId?: string | null;
    overrideChannelId?: string | null;
    overrideFriendId?: string | null;
    overrideTargetMessageId?: string | null;
    children: React.ReactNode;
}) => {
    const store = useStore<RootState>();
    const overridesRef = React.useRef({
        overrideServerId,
        overrideChannelId,
        overrideFriendId,
        overrideTargetMessageId,
    });

    React.useLayoutEffect((): void => {
        overridesRef.current = {
            overrideServerId,
            overrideChannelId,
            overrideFriendId,
            overrideTargetMessageId,
        };
    }, [
        overrideServerId,
        overrideChannelId,
        overrideFriendId,
        overrideTargetMessageId,
    ]);

    // A split pane becoming the main chat should not replace the Provider store.
    const proxiedStore = React.useMemo(() => {
        const cache: {
            lastOriginalState: RootState | null;
            lastOverrides: typeof overridesRef.current | null;
            lastProxiedState: RootState | null;
        } = {
            lastOriginalState: null,
            lastOverrides: null,
            lastProxiedState: null,
        };

        return {
            ...store,
            getState: () => {
                const state = store.getState();
                const overrides = overridesRef.current;

                // useSyncExternalStore needs the same object until either source changes.
                if (
                    cache.lastOriginalState === state &&
                    cache.lastOverrides === overrides &&
                    cache.lastProxiedState
                ) {
                    return cache.lastProxiedState;
                }

                const navOverrides: Partial<RootState['nav']> = {};
                let hasOverrides = false;

                if (overrides.overrideServerId !== undefined) {
                    navOverrides.selectedServerId = overrides.overrideServerId;
                    hasOverrides = true;
                }
                if (overrides.overrideChannelId !== undefined) {
                    navOverrides.selectedChannelId =
                        overrides.overrideChannelId;
                    hasOverrides = true;
                }
                if (overrides.overrideFriendId !== undefined) {
                    navOverrides.selectedFriendId = overrides.overrideFriendId;
                    hasOverrides = true;
                }
                if (overrides.overrideTargetMessageId !== undefined) {
                    navOverrides.targetMessageId =
                        overrides.overrideTargetMessageId;
                    hasOverrides = true;
                }

                cache.lastOriginalState = state;
                cache.lastOverrides = overrides;

                if (!hasOverrides) {
                    cache.lastProxiedState = state;
                    return state;
                }

                cache.lastProxiedState = {
                    ...state,
                    nav: {
                        ...state.nav,
                        ...navOverrides,
                    },
                };

                return cache.lastProxiedState;
            },
        };
    }, [store]);

    return <Provider store={proxiedStore}>{children}</Provider>;
};

const getConversationKey = (
    conversation: SplitViewConversation | null,
): string => {
    if (!conversation) return 'none';
    if (conversation.type === 'dm') return `dm-${conversation.friendId}`;
    return `channel-${conversation.serverId}-${conversation.channelId}`;
};

const SplitViewPane = ({
    side,
    conversation,
    isSplitViewPane = true,
}: {
    side: SplitViewSide;
    conversation: SplitViewConversation | null;
    isSplitViewPane?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { splitView, activeMobileMemberListSide } = useAppShallowSelector(
        (state) => ({
            splitView: state.nav.splitView,
            activeMobileMemberListSide: state.nav.mobileMemberListSplitViewSide,
        }),
    );
    const isMobileMemberListOpen = activeMobileMemberListSide === side;
    const isAnySplitMemberListOpen = activeMobileMemberListSide !== null;

    if (!conversation) {
        return (
            <Box className="chat-background flex min-w-0 flex-1 items-center justify-center px-6 text-center">
                <Text className="max-w-64 text-muted-foreground" size="sm">
                    Use a channel or DM context menu to add a chat here.
                </Text>
            </Box>
        );
    }

    const isDm = conversation.type === 'dm';

    return (
        <Box className="chat-background flex min-w-0 flex-1 flex-col overflow-hidden">
            <ProxyProvider
                overrideChannelId={
                    isSplitViewPane
                        ? isDm
                            ? null
                            : conversation.channelId
                        : undefined
                }
                overrideFriendId={
                    isSplitViewPane
                        ? isDm
                            ? conversation.friendId
                            : null
                        : undefined
                }
                overrideServerId={
                    isSplitViewPane
                        ? isDm
                            ? null
                            : conversation.serverId
                        : undefined
                }
                overrideTargetMessageId={isSplitViewPane ? null : undefined}
            >
                <MainChat
                    headerActions={
                        isSplitViewPane ? (
                            <IconButton
                                className="h-8 w-8"
                                icon={X}
                                iconSize={15}
                                title={`Close ${side} split pane`}
                                variant="ghost"
                                onClick={(): void => {
                                    const otherSide: SplitViewSide =
                                        side === 'left' ? 'right' : 'left';
                                    const remaining = splitView[otherSide];

                                    if (remaining) {
                                        if (remaining.type === 'channel') {
                                            void navigate(
                                                `/chat/@server/${remaining.serverId}/channel/${remaining.channelId}`,
                                            );
                                        } else if (remaining.type === 'dm') {
                                            void navigate(
                                                `/chat/@user/${remaining.friendId}`,
                                            );
                                        }
                                        dispatch(
                                            closeSplitViewToConversation(
                                                remaining,
                                            ),
                                        );
                                    } else {
                                        dispatch(closeSplitView());
                                    }
                                }}
                            />
                        ) : undefined
                    }
                    hideMemberListButton={
                        isSplitViewPane && isAnySplitMemberListOpen
                    }
                    isMemberListOpen={
                        isSplitViewPane ? isMobileMemberListOpen : undefined
                    }
                    key={getConversationKey(conversation)}
                    requireUrlMatch={!isSplitViewPane}
                    onToggleMemberList={
                        isSplitViewPane
                            ? (): {
                                  payload: SplitViewSide;
                                  type: 'nav/toggleMobileMemberListForSplitView';
                              } =>
                                  dispatch(
                                      toggleMobileMemberListForSplitView(side),
                                  )
                            : undefined
                    }
                />
                {isSplitViewPane && isMobileMemberListOpen
                    ? createPortal(
                          <div className="fixed inset-0 z-[var(--z-index-top)] md:hidden">
                              <TertiarySidebar
                                  ignoreUrlMatch
                                  selectedFriendId={null}
                                  selectedServerId={
                                      conversation.type === 'channel'
                                          ? conversation.serverId
                                          : null
                                  }
                                  onMobileClose={(): {
                                      payload: SplitViewSide;
                                      type: 'nav/toggleMobileMemberListForSplitView';
                                  } =>
                                      dispatch(
                                          toggleMobileMemberListForSplitView(
                                              side,
                                          ),
                                      )
                                  }
                              />
                          </div>,
                          document.body,
                      )
                    : null}
            </ProxyProvider>
        </Box>
    );
};

/**
 * @description Main chat area content component.
 */
export const MainContent = () => {
    const {
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        navMode,
        mobileHomeTab,
        lastOpenedChannelByServer,
        splitView,
    } = useAppShallowSelector((state) => ({
        selectedFriendId: state.nav.selectedFriendId,
        selectedServerId: state.nav.selectedServerId,
        selectedChannelId: state.nav.selectedChannelId,
        navMode: state.nav.navMode,
        mobileHomeTab: state.nav.mobileHomeTab,
        lastOpenedChannelByServer: state.nav.lastOpenedChannelByServer,
        splitView: state.nav.splitView,
    }));
    const inSwipePanel = useMobileSwipeContext();
    const location = useLocation();

    const isRolesView = location.pathname.endsWith(
        SERVER_SUBPAGE_PATHS.selfRoles,
    );
    const isChannelsView = location.pathname.endsWith(
        SERVER_SUBPAGE_PATHS.channelsAndCategories,
    );
    const isMembersView = location.pathname.endsWith(
        SERVER_SUBPAGE_PATHS.members,
    );

    const isNothingSelected = !selectedFriendId && !selectedChannelId;
    const isSplitViewActive = !!(splitView.left || splitView.right);

    const conversationKey = selectedFriendId
        ? `dm-${selectedFriendId}`
        : selectedServerId && selectedChannelId
          ? `channel-${selectedServerId}-${selectedChannelId}`
          : 'none';
    const routeConversation: SplitViewConversation | null = selectedFriendId
        ? { type: 'dm', friendId: selectedFriendId }
        : selectedServerId && selectedChannelId
          ? {
                type: 'channel',
                serverId: selectedServerId,
                channelId: selectedChannelId,
            }
          : null;

    return (
        <main
            className={cn(
                'relative z-content flex flex-1 flex-col overflow-hidden',
                'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                !inSwipePanel &&
                    navMode === 'friends' &&
                    isNothingSelected &&
                    mobileHomeTab === 'friends' &&
                    'max-md:hidden',
                !inSwipePanel &&
                    navMode === 'servers' &&
                    isNothingSelected &&
                    !isRolesView &&
                    !isChannelsView &&
                    !isMembersView &&
                    'max-md:hidden',
            )}
        >
            {isRolesView ? (
                <React.Suspense fallback={null}>
                    <ServerRolesPage />
                </React.Suspense>
            ) : isChannelsView ? (
                <React.Suspense fallback={null}>
                    <ServerChannelsPage />
                </React.Suspense>
            ) : isMembersView ? (
                <React.Suspense fallback={null}>
                    <ServerMembersPage />
                </React.Suspense>
            ) : isSplitViewActive || routeConversation ? (
                <Box className="chat-background flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                    <>
                        {isSplitViewActive ? (
                            <SplitViewPane
                                conversation={splitView.left}
                                key={
                                    splitView.left
                                        ? getConversationKey(splitView.left)
                                        : 'empty-left'
                                }
                                side="left"
                            />
                        ) : routeConversation ? (
                            <SplitViewPane
                                conversation={routeConversation}
                                isSplitViewPane={false}
                                key={getConversationKey(routeConversation)}
                                side="left"
                            />
                        ) : null}
                        {isSplitViewActive ? (
                            <Box className="h-px shrink-0 bg-border-subtle md:h-full md:w-px" />
                        ) : null}
                        {isSplitViewActive ? (
                            <SplitViewPane
                                conversation={splitView.right}
                                key={
                                    splitView.right
                                        ? getConversationKey(splitView.right)
                                        : 'empty-right'
                                }
                                side="right"
                            />
                        ) : null}
                    </>
                </Box>
            ) : isNothingSelected ? (
                navMode === 'friends' ? (
                    <FriendRequestList />
                ) : (
                    // On server list, if we have a last opened channel, render it in the
                    // background via ProxyProvider so it is visible during the swipe-left gesture.
                    lastOpenedChannelByServer[selectedServerId || ''] && (
                        <ProxyProvider
                            overrideChannelId={
                                lastOpenedChannelByServer[
                                    selectedServerId || ''
                                ]
                            }
                            overrideServerId={selectedServerId}
                            overrideTargetMessageId={null}
                        >
                            <MainChat
                                key={`channel-${selectedServerId}-${lastOpenedChannelByServer[selectedServerId || '']}`}
                            />
                        </ProxyProvider>
                    )
                )
            ) : (
                <MainChat key={conversationKey} />
            )}
            <ActiveVoiceRoomMount />
        </main>
    );
};
