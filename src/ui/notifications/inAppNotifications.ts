import type { ProcessedChatMessage } from '@/types/chat.ui';
import type { ToastType } from '@/ui/components/common/Toast';

export const IN_APP_NOTIFICATION_EVENT = 'serchat:in-app-notification';

export interface InAppNotification {
    id?: string;
    kind?: 'dm' | 'mention';
    message: string;
    chatMessage?: ProcessedChatMessage;
    serverIcon?: string;
    serverName?: string;
    title?: string;
    type?: ToastType;
}

export const showInAppNotification = (
    notification: InAppNotification,
): void => {
    if (globalThis.window === undefined) return;

    globalThis.dispatchEvent(
        new CustomEvent<InAppNotification>(IN_APP_NOTIFICATION_EVENT, {
            detail: notification,
        }),
    );
};
