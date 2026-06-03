import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useEmoji } from '@/api/emojis/emojis.queries';
import type { Emoji } from '@/api/emojis/emojis.types';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';

interface UseEmojiInfoProps {
    emojiId?: string;
    serverId?: string;
    enabled?: boolean;
}

export interface UseEmojiInfoReturn {
    emoji: Emoji | undefined;
    server: Server | undefined;
    isLoading: boolean;
    isError: boolean;
    emojiError: Error | null;
    serverError: Error | null;
}

export const useEmojiInfo = ({
    emojiId,
    serverId,
    enabled = true,
}: UseEmojiInfoProps): UseEmojiInfoReturn => {
    const queryClient = useQueryClient();

    const emojiQuery = useEmoji(emojiId!, {
        enabled: enabled && !!emojiId,
    });

    const serverQuery = useQuery<Server, Error>({
        queryKey: SERVERS_QUERY_KEYS.details(serverId!),
        queryFn: async (): Promise<Server> => {
            try {
                const result = await serversApi.getServerDetails(serverId!);
                return result;
            } catch (error) {
                console.error('[useEmojiInfo] Error fetching server:', error);
                throw error;
            }
        },
        enabled: enabled && !!serverId,
        initialData: (): Server | undefined => {
            const servers = queryClient.getQueryData<Server[]>(
                SERVERS_QUERY_KEYS.list,
            );
            return servers?.find((s): boolean => s.id === serverId);
        },
        retry: false,
    });

    const result = {
        emoji: emojiQuery.data,
        server: serverQuery.data,
        isLoading: emojiQuery.isLoading || serverQuery.isLoading,
        isError: emojiQuery.isError || serverQuery.isError,
        emojiError: emojiQuery.error,
        serverError: serverQuery.error,
    };

    return result;
};
