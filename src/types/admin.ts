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
