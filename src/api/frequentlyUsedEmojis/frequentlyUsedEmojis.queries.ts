import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { hasAuthToken } from '@/utils/authToken';

import { frequentlyUsedEmojisApi } from './frequentlyUsedEmojis.api';
import type { FrequentlyUsedEmojiEntry } from './frequentlyUsedEmojis.types';

export const frequentlyUsedEmojisKeys = {
    all: ['frequentlyUsedEmojis'] as const,
};

export const useFrequentlyUsedEmojisQuery = (): UseQueryResult<
    FrequentlyUsedEmojiEntry[]
> =>
    useQuery({
        queryKey: frequentlyUsedEmojisKeys.all,
        queryFn: async (): Promise<FrequentlyUsedEmojiEntry[]> =>
            (await frequentlyUsedEmojisApi.get()).emojis,
        enabled: hasAuthToken(),
        staleTime: Infinity,
    });

export const useUpdateFrequentlyUsedEmojis = (): UseMutationResult<
    { message: string; emojis: FrequentlyUsedEmojiEntry[] },
    Error,
    FrequentlyUsedEmojiEntry[]
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: frequentlyUsedEmojisApi.update,
        onSuccess: (data): void => {
            queryClient.setQueryData(
                frequentlyUsedEmojisKeys.all,
                data.emojis,
            );
        },
    });
};
