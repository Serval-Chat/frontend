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
 * @description Authentication event payload.
 */
export interface IWsAuthenticateEvent {
    token: string; // JWT
}

/**
 * @description Successful authentication event payload.
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
 * @description Error event payload.
 */
export interface IWsErrorEvent {
    code: string;
    message: string;
    details?: unknown;
}

/**
 * @description Direct Message payload.
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
 * @description Server message payload.
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
    STATUS_UPDATED: 'status_updated',
} as const;

export type WsEventType = (typeof WsEvents)[keyof typeof WsEvents];
