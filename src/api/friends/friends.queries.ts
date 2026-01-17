import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
} from '@tanstack/react-query';

import { friendsApi } from './friends.api';
import type { Friend, FriendRequest } from './friends.types';

export const FRIENDS_QUERY_KEY = ['friends'] as const;
export const FRIEND_REQUESTS_QUERY_KEY = ['friend-requests'] as const;

export const useFriends = (): UseQueryResult<Friend[], Error> =>
    useQuery({
        queryKey: FRIENDS_QUERY_KEY,
        queryFn: friendsApi.getFriends,
    });

export const useSendFriendRequest = (): UseMutationResult<
    void,
    Error,
    string
> =>
    useMutation({
        mutationFn: friendsApi.sendFriendRequest,
    });

export const useIncomingRequests = (): UseQueryResult<FriendRequest[], Error> =>
    useQuery({
        queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'incoming'],
        queryFn: friendsApi.getIncomingRequests,
    });

export const useAcceptFriendRequest = (): UseMutationResult<
    void,
    Error,
    string
> =>
    useMutation({
        mutationFn: friendsApi.acceptFriendRequest,
    });

export const useRejectFriendRequest = (): UseMutationResult<
    void,
    Error,
    string
> =>
    useMutation({
        mutationFn: friendsApi.rejectFriendRequest,
    });

export const useRemoveFriend = (): UseMutationResult<void, Error, string> =>
    useMutation({
        mutationFn: friendsApi.removeFriend,
    });
