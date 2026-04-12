import { useEffect } from 'react';

import { useBlockProfiles, useBlocks } from '@/api/blocks/blocks.queries';
import type { BlockRelationship } from '@/api/blocks/blocks.queries';
import { useAppDispatch } from '@/store/hooks';
import { setBlocks, setProfiles } from '@/store/slices/blockingSlice';

export const BlockSyncProvider = (): null => {
    const dispatch = useAppDispatch();
    const { data: blocksData } = useBlocks();
    const { data: profilesData } = useBlockProfiles();

    useEffect(() => {
        if (!blocksData) return;
        const blockMap = blocksData.reduce<Record<string, number>>(
            (acc: Record<string, number>, b: BlockRelationship) => {
                acc[b.targetUserId] = b.flags;
                return acc;
            },
            {},
        );
        dispatch(setBlocks(blockMap));
    }, [blocksData, dispatch]);

    useEffect(() => {
        if (!profilesData) return;
        dispatch(setProfiles(profilesData));
    }, [profilesData, dispatch]);

    return null;
};
