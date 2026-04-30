export interface BotPermissions {
    readMessages: boolean;
    sendMessages: boolean;
    manageMessages: boolean;
    readUsers: boolean;
    joinServers: boolean;
    manageServer: boolean;
    manageChannels: boolean;
    manageMembers: boolean;
    readReactions: boolean;
    addReactions: boolean;
}

export interface BotUser {
    _id: string;
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
    _id: string;
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
