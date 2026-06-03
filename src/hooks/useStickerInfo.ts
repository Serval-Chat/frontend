import { useQuery, useQueryClient } from '@tanstack/react-query';

import { serversApi } from '@/api/servers/servers.api';
import type { Sticker } from '@/api/servers/servers.api';
import { useSticker } from '@/api/servers/servers.queries';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';

interface UseStickerInfoProps {
    stickerId?: string;
    serverId?: string;
    enabled?: boolean;
}

export interface UseStickerInfoReturn {
    sticker: Sticker | undefined;
    server: Server | undefined;
    isLoading: boolean;
    isError: boolean;
    stickerError: Error | null;
    serverError: Error | null;
}

export const useStickerInfo = ({
    stickerId,
    serverId,
    enabled = true,
}: UseStickerInfoProps): UseStickerInfoReturn => {
    const queryClient = useQueryClient();

    const stickerQuery = useSticker(stickerId || null);

    const serverIdToUse = serverId || stickerQuery.data?.serverId;

    const serverQuery = useQuery<Server, Error>({
        queryKey: SERVERS_QUERY_KEYS.details(serverIdToUse!),
        queryFn: async (): Promise<Server> => {
            try {
                const result = await serversApi.getServerDetails(
                    serverIdToUse!,
                );
                return result;
            } catch (error) {
                console.error('[useStickerInfo] Error fetching server:', error);
                throw error;
            }
        },
        enabled: enabled && !!serverIdToUse,
        initialData: (): Server | undefined => {
            if (!serverIdToUse) return undefined;
            const servers = queryClient.getQueryData<Server[]>(
                SERVERS_QUERY_KEYS.list,
            );
            return servers?.find((s): boolean => s.id === serverIdToUse);
        },
        retry: false,
    });

    const result = {
        sticker: stickerQuery.data,
        server: serverQuery.data,
        isLoading: stickerQuery.isLoading || serverQuery.isLoading,
        isError: stickerQuery.isError || serverQuery.isError,
        stickerError: stickerQuery.error,
        serverError: serverQuery.error,
    };

    return result;
};
