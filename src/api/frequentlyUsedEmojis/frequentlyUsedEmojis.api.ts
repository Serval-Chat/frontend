import { apiClient } from '@/api/client';

import type { FrequentlyUsedEmojiEntry } from './frequentlyUsedEmojis.types';

export const frequentlyUsedEmojisApi = {
    get: (): Promise<{ emojis: FrequentlyUsedEmojiEntry[] }> =>
        apiClient
            .get<{ emojis: FrequentlyUsedEmojiEntry[] }>(
                '/api/v1/settings/frequently-used-emojis',
            )
            .then((r): { emojis: FrequentlyUsedEmojiEntry[] } => r.data),

    update: (
        emojis: FrequentlyUsedEmojiEntry[],
    ): Promise<{ message: string; emojis: FrequentlyUsedEmojiEntry[] }> =>
        apiClient
            .put<{
                message: string;
                emojis: FrequentlyUsedEmojiEntry[];
            }>('/api/v1/settings/frequently-used-emojis', { emojis })
            .then(
                (r): { message: string; emojis: FrequentlyUsedEmojiEntry[] } =>
                    r.data,
            ),
};
