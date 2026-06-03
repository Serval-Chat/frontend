export const BOT_PERMISSION_KEYS = [
    'readMessages',
    'sendMessages',
    'manageMessages',
    'readUsers',
    'joinServers',
    'manageServer',
    'manageChannels',
    'manageMembers',
    'readReactions',
    'addReactions',
    'viewChannels',
    'connect',
    'deleteMessagesOfOthers',
    'manageRoles',
    'banMembers',
    'kickMembers',
    'manageInvites',
    'administrator',
    'manageWebhooks',
    'pingRolesAndEveryone',
    'manageReactions',
    'exportChannelMessages',
    'bypassSlowmode',
    'pinMessages',
    'seeDeletedMessages',
    'moderateMembers',
    'manageStickers',
] as const;

export type BotPermissionKey = (typeof BOT_PERMISSION_KEYS)[number];

export type BotPermissions = Partial<Record<BotPermissionKey, boolean>>;

export interface BotUser {
    id: string;
    username: string;
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    banner?: string;
    bannerColor?: string;
    isBot: boolean;
    createdAt: string;
}

export interface Bot {
    id: string;
    clientId: string;
    ownerId: string;
    userId: string | BotUser;
    botPermissions: BotPermissions;
    createdAt: string;
    updatedAt: string;
    user?: BotUser;
}

export interface CreateBotPayload {
    name: string;
    description?: string;
    avatar?: string;
}

export interface CreateBotResponse {
    bot: Bot;
    clientSecret: string;
}

export interface ResetSecretResponse {
    clientSecret: string;
}

export interface PublicBotInfo {
    clientId: string;
    username: string;
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    banner?: string;
    bannerColor?: string;
    usernameGradient?: { colors: string[] };
    botPermissions: BotPermissions;
    serverCount: number;
}
