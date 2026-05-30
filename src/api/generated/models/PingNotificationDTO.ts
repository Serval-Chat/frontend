/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PingExportMessageDTO } from './PingExportMessageDTO';
import type { PingMentionMessageDTO } from './PingMentionMessageDTO';

export type PingNotificationDTO = {
    id: string;
    type: PingNotificationDTO.type;
    sender: string;
    senderId: string;
    serverId?: string;
    channelId?: string;
    message: PingMentionMessageDTO | PingExportMessageDTO;
    timestamp: number;
};
export namespace PingNotificationDTO {
    export enum type {
        MENTION = 'mention',
        EXPORT_STATUS = 'export_status',
    }
}
