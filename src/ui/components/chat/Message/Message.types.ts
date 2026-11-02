import type { ReadOnlyMessagePoll } from '@/api/chat/chat.types';
import type {
    Category,
    Channel,
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { QuickReactionEmoji } from '@/hooks/useFrequentlyUsedEmojis';
import type { ProcessedChatMessage } from '@/types/chat.ui';

export interface MessageChannelData {
    channels?: Channel[];
    categories?: Category[];
}

export type MessagePermissionFlags = Partial<
    Record<keyof RolePermissions, boolean>
>;

export interface MessageProps {
    message: ProcessedChatMessage;
    user: User;
    me?: User;
    serverDetails?: Server;
    senderMember?: ServerMember;
    senderRoles?: Role[];
    interactionMember?: ServerMember;
    mentionsMe?: boolean;
    currentUserHighestRolePosition?: number;
    localNickname?: string;
    isFriend?: boolean;
    isMobileLayout?: boolean;
    quickReactions?: QuickReactionEmoji[];
    messageChannelData?: MessageChannelData;
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
    isReportPreview?: boolean;
    reportPoll?: ReadOnlyMessagePoll;
    onResize?: () => void;
    retryMessage?: (localId: string) => void;
    discardMessage?: (localId: string) => void;
}

export {
    type Role,
    type RolePermissions,
    type Server,
    type ServerMember,
} from '@/api/servers/servers.types';
