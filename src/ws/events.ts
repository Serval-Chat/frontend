/**
 * @description WebSocket envelope structure for all messages.
 */
export interface IWsEnvelope<T = unknown> {
    id: string; // Unique message ID
    event: {
        type: string;
        payload: T;
    };
    meta: {
        replyTo?: string; // ID of the request being replied to
        ts: number; // Unix timestamp in ms
    };
}

/**
 * @description Authentication event.
 */
export interface IWsAuthenticateEvent {
    token: string; // JWT
}

/**
 * @description Successful authentication event.
 */
export interface IWsAuthenticatedEvent {
    user: {
        id: string;
        username: string;
        displayName?: string;
        profilePicture?: string;
    };
}

/**
 * @description Error event.
 */
export interface IWsErrorEvent {
    code: string;
    message: string;
    details?: unknown;
}

/**
 * @description Direct Message.
 */
export interface IMessageDm {
    messageId: string;
    senderId: string;
    senderUsername: string;
    receiverId: string;
    receiverUsername: string;
    text: string;
    createdAt: string;
    replyToId?: string;
    repliedTo?: {
        messageId: string;
        senderId: string;
        senderUsername: string;
        text: string;
    };
    isEdited: boolean;
}

/**
 * @description Server message.
 */
export interface IMessageServer {
    messageId: string;
    serverId: string;
    channelId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    createdAt: string;
    replyToId?: string;
    isEdited: boolean;
    isWebhook: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
}

/**
 * @description Presence sync.
 */
export interface IPresenceSyncEvent {
    online: Array<{
        userId: string;
        username: string;
        status?: string;
    }>;
}

/**
 * @description User online.
 */
export interface IUserOnlineEvent {
    userId: string;
    username: string;
    status?: string;
}

/**
 * @description User offline.
 */
export interface IUserOfflineEvent {
    userId: string;
    username: string;
}

/**
 * @description Status updated.
 */
export interface IStatusUpdatedEvent {
    username: string;
    status: {
        text: string;
        emoji?: string | null;
        expiresAt: string | null;
        updatedAt: string;
    } | null;
}

/**
 * @description Member updated.
 */
export interface IMemberUpdatedEvent {
    serverId: string;
    userId: string;
    member: {
        userId: string;
        roles: string[];
    };
}

/**
 * @description Member added.
 */
export interface IMemberAddedEvent {
    serverId: string;
    userId: string;
}

/**
 * @description Event names
 */
export const WsEvents = {
    // Connection
    PING: 'ping',
    PONG: 'pong',
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    ERROR: 'error',

    // DMs
    SEND_MESSAGE_DM: 'send_message_dm',
    MESSAGE_DM_SENT: 'message_dm_sent',
    MESSAGE_DM: 'message_dm',
    EDIT_MESSAGE_DM: 'edit_message_dm',
    MESSAGE_DM_EDITED: 'message_dm_edited',
    DELETE_MESSAGE_DM: 'delete_message_dm',
    MESSAGE_DM_DELETED: 'message_dm_deleted',
    MARK_DM_READ: 'mark_dm_read',
    DM_UNREAD_UPDATED: 'dm_unread_updated',
    TYPING_DM: 'typing_dm',

    // Server Messages
    SEND_MESSAGE_SERVER: 'send_message_server',
    MESSAGE_SERVER_SENT: 'message_server_sent',
    MESSAGE_SERVER: 'message_server',
    EDIT_MESSAGE_SERVER: 'edit_message_server',
    MESSAGE_SERVER_EDITED: 'message_server_edited',
    DELETE_MESSAGE_SERVER: 'delete_message_server',
    MESSAGE_SERVER_DELETED: 'message_server_deleted',
    MARK_CHANNEL_READ: 'mark_channel_read',
    CHANNEL_UNREAD_UPDATED: 'channel_unread_updated',
    TYPING_SERVER: 'typing_server',

    // Management
    JOIN_SERVER: 'join_server',
    SERVER_JOINED: 'server_joined',
    LEAVE_SERVER: 'leave_server',
    JOIN_CHANNEL: 'join_channel',
    CHANNEL_JOINED: 'channel_joined',
    LEAVE_CHANNEL: 'leave_channel',

    // Presence
    PRESENCE_SYNC: 'presence_sync',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    SET_STATUS: 'set_status',
    STATUS_UPDATED: 'status_update',

    // Friends
    FRIEND_ADDED: 'friend_added',
    FRIEND_REMOVED: 'friend_removed',
    INCOMING_REQUEST_ADDED: 'incoming_request_added',
    INCOMING_REQUEST_REMOVED: 'incoming_request_removed',

    // Reactions
    REACTION_ADDED: 'reaction_added',
    REACTION_REMOVED: 'reaction_removed',

    // Server Management
    SERVER_UPDATED: 'server_updated',
    SERVER_DELETED: 'server_deleted',
    CHANNEL_CREATED: 'channel_created',
    CHANNEL_UPDATED: 'channel_updated',
    CHANNEL_DELETED: 'channel_deleted',
    CHANNELS_REORDERED: 'channels_reordered',
    CATEGORY_CREATED: 'category_created',
    CATEGORY_UPDATED: 'category_updated',
    CATEGORY_DELETED: 'category_deleted',
    CATEGORIES_REORDERED: 'categories_reordered',
    SERVER_ICON_UPDATED: 'server_icon_updated',
    SERVER_BANNER_UPDATED: 'server_banner_updated',
    OWNERSHIP_TRANSFERRED: 'ownership_transferred',
    MEMBER_UPDATED: 'member_updated',
    MEMBER_ADDED: 'member_added',
    MEMBER_REMOVED: 'member_removed',
} as const;

export interface IReactionEventPayload {
    messageId: string;
    userId: string;
    username: string;
    emoji: string;
    emojiType: 'unicode' | 'custom';
    emojiId?: string;
    messageType: 'dm' | 'server';
}

export type WsEventType = (typeof WsEvents)[keyof typeof WsEvents];
