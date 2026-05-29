import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface DebugOptionsState {
    usernameColorResolverContextMenu: boolean;
    isConsoleOpen: boolean;
}

const initialState: DebugOptionsState = {
    usernameColorResolverContextMenu: false,
    isConsoleOpen: false,
};

const debugOptionsSlice = createSlice({
    name: 'debugOptions',
    initialState,
    reducers: {
        setUsernameColorResolverContextMenu: (
            state,
            action: PayloadAction<boolean>,
        ): void => {
            state.usernameColorResolverContextMenu = action.payload;
        },
        toggleUsernameColorResolverContextMenu: (state): void => {
            state.usernameColorResolverContextMenu =
                !state.usernameColorResolverContextMenu;
        },
        setConsoleOpen: (state, action: PayloadAction<boolean>): void => {
            state.isConsoleOpen = action.payload;
        },
        toggleConsole: (state): void => {
            state.isConsoleOpen = !state.isConsoleOpen;
        },
    },
});

export const {
    setUsernameColorResolverContextMenu,
    toggleUsernameColorResolverContextMenu,
    setConsoleOpen,
    toggleConsole,
} = debugOptionsSlice.actions;

export const debugOptionsReducer = debugOptionsSlice.reducer;
