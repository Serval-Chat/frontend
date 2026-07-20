import type { MessageAttachment, OutgoingPoll } from '@/api/chat/chat.types';

import { wsClient } from './client';
import { WsEvents } from './events';

const limitNoEmbedsUrls = (urls?: string[]): string[] | undefined =>
    urls?.slice(0, 25);

/**
 * @description Outgoing message creators.
 */
export const wsMessages = {
    /**
     * Send a direct message.
     */
    sendMessageDm: (
        receiverId: string,
        text: string,
        replyToId?: string,
        stickerId?: string,
        poll?: OutgoingPoll,
        attachments?: MessageAttachment[],
        noEmbedsUrls?: string[],
    ): void => {
        wsClient.send(WsEvents.SEND_MESSAGE_DM, {
            receiverId,
            text,
            replyToId,
            stickerId,
            poll,
            attachments,
            noEmbedsUrls: limitNoEmbedsUrls(noEmbedsUrls),
        });
    },

    /**
     * Send a server/channel message.
     */
    sendMessageServer: (
        serverId: string,
        channelId: string,
        text: string,
        replyToId?: string,
        stickerId?: string,
        poll?: OutgoingPoll,
        attachments?: MessageAttachment[],
        noEmbedsUrls?: string[],
    ): void => {
        wsClient.send(WsEvents.SEND_MESSAGE_SERVER, {
            serverId,
            channelId,
            text,
            replyToId,
            stickerId,
            poll,
            attachments,
            noEmbedsUrls: limitNoEmbedsUrls(noEmbedsUrls),
        });
    },

    /**
     * Join a server room.
     */
    joinServer: (serverId: string): void => {
        wsClient.send(WsEvents.JOIN_SERVER, { serverId });
    },

    /**
     * Join a channel room.
     */
    joinChannel: (serverId: string, channelId: string): void => {
        wsClient.send(WsEvents.JOIN_CHANNEL, { serverId, channelId });
    },

    /**
     * Join a voice channel room.
     */
    joinVoice: (serverId: string, channelId: string): void => {
        console.error('[wsMessages] joinVoice called but LiveKit is removed', {
            serverId,
            channelId,
        });
    },

    /**
     * Leave a voice channel room.
     */
    leaveVoice: (serverId: string, channelId: string): void => {
        console.error('[wsMessages] leaveVoice called but LiveKit is removed', {
            serverId,
            channelId,
        });
    },

    /**
     * Update voice state (mute/deafen).
     */
    updateVoiceState: (
        serverId: string,
        channelId: string,
        isMuted: boolean,
        isDeafened: boolean,
    ): void => {
        console.error(
            '[wsMessages] updateVoiceState called but LiveKit is removed',
            {
                serverId,
                channelId,
                isMuted,
                isDeafened,
            },
        );
    },

    /**
     * Set user status.
     */
    setStatus: (status: string): void => {
        wsClient.send(WsEvents.SET_STATUS, { status });
    },

    /**
     * Set presence status (online/idle/dnd).
     */
    setPresenceStatus: (status: 'online' | 'idle' | 'dnd'): void => {
        wsClient.send(WsEvents.SET_PRESENCE_STATUS, { status });
    },

    /**
     * Send typing indicator for DM.
     */
    sendTypingDm: (receiverId: string): void => {
        wsClient.send(WsEvents.TYPING_DM, { receiverId });
    },

    /**
     * Send typing indicator for server channel.
     */
    sendTypingServer: (serverId: string, channelId: string): void => {
        wsClient.send(WsEvents.TYPING_SERVER, { serverId, channelId });
    },

    /**
     * Mark a channel as read.
     */
    markChannelRead: (serverId: string, channelId: string): void => {
        wsClient.send(WsEvents.MARK_CHANNEL_READ, { serverId, channelId });
    },

    /**
     * Mark a DM as read.
     */
    markDmRead: (peerId: string): void => {
        wsClient.send(WsEvents.MARK_DM_READ, { peerId });
    },
};
