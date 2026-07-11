import type {
    Badge,
    CustomStatus,
    PrivacySettings,
    UsernameFont,
    UsernameGlow,
    UsernameGradient,
    UserConnection,
} from '@/api/users/users.types';

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

export interface AuditLogUserRef {
    id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
}

export interface AuditLog {
    id: string;
    actorId: string;
    actorIdUser?: AuditLogUserRef;
    actionType: string;
    targetUserId?: string;
    targetUserIdUser?: AuditLogUserRef;
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
    id: string;
    username: string;
    login: string;
    displayName: string | null;
    profilePicture: string | null;
    permissions: AdminPermissions;
    createdAt: string | Date;
    banExpiry?: string | Date;
    muteExpiry?: string | Date;
    muteActive?: boolean;
    muteReason?: string;
    warningCount: number;
    badges: (string | Badge)[];
}

export interface AdminUserServer {
    id: string;
    name: string;
    description?: string;
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
    decorationId?: string | null;
    bannerColor?: string | null;
    profilePrimaryColor?: string | null;
    profileAccentColor?: string | null;
    usernameFont?: UsernameFont;
    usernameGradient?: UsernameGradient;
    usernameGlow?: UsernameGlow;
    customStatus?: CustomStatus | null;
    connections?: UserConnection[];
    isPrivate?: boolean;
    privacySettings?: PrivacySettings;
}
export interface AdminServerOwner {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
}

export interface AdminServerListItem {
    id: string;
    name: string;
    icon: string | null;
    banner?: {
        type: 'color' | 'image' | 'gif';
        value: string;
    };
    ownerId: string;
    memberCount: number;
    createdAt: string | Date;
    deletedAt?: string | Date;
    owner: AdminServerOwner | null;
    verified: boolean;
    verificationScore?: number;
    verificationEligible?: boolean;
    verificationLastComputedAt?: string | Date;
    verificationFailureReasons?: string[];
    verificationOverride?: 'verified' | 'unverified' | null;
    verificationRequested: boolean;
    discoveryEnabled: boolean;
    realMessageCount?: number;
    weightScore?: number;
}

export interface AdminServerVerificationStats {
    p80Threshold: number;
    p65Threshold: number;
    p95T: number;
    p95M: number;
    p95B: number;
    eligibleServerCount: number;
    verifiedServerCount: number;
    lastRunAt: string | Date | null;
}

export interface AdminChannelShort {
    id: string;
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
    id: string;
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
    id: string;
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
