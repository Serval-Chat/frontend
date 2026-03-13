import React from 'react';

import { Provider, useStore } from 'react-redux';

import type { RootState } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { useMobileSwipeContext } from '@/ui/MobileSwipeContext';
import { MainChat } from '@/ui/components/chat/MainChat';
import { FriendRequestList } from '@/ui/components/friends/FriendRequestList';
import { cn } from '@/utils/cn';

/**
 * @description A wrapper that intercepts Redux state to trick child components into
 * thinking they are in a specific channel/friend context. Used for rendering the
 * chat UI in the background during swipe gestures.
 */
const ProxyProvider: React.FC<{
    overrideServerId?: string | null;
    overrideChannelId?: string | null;
    overrideFriendId?: string | null;
    children: React.ReactNode;
}> = ({ overrideServerId, overrideChannelId, overrideFriendId, children }) => {
    const store = useStore<RootState>();

    const proxiedStore = React.useMemo(() => {
        const cache: {
            lastOriginalState: RootState | null;
            lastProxiedState: RootState | null;
        } = {
            lastOriginalState: null,
            lastProxiedState: null,
        };

        return {
            ...store,
            getState: () => {
                const state = store.getState();

                // If the underlying Redux state hasn't changed since our last call,
                // return the exact same cached object. Otherwise useSyncExternalStore
                // will infinite loop due to referential inequality.
                if (
                    cache.lastOriginalState === state &&
                    cache.lastProxiedState
                ) {
                    return cache.lastProxiedState;
                }

                const navOverrides: Partial<RootState['nav']> = {};
                let hasOverrides = false;

                if (overrideServerId !== undefined) {
                    navOverrides.selectedServerId = overrideServerId;
                    hasOverrides = true;
                }
                if (overrideChannelId !== undefined) {
                    navOverrides.selectedChannelId = overrideChannelId;
                    hasOverrides = true;
                }
                if (overrideFriendId !== undefined) {
                    navOverrides.selectedFriendId = overrideFriendId;
                    hasOverrides = true;
                }

                cache.lastOriginalState = state;

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
    }, [store, overrideServerId, overrideChannelId, overrideFriendId]);

    return <Provider store={proxiedStore}>{children}</Provider>;
};

/**
 * @description Main chat area content component.
 */
export const MainContent: React.FC = () => {
    const {
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        navMode,
        mobileHomeTab,
        lastOpenedChannelByServer,
    } = useAppSelector((state) => state.nav);
    const inSwipePanel = useMobileSwipeContext();

    const isNothingSelected = !selectedFriendId && !selectedChannelId;

    const conversationKey = selectedFriendId
        ? `dm-${selectedFriendId}`
        : selectedServerId && selectedChannelId
          ? `channel-${selectedServerId}-${selectedChannelId}`
          : 'none';

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
                    'max-md:hidden',
            )}
        >
            {isNothingSelected ? (
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
        </main>
    );
};
