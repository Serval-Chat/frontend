import { useSyncExternalStore } from 'react';

import {
    notificationSoundManager,
    type NotificationSoundManagerState,
} from '@/utils/audio/NotificationSoundManager';

export function useNotificationSoundManager(): NotificationSoundManagerState & {
    manager: typeof notificationSoundManager;
} {
    const state = useSyncExternalStore(
        (listener) => notificationSoundManager.subscribe(listener),
        () => notificationSoundManager.getState(),
    );

    return { ...state, manager: notificationSoundManager };
}
