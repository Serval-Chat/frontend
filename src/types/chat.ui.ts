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
    iconRole?: Role;
    replyTo?: {
        id: string;
        user: User;
        role?: Role;
        iconRole?: Role;
        text: string;
        attachments?: ChatMessage['attachments'];
        stickerId?: string | null;
        interaction?: ChatMessage['interaction'];
        isEdited?: boolean;
        deletedAt?: string;
        isWebhook?: boolean;
    };
    repliedToMessageId?: ChatMessage['repliedToMessageId'];
}
