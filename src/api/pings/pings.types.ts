export interface PingNotification {
    id: string;
    type: 'mention' | 'reply' | 'system';
    sender: string;
    senderId: string;
    serverId?: string;
    channelId?: string;
    message: Record<string, unknown>;
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
