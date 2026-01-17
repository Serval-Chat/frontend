import { apiClient } from '@/api/client';

import type { Emoji } from './emojis.types';

export const emojisApi = {
    getEmojiById: async (emojiId: string): Promise<Emoji> => {
        const response = await apiClient.get<Emoji>(
            `/api/v1/emojis/${emojiId}`
        );
        return response.data;
    },
};
