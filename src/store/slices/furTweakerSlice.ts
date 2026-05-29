import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface FurTweakerState {
    isOpen: boolean;
    spotCount: number;
    opacity: number;
    seed: number;
    base: string;
    spotColor: string;
}

const initialState: FurTweakerState = {
    isOpen: false,
    spotCount: 0,
    opacity: 0.1,
    seed: 8675309,
    base: '#f9e4c7',
    spotColor: 'rgb(54, 37, 0)',
};

const furTweakerSlice = createSlice({
    name: 'furTweaker',
    initialState,
    reducers: {
        setFurTweakerOpen: (state, action: PayloadAction<boolean>): void => {
            state.isOpen = action.payload;
        },
        toggleFurTweaker: (state): void => {
            state.isOpen = !state.isOpen;
        },
        setFurSpotCount: (state, action: PayloadAction<number>): void => {
            state.spotCount = action.payload;
        },
        setFurOpacity: (state, action: PayloadAction<number>): void => {
            state.opacity = action.payload;
        },
        setFurSeed: (state, action: PayloadAction<number>): void => {
            state.seed = action.payload;
        },
        setFurBase: (state, action: PayloadAction<string>): void => {
            state.base = action.payload;
        },
        setFurSpotColor: (state, action: PayloadAction<string>): void => {
            state.spotColor = action.payload;
        },
    },
});

export const {
    setFurTweakerOpen,
    toggleFurTweaker,
    setFurSpotCount,
    setFurOpacity,
    setFurSeed,
    setFurBase,
    setFurSpotColor,
} = furTweakerSlice.actions;

export const furTweakerReducer = furTweakerSlice.reducer;
