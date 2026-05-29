import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { warningsApi } from './warnings.api';
import type { Warning } from './warnings.types';

export const useMyWarnings = (
    acknowledged?: boolean,
): UseQueryResult<Warning[], Error> =>
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
): UseQueryResult<Warning[], Error> =>
    useQuery({
        queryKey: ['admin-user-warnings', userId],
        queryFn: (): Promise<Warning[]> => warningsApi.getUserWarnings(userId),
        enabled: !!userId,
    });
