import React from 'react';

import { useAllServerEmojis, useServers } from '@/api/servers/servers.queries';
import { usePermissions } from '@/hooks/usePermissions';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';

export const useCustomEmojis = (options?: {
    enabled?: boolean;
    serverId?: string | null;
    channelId?: string | null;
}): {
    customCategories: CustomEmojiCategory[];
    isLoading: boolean;
    hasExternalEmojiPermission: boolean;
} => {
    const { data: servers } = useServers();
    const { data: allEmojis, isLoading: isEmojisLoading } = useAllServerEmojis({
        enabled: options?.enabled ?? true,
    });
    const { hasPermission } = usePermissions(
        options?.serverId ?? null,
        options?.channelId,
        { enabled: !!options?.serverId },
    );
    const hasExternalEmojiPermission =
        !options?.serverId || hasPermission('useExternalEmojisAndStickers');

    const customCategories = React.useMemo((): CustomEmojiCategory[] => {
        if (!servers || !allEmojis) return [];

        return servers
            .map((server): CustomEmojiCategory | null => {
                if (
                    !hasExternalEmojiPermission &&
                    server.id !== options?.serverId
                )
                    return null;

                const emojis = allEmojis.filter(
                    (e): boolean => e.serverId?.toString() === server.id,
                );
                if (emojis.length === 0) return null;

                return {
                    id: server.id,
                    name: server.name,
                    icon: server.icon,
                    emojis: emojis.map(
                        (
                            e,
                        ): {
                            id: string;
                            name: string;
                            url: string;
                            serverId: string;
                        } => ({
                            id: e.id,
                            name: e.name,
                            url: e.imageUrl,
                            serverId: e.serverId,
                        }),
                    ),
                } as CustomEmojiCategory;
            })
            .filter((cat): cat is CustomEmojiCategory => cat !== null);
    }, [servers, allEmojis, hasExternalEmojiPermission, options?.serverId]);

    return {
        customCategories,
        isLoading: isEmojisLoading,
        hasExternalEmojiPermission,
    };
};
