import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NavMode = 'friends' | 'servers';

interface NavState {
    navMode: NavMode;
    selectedServerId: string | null;
}

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
};

const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        setNavMode: (state, action: PayloadAction<NavMode>) => {
            state.navMode = action.payload;
            if (action.payload === 'friends') {
                state.selectedServerId = null;
            }
        },
        setSelectedServerId: (state, action: PayloadAction<string>) => {
            state.navMode = 'servers';
            state.selectedServerId = action.payload;
        },
    },
});

export const { setNavMode, setSelectedServerId } = navSlice.actions;
export default navSlice.reducer;
