export type UsernameFont =
    | 'default'
    | 'Audiowide'
    | 'Bebas Neue'
    | 'Betania Patmos'
    | 'Google Sans Code'
    | 'Noto Sans'
    | 'Pacifico'
    | 'Playpen Sans Deva'
    | 'Rampart One'
    | 'Roboto'
    | 'Workbench';

export interface UsernameGradient {
    enabled: boolean;
    colors: string[];
    angle: number;
    repeating?: boolean;
}

export interface UsernameGlow {
    enabled: boolean;
    color?: string;
    intensity: number;
}

export interface CustomStatus {
    text: string;
    emoji?: string;
    expiresAt: Date | null;
    updatedAt: Date;
}

export interface UserSettings {
    muteNotifications?: boolean;
    ownMessagesAlign?: 'left' | 'right';
    otherMessagesAlign?: 'left' | 'right';
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
    disableCustomUsernameFonts?: boolean;
    disableCustomUsernameColors?: boolean;
    disableCustomUsernameGlow?: boolean;
}

export interface ServerFolder {
    id: string;
    name: string;
    color: string;
    serverIds: string[];
}

export interface ServerSettings {
    order: (string | ServerFolder)[];
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
    displayName?: string | null;
    profilePicture?: string;
    usernameFont?: UsernameFont;
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
    serverSettings?: ServerSettings;
    totpEnabled?: boolean;
}
