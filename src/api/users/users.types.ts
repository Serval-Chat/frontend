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

export type MessageAlignment = 'left' | 'right';

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

export interface NotificationSound {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
}

export interface KeybindBinding {
    code: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export type UserKeybinds = Record<string, KeybindBinding | null>;

export interface UserSettings {
    muteNotifications?: boolean;
    ownMessagesAlign?: MessageAlignment;
    otherMessagesAlign?: MessageAlignment;
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
    disableCustomUsernameFonts?: boolean;
    disableCustomUsernameColors?: boolean;
    disableCustomUsernameGlow?: boolean;
    limitedAnimations?: boolean;
    customFontUrl?: string;
    customFontFamily?: string;
    notificationSounds?: NotificationSound[];
    useDefaultSounds?: boolean;
    use24HourTime?: boolean;
    keybinds?: UserKeybinds;
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

export interface UserConnection {
    id: string;
    type: 'Website';
    value: string;
    status?: 'pending' | 'verified';
    recordType?: 'TXT' | 'HTTPS';
    recordName?: string;
    recordValue?: string;
    filePath?: string;
    fileUrl?: string;
    fileContent?: string;
    expiresAt?: string;
}

export interface CreateWebsiteConnectionResponse {
    message: string;
    connectionId: string;
    recordType: 'TXT';
    recordName: string;
    recordValue: string;
    filePath: string;
    fileUrl: string;
    fileContent: string;
    expiresAt: string;
}

export interface User {
    _id: string;
    login: string;
    username: string;
    nickname?: string | null;
    isBot?: boolean;
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
    bannerColor?: string;
    serverSettings?: ServerSettings;
    totpEnabled?: boolean;
    connections?: UserConnection[];
    activeMute?: {
        reason: string;
        expirationTimestamp?: string | Date | null;
    } | null;
}
