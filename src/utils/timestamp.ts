import { APP_LOCALE } from './locale';

/**
 * Format a message timestamp
 */
export function formatTimestamp(
    isoString: string,
    use24HourTime = false,
): string {
    const messageDate = new Date(isoString);
    const now = new Date();

    const msgDay = new Date(messageDate);
    msgDay.setHours(0, 0, 0, 0);
    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);

    const diffTime = currentDay.getTime() - msgDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const timeString = messageDate.toLocaleTimeString(APP_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24HourTime,
    });

    if (diffDays === 0) {
        return `Today at ${timeString}`;
    }

    if (diffDays === 1) {
        return `Yesterday at ${timeString}`;
    }

    if (diffDays < 7) {
        const weekday = messageDate.toLocaleDateString(APP_LOCALE, {
            weekday: 'long',
        });
        return `${weekday} at ${timeString}`;
    }

    return messageDate.toLocaleDateString(APP_LOCALE, {
        month: 'short',
        day: 'numeric',
        year:
            messageDate.getFullYear() === now.getFullYear()
                ? undefined
                : 'numeric',
    });
}

/**
 * Format a date to a simple readable string
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString(APP_LOCALE, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

interface Message {
    senderId?: string;
    user?: {
        id?: string;
        username?: string;
    };
    createdAt: string | Date;
    isWebhook?: boolean;
    webhookUsername?: string;
}

/**
 * Check if two messages should be grouped (sent by same user within 5 minutes).
 */
export function shouldGroupMessages(
    prevMsg: Message,
    currentMsg: Message,
): boolean {
    const getSenderId = (msg: Message): string | undefined =>
        msg.senderId || msg.user?.id || msg.user?.username;

    const id1 = getSenderId(prevMsg);
    const id2 = getSenderId(currentMsg);

    if (!id1 || !id2 || id1 !== id2) return false;

    if (prevMsg.isWebhook || currentMsg.isWebhook) {
        if (prevMsg.isWebhook !== currentMsg.isWebhook) return false;
        if (prevMsg.webhookUsername !== currentMsg.webhookUsername)
            return false;
    }

    const date1 = new Date(prevMsg.createdAt);
    const date2 = new Date(currentMsg.createdAt);
    const diffMinutes = Math.abs(
        (date2.getTime() - date1.getTime()) / (1000 * 60),
    );

    return diffMinutes < 5;
}
