/**
 * Format a message timestamp
 */
export function formatTimestamp(isoString: string): string {
    const messageDate = new Date(isoString);
    const now = new Date();

    const msgDay = new Date(messageDate);
    msgDay.setHours(0, 0, 0, 0);
    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);

    const diffTime = currentDay.getTime() - msgDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (diffDays === 0) {
        return `Today at ${timeString}`;
    }

    if (diffDays === 1) {
        return `Yesterday at ${timeString}`;
    }

    if (diffDays < 7) {
        const weekday = messageDate.toLocaleDateString([], { weekday: 'long' });
        return `${weekday} at ${timeString}`;
    }

    return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year:
            messageDate.getFullYear() !== now.getFullYear()
                ? 'numeric'
                : undefined,
    });
}

/**
 * Format a date to a simple readable string
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

interface Message {
    senderId?: string;
    user?: {
        _id?: string;
        username?: string;
    };
    createdAt: string | Date;
}

/**
 * Check if two messages should be grouped (sent by same user within 5 minutes).
 */
export function shouldGroupMessages(
    prevMsg: Message,
    currentMsg: Message,
): boolean {
    const getSenderId = (msg: Message): string | undefined =>
        msg.senderId || msg.user?._id || msg.user?.username;

    const id1 = getSenderId(prevMsg);
    const id2 = getSenderId(currentMsg);

    if (!id1 || !id2 || id1 !== id2) return false;

    const date1 = new Date(prevMsg.createdAt);
    const date2 = new Date(currentMsg.createdAt);
    const diffMinutes = Math.abs(
        (date2.getTime() - date1.getTime()) / (1000 * 60),
    );

    return diffMinutes < 5;
}
