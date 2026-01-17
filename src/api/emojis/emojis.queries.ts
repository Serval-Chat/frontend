import { useQuery } from '@tanstack/react-query';

import { emojisApi } from './emojis.api';

export const emojiKeys = {
    all: ['emojis'] as const,
    detail: (id: string) => [...emojiKeys.all, 'detail', id] as const,
};

export const useEmoji = (
    emojiId: string,
    options: { enabled?: boolean } = {}
) => {
    return useQuery({
        queryKey: emojiKeys.detail(emojiId),
        queryFn: () => emojisApi.getEmojiById(emojiId),
        staleTime: Infinity, // Emojis are static
        ...options,
    });
};
