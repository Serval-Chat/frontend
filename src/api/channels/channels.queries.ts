import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { channelsApi } from './channels.api';
import type { DmChannel } from './channels.types';

/**
 * @description Resolve (get-or-create) the DM channel for a recipient. The
 * channel identity for a given pair of users never changes once created,
 * so this is safe to cache indefinitely.
 */
export const useDmChannel = (
    recipientId: string | null,
): UseQueryResult<DmChannel> =>
    useQuery({
        queryKey: ['channels', 'dm', recipientId] as const,
        queryFn: (): Promise<DmChannel> => {
            if (recipientId === null) {
                throw new Error('recipientId is required');
            }
            return channelsApi.getOrCreateDm(recipientId);
        },
        enabled: !!recipientId,
        staleTime: Infinity,
    });
