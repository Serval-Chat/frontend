import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';

export type { Role, RolePermissions, Server, ServerMember };

export interface MessageProps {
    message: ProcessedChatMessage;
    user: User;
    me?: User;
    serverDetails?: Server;
    senderMember?: ServerMember;
    senderRoles?: Role[];
    fullMemberMap?: Map<string, ServerMember>;
    roleMap?: Map<string, Role>;
    hasPermission?: (permission: keyof RolePermissions) => boolean;
    isOwner?: boolean;
    role?: Role;
    iconRole?: Role;
    isGroupStart?: boolean;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    disableActions?: boolean;
}
