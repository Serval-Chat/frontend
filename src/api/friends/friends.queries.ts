import { useMutation, useQuery } from '@tanstack/react-query';

import { friendsApi } from './friends.api';

export const FRIENDS_QUERY_KEY = ['friends'] as const;
export const FRIEND_REQUESTS_QUERY_KEY = ['friend-requests'] as const;

export const useFriends = () => {
    return useQuery({
        queryKey: FRIENDS_QUERY_KEY,
        queryFn: friendsApi.getFriends,
    });
};

export const useSendFriendRequest = () => {
    return useMutation({
        mutationFn: friendsApi.sendFriendRequest,
    });
};

export const useIncomingRequests = () => {
    return useQuery({
        queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'incoming'],
        queryFn: friendsApi.getIncomingRequests,
    });
};

export const useAcceptFriendRequest = () => {
    return useMutation({
        mutationFn: friendsApi.acceptFriendRequest,
    });
};

export const useRejectFriendRequest = () => {
    return useMutation({
        mutationFn: friendsApi.rejectFriendRequest,
    });
};

export const useRemoveFriend = () => {
    return useMutation({
        mutationFn: friendsApi.removeFriend,
    });
};
