import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface DebugOptionsState {
    usernameColorResolverContextMenu: boolean;
}

const initialState: DebugOptionsState = {
    usernameColorResolverContextMenu: false,
};

const debugOptionsSlice = createSlice({
    name: 'debugOptions',
    initialState,
    reducers: {
        setUsernameColorResolverContextMenu: (
            state,
            action: PayloadAction<boolean>,
        ) => {
            state.usernameColorResolverContextMenu = action.payload;
        },
        toggleUsernameColorResolverContextMenu: (state) => {
            state.usernameColorResolverContextMenu =
                !state.usernameColorResolverContextMenu;
        },
    },
});

export const {
    setUsernameColorResolverContextMenu,
    toggleUsernameColorResolverContextMenu,
} = debugOptionsSlice.actions;

export const debugOptionsReducer = debugOptionsSlice.reducer;
