import { useMutation, useQuery } from '@tanstack/react-query';

import { friendsApi } from './friends.api';

export const FRIENDS_QUERY_KEY = ['friends'] as const;

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

export const useRemoveFriend = () => {
    return useMutation({
        mutationFn: friendsApi.removeFriend,
    });
};
