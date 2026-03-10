import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { hasAuthToken } from '@/utils/authToken';

import { usersApi } from './users.api';
import type {
    User,
    UsernameFont,
    UsernameGlow,
    UsernameGradient,
} from './users.types';

export const useMe = (): UseQueryResult<User, Error> =>
    useQuery({
        queryKey: ['me'],
        queryFn: usersApi.getMe,
        enabled: hasAuthToken(),
    });

export const useUserById = (
    id: string,
    options: { enabled?: boolean } = {},
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
                old ? { ...old, bio: data.bio } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
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
                old ? { ...old, pronouns: data.pronouns } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
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
                old ? { ...old, displayName: data.displayName } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
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
                old ? { ...old, username: data.username } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};

export const useUpdateStyle = (): UseMutationResult<
    {
        message: string;
        usernameFont?: UsernameFont;
        usernameGradient?: UsernameGradient;
        usernameGlow?: UsernameGlow;
    },
    Error,
    {
        usernameFont?: UsernameFont;
        usernameGradient?: UsernameGradient;
        usernameGlow?: UsernameGlow;
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
                    : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
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
                old ? { ...old, language: data.language } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
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
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};

export const useUpdateProfilePicture = (): UseMutationResult<
    { message: string; profilePicture: string },
    Error,
    File
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateProfilePicture,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, profilePicture: data.profilePicture } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};

export const useUpdateBanner = (): UseMutationResult<
    { message: string; banner: string },
    Error,
    File
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateBanner,
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, banner: data.banner } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};
