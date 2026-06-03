export interface PingMentionMessage {
    id: string;
    text: string;
    senderId: string;
    senderUsername: string;
}

export interface PingExportMessage {
    type: 'export';
    url: string;
    format: string;
    expiresAt: string;
}

export interface PingNotification {
    id: string;
    type: 'mention' | 'reply' | 'system';
    sender: string;
    senderId: string;
    serverId?: string;
    channelId?: string;
    message: PingMentionMessage | PingExportMessage;
    timestamp: number;
}

export interface GetPingsResponse {
    pings: PingNotification[];
}

export interface DeletePingResponse {
    success: boolean;
}

export interface ClearChannelPingsResponse {
    success: boolean;
    clearedCount: number;
}
