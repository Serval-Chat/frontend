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
import type { Friend, FriendRequest } from './friends.types';

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
        staleTime: 5 * 60 * 1000,
    });
};

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
        enabled: hasAuthToken(),
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
