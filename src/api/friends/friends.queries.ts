import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { User } from '@/api/users/users.types';
import { hasAuthToken } from '@/utils/authToken';

import { friendsApi } from './friends.api';
import type {
    AcceptFriendRequestResponse,
    Friend,
    FriendRequest,
    SendFriendRequestResponse,
} from './friends.types';

export const FRIENDS_QUERY_KEY = ['friends'] as const;
export const FRIEND_REQUESTS_QUERY_KEY = ['friend-requests'] as const;
export const FRIEND_PROFILES_QUERY_KEY = ['friend-profiles'] as const;

export const useFriends = (
    options: { enabled?: boolean } = {},
): UseQueryResult<Friend[], Error> =>
    useQuery({
        queryKey: FRIENDS_QUERY_KEY,
        queryFn: friendsApi.getFriends,
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });

export const useFriendProfiles = (
    options: { enabled?: boolean } = {},
): UseQueryResult<User[], Error> => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: FRIEND_PROFILES_QUERY_KEY,
        queryFn: async () => {
            const profiles = await friendsApi.getFriendProfiles();
            for (const profile of profiles) {
                const id = profile._id;
                if (id) {
                    queryClient.setQueryData(['user', id], profile);
                }
            }
            return profiles;
        },
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });
};

export const useSendFriendRequest = (): UseMutationResult<
    SendFriendRequestResponse,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.sendFriendRequest,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'outgoing'],
            });
        },
    });
};

export const useIncomingRequests = (): UseQueryResult<FriendRequest[], Error> =>
    useQuery({
        queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'incoming'],
        queryFn: friendsApi.getIncomingRequests,
        enabled: hasAuthToken(),
    });

export const useOutgoingRequests = (): UseQueryResult<FriendRequest[], Error> =>
    useQuery({
        queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'outgoing'],
        queryFn: friendsApi.getOutgoingRequests,
        enabled: hasAuthToken(),
    });

export const useAcceptFriendRequest = (): UseMutationResult<
    AcceptFriendRequestResponse,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.acceptFriendRequest,
        onSuccess: ({ friend }) => {
            if (friend) {
                queryClient.setQueryData<Friend[]>(
                    FRIENDS_QUERY_KEY,
                    (friends) =>
                        friends?.some((existing) => existing._id === friend._id)
                            ? friends
                            : [...(friends ?? []), friend],
                );
            }
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        },
    });
};

export const useRejectFriendRequest = (): UseMutationResult<
    void,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.rejectFriendRequest,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        },
    });
};

export const useCancelFriendRequest = (): UseMutationResult<
    void,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.cancelFriendRequest,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        },
    });
};

export const useRemoveFriend = (): UseMutationResult<void, Error, string> =>
    useMutation({
        mutationFn: friendsApi.removeFriend,
    });
