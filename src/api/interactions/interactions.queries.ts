import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { hasAuthToken } from '@/utils/authToken';

import { interactionsApi } from './interactions.api';
import type { SlashCommand } from './interactions.api';

export const COMMANDS_QUERY_KEYS = {
    serverCommands: (
        serverId: string | null,
    ): readonly ['interactions', 'commands', string | null] =>
        ['interactions', 'commands', serverId] as const,
};

export const useServerCommands = (
    serverId: string | null,
): UseQueryResult<SlashCommand[]> =>
    useQuery({
        queryKey: COMMANDS_QUERY_KEYS.serverCommands(serverId),
        queryFn: (): Promise<SlashCommand[]> =>
            interactionsApi.getServerCommands(serverId!),
        enabled: !!serverId && hasAuthToken(),
        staleTime: 30_000,
    });
