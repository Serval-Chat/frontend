import type { User } from '@/api/users/users.types';

export interface ChatMessage {
    _id: string;
    text: string;
    createdAt: string;
    user: User; // The sender
    replyTo?: {
        _id: string;
        user: User;
        text: string;
    };
    senderId?: string;
}
