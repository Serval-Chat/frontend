import type { User } from '@/api/users/users.types';

export type ServerBannerType = 'color' | 'image' | 'gif';

export const ServerBannerType = {
    COLOR: 'color' as const,
    IMAGE: 'image' as const,
    GIF: 'gif' as const,
};

export interface ServerBanner {
    type: ServerBannerType;
    value: string;
}

export interface Server {
    _id: string;
    name: string;
    ownerId: string;
    icon?: string;
    banner?: ServerBanner;
    defaultRoleId?: string;
    memberCount?: number;
    allTimeHigh?: number;
    disableCustomFonts?: boolean;
    disableUsernameGlowAndCustomColor?: boolean;
    verified?: boolean;
    verificationRequested?: boolean;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export type ChannelType = 'text' | 'voice' | 'link';

export interface Channel {
    _id: string;
    name: string;
    serverId: string;
    type: ChannelType;
    icon?: string;
    position: number;
    categoryId?: string | null;
    description?: string;
    lastMessageAt?: string | null;
    lastReadAt?: string | null;
    link?: string;
    permissions?: Record<string, Record<string, boolean>>;
    slowMode?: number;
    slowModeNextMessageAllowedAt?: string | null;
}

export interface Category {
    _id: string;
    name: string;
    serverId: string;
    position: number;
    permissions?: Record<string, Record<string, boolean>>;
}

export interface RolePermissions {
    sendMessages: boolean;
    manageMessages: boolean;
    deleteMessagesOfOthers: boolean;
    manageChannels: boolean;
    manageRoles: boolean;
    banMembers: boolean;
    kickMembers: boolean;
    manageInvites: boolean;
    manageServer: boolean;
    administrator: boolean;
    pingRolesAndEveryone?: boolean;
    manageReactions: boolean;
    addReactions: boolean;
    viewChannels: boolean;
    pinMessages: boolean;
    connect: boolean;
    export_channel_messages: boolean;
    bypassSlowmode: boolean;
}

export interface Role {
    _id: string;
    serverId: string;
    name: string;
    color: string | null;
    startColor?: string;
    endColor?: string;
    colors?: string[];
    gradientRepeat?: number;
    position: number;
    separateFromOtherRoles?: boolean;
    icon?: string;
    permissions?: RolePermissions;
}

export interface ServerMember {
    _id: string;
    serverId: string;
    userId: string;
    roles: string[];
    joinedAt: string;
    user: User;
    online?: boolean;
}

export interface ServerBan {
    _id: string;
    serverId: string;
    userId: string;
    bannedBy: string;
    reason?: string;
    createdAt: string;
    user: User | null;
}
