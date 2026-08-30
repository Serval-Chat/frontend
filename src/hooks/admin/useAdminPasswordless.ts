import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminPasswordlessResetResult } from '@/api/admin/passwordless.api';
import { adminPasswordlessApi } from '@/api/admin/passwordless.api';
import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';

export const useAdminResetPasswordless = (): UseMutationResult<
    AdminPasswordlessResetResult,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string): Promise<AdminPasswordlessResetResult> =>
            adminPasswordlessApi.reset(userId),
        onSuccess: (_, userId): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to reset account.'),
                'error',
            );
        },
    });
};
