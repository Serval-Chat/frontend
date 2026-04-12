import { configureStore } from '@reduxjs/toolkit';

import { blockingReducer } from './slices/blockingSlice';
import { navReducer, saveLastChannels } from './slices/navSlice';
import { presenceReducer } from './slices/presenceSlice';
import { unreadReducer } from './slices/unreadSlice';
import { voiceReducer } from './slices/voiceSlice';

export const store = configureStore({
    reducer: {
        nav: navReducer,
        presence: presenceReducer,
        unread: unreadReducer,
        voice: voiceReducer,
        blocking: blockingReducer,
    },
});

let prevLastChannels = store.getState().nav.lastOpenedChannelByServer;
store.subscribe(() => {
    const next = store.getState().nav.lastOpenedChannelByServer;
    if (next !== prevLastChannels) {
        prevLastChannels = next;
        saveLastChannels(next);
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
