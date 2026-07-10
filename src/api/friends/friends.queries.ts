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
): UseQueryResult<Friend[]> =>
    useQuery({
        queryKey: FRIENDS_QUERY_KEY,
        queryFn: friendsApi.getFriends,
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });

export const useFriendProfiles = (
    options: { enabled?: boolean } = {},
): UseQueryResult<User[]> => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: FRIEND_PROFILES_QUERY_KEY,
        queryFn: async (): Promise<User[]> => {
            const profiles = await friendsApi.getFriendProfiles();
            for (const profile of profiles) {
                const id = profile.id;
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
        onSuccess: ({ request }): void => {
            queryClient.setQueryData<FriendRequest[]>(
                [...FRIEND_REQUESTS_QUERY_KEY, 'outgoing'],
                (existing): FriendRequest[] =>
                    existing?.some(
                        (r): boolean => r.id === request.id,
                    )
                        ? existing
                        : [...(existing ?? []), request],
            );
            void queryClient.invalidateQueries({
                queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'outgoing'],
            });
        },
    });
};

export const useIncomingRequests = (): UseQueryResult<FriendRequest[]> =>
    useQuery({
        queryKey: [...FRIEND_REQUESTS_QUERY_KEY, 'incoming'],
        queryFn: friendsApi.getIncomingRequests,
        enabled: hasAuthToken(),
    });

export const useOutgoingRequests = (): UseQueryResult<FriendRequest[]> =>
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
        onSuccess: ({ friend }): void => {
            if (friend) {
                queryClient.setQueryData<Friend[]>(
                    FRIENDS_QUERY_KEY,
                    (friends): Friend[] =>
                        friends?.some(
                            (existing): boolean => existing.id === friend.id,
                        )
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
        onSuccess: (): void => {
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
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        },
    });
};

export const useRemoveFriend = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.removeFriend,
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_PROFILES_QUERY_KEY,
            });
        },
    });
};

export const useTogglePinFriend = (): UseMutationResult<
    { friendId: string; isPinned: boolean },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: friendsApi.togglePinFriend,
        onSuccess: ({ friendId, isPinned }): void => {
            for (const queryKey of [
                FRIENDS_QUERY_KEY,
                FRIEND_PROFILES_QUERY_KEY,
            ]) {
                queryClient.setQueriesData<Friend[]>(
                    { queryKey },
                    (old): Friend[] | undefined =>
                        old?.map(
                            (f): Friend =>
                                f.id === friendId ? { ...f, isPinned } : f,
                        ),
                );
            }
        },
    });
};
