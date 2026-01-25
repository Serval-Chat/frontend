import React from 'react';

import { useQueries } from '@tanstack/react-query';

import { serversApi } from '@/api/servers/servers.api';
import { useServers } from '@/api/servers/servers.queries';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';

export const useCustomEmojis = (): {
    customCategories: CustomEmojiCategory[];
    isLoading: boolean;
} => {
    const { data: servers } = useServers();

    const emojiQueries = useQueries({
        queries: (servers || []).map((server) => ({
            queryKey: ['servers', 'emojis', server._id],
            queryFn: () => serversApi.getEmojis(server._id),
            staleTime: 1000 * 60 * 5, // 5 minutes
        })),
    });

    const customCategories = React.useMemo(() => {
        if (!servers) return [];

        return servers
            .map((server, index) => {
                const query = emojiQueries[index];
                const emojis = query?.data;
                if (!emojis || emojis.length === 0) return null;

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
    }, [servers, emojiQueries]); // eslint-disable-line @tanstack/query/no-unstable-deps

    return {
        customCategories,
        isLoading: emojiQueries.some((q) => q.isLoading),
    };
};
