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
    createdAt?: string;
    updatedAt?: string;
}

export type ChannelType = 'text' | 'voice';

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
}

export interface Category {
    _id: string;
    name: string;
    serverId: string;
    position: number;
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
    permissions?: RolePermissions;
}

export interface ServerMember {
    _id: string;
    serverId: string;
    userId: string;
    roles: string[];
    joinedAt: string;
    user: User;
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
