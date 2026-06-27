import type { QueryClient } from '@tanstack/react-query';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';

import { wsClient } from '@/ws/client';
import { type IMentionEvent, type IMessageDm, WsEvents } from '@/ws/events';

const isTauri = (): boolean => '__TAURI_INTERNALS__' in window;

export async function initTauriNotifications(
    queryClient: QueryClient,
): Promise<() => void> {
    if (!isTauri()) return (): void => {};

    const noopCleanup = (): void => {};

    try {
        let granted = await isPermissionGranted();
        if (!granted) {
            const permission = await requestPermission();
            granted = permission === 'granted';
        }

        if (!granted) return noopCleanup;

        const cleanupDm = wsClient.on<IMessageDm>(
            WsEvents.MESSAGE_DM,
            (payload): void => {
                const me = queryClient.getQueryData<{ id: string }>(['me']);
                if (me && payload.senderId === me.id) return;

                sendNotification({
                    title: payload.senderUsername,
                    body: payload.text,
                });
            },
        );

        const cleanupMention = wsClient.on<IMentionEvent>(
            WsEvents.MENTION,
            (payload): void => {
                const me = queryClient.getQueryData<{ id: string }>(['me']);
                if (me && payload.senderId === me.id) return;

                const isReaction = payload.type === 'reaction';

                sendNotification({
                    title: isReaction
                        ? 'New Reaction'
                        : `Mention from ${payload.sender}`,
                    body: isReaction
                        ? `${payload.sender} reacted to your message`
                        : 'You were mentioned in a channel',
                });
            },
        );

        return (): void => {
            cleanupDm();
            cleanupMention();
        };
    } catch (error) {
        console.error('Failed to initialize Tauri notifications:', error);
        return noopCleanup;
    }
}
