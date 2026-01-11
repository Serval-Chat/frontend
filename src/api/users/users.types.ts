export interface UsernameGradient {
    enabled: boolean;
    colors: string[];
    angle: number;
    repeating?: boolean;
}

export interface UsernameGlow {
    enabled: boolean;
    color: string;
}

export interface CustomStatus {
    text: string;
    emoji?: string;
    expiresAt: Date | null;
    updatedAt: Date;
}

export interface UserSettings {
    muteNotifications?: boolean;
    useDiscordStyleMessages?: boolean;
    ownMessagesAlign?: 'left' | 'right';
    otherMessagesAlign?: 'left' | 'right';
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
}

export interface AdminPermissions {
    adminAccess?: boolean;
    viewUsers?: boolean;
    manageUsers?: boolean;
    manageBadges?: boolean;
    banUsers?: boolean;
    viewBans?: boolean;
    warnUsers?: boolean;
    viewLogs?: boolean;
    manageServer?: boolean;
    manageInvites?: boolean;
}

export interface Badge {
    _id: string;
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    createdAt: string;
}

export interface User {
    _id: string;
    login: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    usernameFont?: string;
    usernameGradient?: UsernameGradient;
    usernameGlow?: UsernameGlow;
    language?: string;
    customStatus?: CustomStatus | null;
    createdAt: Date;
    permissions?: AdminPermissions;
    deletedAt?: Date;
    deletedReason?: string;
    anonymizedUsername?: string;
    tokenVersion?: number;
    bio?: string;
    pronouns?: string;
    badges?: Badge[];

    settings?: UserSettings;
    banner?: string;
}
