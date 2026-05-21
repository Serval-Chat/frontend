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
        ) => {
            state.usernameColorResolverContextMenu = action.payload;
        },
        toggleUsernameColorResolverContextMenu: (state) => {
            state.usernameColorResolverContextMenu =
                !state.usernameColorResolverContextMenu;
        },
        setConsoleOpen: (state, action: PayloadAction<boolean>) => {
            state.isConsoleOpen = action.payload;
        },
        toggleConsole: (state) => {
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
