import type { Badge } from '@/api/users/users.types';

export interface AdminStats {
    users: number;
    usersSparkline: number[];
    activeUsers: number;
    activeUsersSparkline: number[];
    bans: number;
    bansSparkline: number[];
    servers: number;
    serversSparkline: number[];
    messages: number;
    messagesSparkline: number[];
}

export interface AuditLog {
    _id: string;
    actorId: string | { _id: string; username: string };
    actionType: string;
    targetUserId?: string | { _id: string; username: string };
    additionalData?: Record<string, unknown>;
    timestamp: string | Date;
}

export interface AdminPermissions {
    adminAccess: boolean;
    viewUsers: boolean;
    manageUsers: boolean;
    manageBadges: boolean;
    banUsers: boolean;
    viewBans: boolean;
    warnUsers: boolean;
    viewLogs: boolean;
    manageServer: boolean;
    manageInvites: boolean;
}

export interface AdminUser {
    _id: string;
    username: string;
    login: string;
    displayName: string | null;
    profilePicture: string | null;
    permissions: AdminPermissions;
    createdAt: string | Date;
    banExpiry?: string | Date;
    warningCount: number;
    badges: (string | Badge)[];
}

export interface AdminUserServer {
    _id: string;
    name: string;
    icon: string | null;
    banner: string | null;
    ownerId: string;
    memberCount: number;
    joinedAt: string | Date;
    isOwner: boolean;
}

export interface AdminExtendedUser extends AdminUser {
    bio: string;
    pronouns: string;
    banner: string | null;
    deletedAt?: string | Date;
    deletedReason?: string;
    servers: AdminUserServer[];
}
export interface AdminServerOwner {
    _id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
}

export interface AdminServerListItem {
    _id: string;
    name: string;
    icon: string | null;
    banner?: {
        type: 'color' | 'image' | 'gif' | 'gradient';
        value: string;
    };
    ownerId: string;
    memberCount: number;
    createdAt: string | Date;
    deletedAt?: string | Date;
    owner: AdminServerOwner | null;
    verified: boolean;
    verificationRequested: boolean;
    realMessageCount?: number;
    weightScore?: number;
}

export interface AdminChannelShort {
    _id: string;
    name: string;
    type: 'text' | 'voice' | 'link';
    position: number;
}

export interface AdminServerDetails extends AdminServerListItem {
    channels: AdminChannelShort[];
    messageVolume: number;
    recentBanCount: number;
    recentKickCount: number;
}

export interface AdminNoteAdminInfo {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
}

export interface AdminNoteHistory {
    content: string;
    editorId: AdminNoteAdminInfo;
    editedAt: string | Date;
}

export interface AdminNote {
    _id: string;
    targetId: string;
    targetType: 'User' | 'Server';
    adminId: AdminNoteAdminInfo;
    content: string;
    history: AdminNoteHistory[];
    deletedAt?: string | Date;
    deletedBy?: AdminNoteAdminInfo;
    deleteReason?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}
