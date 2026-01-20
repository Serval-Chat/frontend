import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { usersApi } from './users.api';
import type { User } from './users.types';

export const useMe = (): UseQueryResult<User, Error> =>
    useQuery({
        queryKey: ['me'],
        queryFn: usersApi.getMe,
    });

export const useUserById = (
    id: string,
    options: { enabled?: boolean } = {}
): UseQueryResult<User, Error> =>
    useQuery({
        queryKey: ['user', id],
        queryFn: () => usersApi.getById(id),
        enabled: (options.enabled ?? true) && !!id,
    });

export const useUpdateBio = (): UseMutationResult<
    { bio: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateBio,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, bio: data.bio } : old
            );
        },
    });
};

export const useUpdatePronouns = (): UseMutationResult<
    { pronouns: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updatePronouns,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, pronouns: data.pronouns } : old
            );
        },
    });
};

export const useUpdateDisplayName = (): UseMutationResult<
    { displayName: string | null },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateDisplayName,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, displayName: data.displayName } : old
            );
        },
    });
};

export const useUpdateUsername = (): UseMutationResult<
    { username: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateUsername,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, username: data.username } : old
            );
        },
    });
};

export const useUpdateStyle = (): UseMutationResult<
    {
        usernameFont?: string;
        usernameGradient?: {
            enabled: boolean;
            colors: string[];
            angle: number;
        };
        usernameGlow?: { enabled: boolean; color: string; intensity: number };
    },
    Error,
    {
        usernameFont?: string;
        usernameGradient?: {
            enabled: boolean;
            colors: string[];
            angle: number;
        };
        usernameGlow?: { enabled: boolean; color?: string; intensity: number };
    }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateStyle,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old
                    ? {
                          ...old,
                          usernameFont: data.usernameFont ?? old.usernameFont,
                          usernameGradient:
                              data.usernameGradient ?? old.usernameGradient,
                          usernameGlow: data.usernameGlow ?? old.usernameGlow,
                      }
                    : old
            );
        },
    });
};

export const useUpdateLanguage = (): UseMutationResult<
    { language: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateLanguage,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, language: data.language } : old
            );
        },
    });
};

export const useUpdateStatus = (): UseMutationResult<
    { customStatus: User['customStatus'] },
    Error,
    {
        text?: string;
        emoji?: string;
        expiresAt?: string | null;
        expiresInMinutes?: number;
        clear?: boolean;
    }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.updateStatus,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) => {
                if (!old) return old;
                return { ...old, customStatus: data.customStatus };
            });
        },
    });
};
