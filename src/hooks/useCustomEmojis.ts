import React from 'react';

import { useAllServerEmojis, useServers } from '@/api/servers/servers.queries';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';

export const useCustomEmojis = (options?: {
    enabled?: boolean;
}): {
    customCategories: CustomEmojiCategory[];
    isLoading: boolean;
} => {
    const { data: servers } = useServers();
    const { data: allEmojis, isLoading: isEmojisLoading } = useAllServerEmojis({
        enabled: options?.enabled ?? true,
    });

    const customCategories = React.useMemo(() => {
        if (!servers || !allEmojis) return [];

        return servers
            .map((server) => {
                const emojis = allEmojis.filter(
                    (e) => e.serverId?.toString() === server._id,
                );
                if (emojis.length === 0) return null;

                return {
                    id: server._id,
                    name: server.name,
                    icon: server.icon,
                    emojis: emojis.map((e) => ({
                        id: e._id,
                        name: e.name,
                        url: e.imageUrl,
                    })),
                } as CustomEmojiCategory;
            })
            .filter((cat): cat is CustomEmojiCategory => cat !== null);
    }, [servers, allEmojis]);

    return {
        customCategories,
        isLoading: isEmojisLoading,
    };
};
