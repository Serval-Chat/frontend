import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';

import { warningsApi } from './warnings.api';
import type { Warning } from './warnings.types';

export const useMyWarnings = (
    acknowledged?: boolean,
): UseQueryResult<Warning[]> =>
    useQuery({
        queryKey: ['warnings', { acknowledged }],
        queryFn: (): Promise<Warning[]> =>
            warningsApi.getMyWarnings(acknowledged),
    });

export const useAcknowledgeWarning = (): UseMutationResult<
    Warning,
    Error,
    string
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: warningsApi.acknowledgeWarning,
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['warnings'] });
        },
    });
};

export const useAdminUserWarnings = (
    userId: string,
): UseQueryResult<Warning[]> =>
    useQuery({
        queryKey: ['admin-user-warnings', userId],
        queryFn: (): Promise<Warning[]> => warningsApi.getUserWarnings(userId),
        enabled: !!userId,
    });

export const useWarnUser = (): UseMutationResult<
    Warning,
    Error,
    { userId: string; message: string; duration?: number }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ userId, message, duration }): Promise<Warning> =>
            warningsApi.warnUser(userId, message, duration),
        onSuccess: (_, variables): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-warnings', variables.userId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', variables.userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            showToast('Warning issued successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to issue warning'),
                'error',
            );
        },
    });
};
