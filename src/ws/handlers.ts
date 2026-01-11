import { type Dispatch } from '@reduxjs/toolkit';
import { type QueryClient } from '@tanstack/react-query';

import {
    FRIENDS_QUERY_KEY,
    FRIEND_REQUESTS_QUERY_KEY,
} from '@/api/friends/friends.queries';
import {
    setOnlineUsers,
    setUserOffline,
    setUserOnline,
    updateUserStatus,
} from '@/store/slices/presenceSlice';

import { wsClient } from './client';
import {
    type IMessageDm,
    type IMessageServer,
    type IPresenceSyncEvent,
    type IStatusUpdatedEvent,
    type IUserOfflineEvent,
    type IUserOnlineEvent,
    type IWsAuthenticatedEvent,
    type IWsErrorEvent,
    WsEvents,
} from './events';

/**
 * @description Global WS handlers
 */
export const setupGlobalWsHandlers = (
    queryClient: QueryClient,
    dispatch: Dispatch
) => {
    let currentUser: { id: string; username: string } | null = null;

    wsClient.on<IWsErrorEvent>(WsEvents.ERROR, (payload) => {
        console.error('[WS] Global Error:', payload.message);
    });

    wsClient.on<IWsAuthenticatedEvent>(WsEvents.AUTHENTICATED, (payload) => {
        if (payload.user) {
            currentUser = payload.user;
            dispatch(
                setUserOnline({
                    userId: payload.user.id,
                    username: payload.user.username,
                    status: undefined,
                })
            );
        }
    });

    // Friendship events
    wsClient.on(WsEvents.FRIEND_ADDED, () => {
        queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
    });

    wsClient.on(WsEvents.FRIEND_REMOVED, () => {
        queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
    });

    wsClient.on(WsEvents.INCOMING_REQUEST_ADDED, () => {
        queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
    });

    wsClient.on(WsEvents.INCOMING_REQUEST_REMOVED, () => {
        queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY });
    });

    // Presence events
    wsClient.on<IPresenceSyncEvent>(WsEvents.PRESENCE_SYNC, (payload) => {
        const onlineUsers = [...payload.online];

        if (
            currentUser &&
            !onlineUsers.some((u) => u.userId === currentUser!.id)
        ) {
            onlineUsers.push({
                userId: currentUser.id,
                username: currentUser.username,
                status: undefined,
            });
        }

        dispatch(setOnlineUsers(onlineUsers));
    });

    wsClient.on<IUserOnlineEvent>(WsEvents.USER_ONLINE, (payload) => {
        dispatch(setUserOnline(payload));
    });

    wsClient.on<IUserOfflineEvent>(WsEvents.USER_OFFLINE, (payload) => {
        dispatch(setUserOffline(payload));
    });

    wsClient.on<IStatusUpdatedEvent>(WsEvents.STATUS_UPDATED, (payload) => {
        dispatch(updateUserStatus(payload));
    });
};

/**
 * @description WS handlers
 */
export const wsHandlers = {
    onMessageDm: (handler: (message: IMessageDm) => void) => {
        return wsClient.on(WsEvents.MESSAGE_DM, handler);
    },
    onMessageServer: (handler: (message: IMessageServer) => void) => {
        return wsClient.on(WsEvents.MESSAGE_SERVER, handler);
    },
};
