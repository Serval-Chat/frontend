import {
    type UseMutationResult,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import type { NotificationSound, User } from '@/api/users/users.types';

export const useUploadNotificationSound = (): UseMutationResult<
    NotificationSound,
    Error,
    File
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File): Promise<NotificationSound> => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.post(
                '/api/v1/notification-sounds/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );
            return response.data;
        },
        onSuccess: (newSound): void => {
            queryClient.setQueryData<User>(['me'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    settings: {
                        ...old.settings,
                        notificationSounds: (
                            old.settings?.notificationSounds || []
                        ).some((s): boolean => s.id === newSound.id)
                            ? old.settings?.notificationSounds
                            : [
                                  ...(old.settings?.notificationSounds || []),
                                  newSound,
                              ],
                    },
                };
            });
        },
    });
};

export const useDeleteNotificationSound = (): UseMutationResult<
    string,
    Error,
    string
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<string> => {
            await apiClient.delete(`/api/v1/notification-sounds/${id}`);
            return id;
        },
        onSuccess: (deletedId): void => {
            queryClient.setQueryData<User>(['me'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    settings: {
                        ...old.settings,
                        notificationSounds: (
                            old.settings?.notificationSounds || []
                        ).filter((s): boolean => s.id !== deletedId),
                    },
                };
            });
        },
    });
};
