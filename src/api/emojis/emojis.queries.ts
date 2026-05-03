import {
    type UseQueryResult,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { emojisApi } from './emojis.api';
import type { Emoji } from './emojis.types';

export const emojiKeys = {
    all: ['emojis'] as const,
    detail: (id: string) => [...emojiKeys.all, 'detail', id] as const,
};

export const useEmoji = (
    emojiId: string,
    options: { enabled?: boolean } = {},
): UseQueryResult<Emoji, Error> => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: emojiKeys.detail(emojiId),
        queryFn: () => emojisApi.getEmojiById(emojiId),
        initialData: () => {
            const allEmojis = queryClient.getQueryData<Emoji[]>([
                'servers',
                'emojis',
                'all',
            ]);
            return allEmojis?.find((e) => e._id === emojiId);
        },
        staleTime: Infinity, // Emojis are static
        ...options,
    });
};
