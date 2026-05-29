import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ThemeTweakerState {
    isOpen: boolean;
}

const initialState: ThemeTweakerState = {
    isOpen: false,
};

const themeTweakerSlice = createSlice({
    name: 'themeTweaker',
    initialState,
    reducers: {
        setThemeTweakerOpen: (state, action: PayloadAction<boolean>): void => {
            state.isOpen = action.payload;
        },
        toggleThemeTweaker: (state): void => {
            state.isOpen = !state.isOpen;
        },
    },
});

export const { setThemeTweakerOpen, toggleThemeTweaker } =
    themeTweakerSlice.actions;

export const themeTweakerReducer = themeTweakerSlice.reducer;
