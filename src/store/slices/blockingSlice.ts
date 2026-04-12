import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { BlockProfile } from '@/api/blocks/blocks.queries';
import type { RootState } from '@/store';

export interface BlockingState {
    blocks: Record<string, number>;
    profiles: BlockProfile[];
}

const initialState: BlockingState = {
    blocks: {},
    profiles: [],
};

const blockingSlice = createSlice({
    name: 'blocking',
    initialState,
    reducers: {
        setBlocks(state, action: PayloadAction<Record<string, number>>) {
            state.blocks = action.payload;
        },
        addBlock(
            state,
            action: PayloadAction<{ targetUserId: string; flags: number }>,
        ) {
            state.blocks[action.payload.targetUserId] = action.payload.flags;
        },
        removeBlock(state, action: PayloadAction<string>) {
            delete state.blocks[action.payload];
        },
        setProfiles(state, action: PayloadAction<BlockProfile[]>) {
            state.profiles = action.payload;
        },
    },
});

export const { setBlocks, addBlock, removeBlock, setProfiles } =
    blockingSlice.actions;
export const blockingReducer = blockingSlice.reducer;

export const selectBlockFlagsForUser =
    (userId: string) =>
    (state: RootState): number =>
        state.blocking.blocks[userId] ?? 0;
