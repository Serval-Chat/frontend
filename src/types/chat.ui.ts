import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';

/**
 * @description Representation of a message with resolved user and role information.
 */
export interface ProcessedChatMessage extends Omit<
    ChatMessage,
    'repliedToMessageId'
> {
    user: User;
    role?: Role;
    replyTo?: {
        _id: string;
        user: User;
        role?: Role;
        text: string;
    };
    repliedToMessageId?: ChatMessage['repliedToMessageId'];
}
