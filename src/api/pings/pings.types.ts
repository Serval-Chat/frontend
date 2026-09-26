export interface PingMentionMessage {
    messageId: string;
    text: string;
    createdAt: string;
}

export interface PingExportMessage {
    id: string;
    text: string;
    type: 'success' | 'failure' | 'cancelled';
}

interface PingBase {
    id: string;
    sender: string;
    senderId: string;
    serverId?: string;
    channelId?: string;
    timestamp: number;
}

export type PingNotification =
    | (PingBase & {
          type: 'mention';
          message: PingMentionMessage;
      })
    | (PingBase & {
          type: 'export_status';
          message: PingExportMessage;
      });

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
