import { configureStore } from '@reduxjs/toolkit';

import { navReducer } from './slices/navSlice';
import { presenceReducer } from './slices/presenceSlice';
import { unreadReducer } from './slices/unreadSlice';

export const store = configureStore({
    reducer: {
        nav: navReducer,
        presence: presenceReducer,
        unread: unreadReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
