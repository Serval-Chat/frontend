import { wsClient } from './client';
import { WsEvents } from './events';

/**
 * @description Outgoing message creators.
 */
export const wsMessages = {
    /**
     * Send a direct message.
     */
    sendMessageDm: (receiverId: string, text: string, replyToId?: string) => {
        wsClient.send(WsEvents.SEND_MESSAGE_DM, {
            receiverId,
            text,
            replyToId,
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
    ) => {
        wsClient.send(WsEvents.SEND_MESSAGE_SERVER, {
            serverId,
            channelId,
            text,
            replyToId,
        });
    },

    /**
     * Join a server room.
     */
    joinServer: (serverId: string) => {
        wsClient.send(WsEvents.JOIN_SERVER, { serverId });
    },

    /**
     * Join a channel room.
     */
    joinChannel: (serverId: string, channelId: string) => {
        wsClient.send(WsEvents.JOIN_CHANNEL, { serverId, channelId });
    },

    /**
     * Set user status.
     */
    setStatus: (status: string) => {
        wsClient.send(WsEvents.SET_STATUS, { status });
    },

    /**
     * Send typing indicator for DM.
     */
    sendTypingDm: (receiverId: string) => {
        wsClient.send(WsEvents.TYPING_DM, { receiverId });
    },

    /**
     * Send typing indicator for server channel.
     */
    sendTypingServer: (serverId: string, channelId: string) => {
        wsClient.send(WsEvents.TYPING_SERVER, { serverId, channelId });
    },

    /**
     * Mark a channel as read.
     */
    markChannelRead: (serverId: string, channelId: string) => {
        wsClient.send(WsEvents.MARK_CHANNEL_READ, { serverId, channelId });
    },

    /**
     * Mark a DM as read.
     */
    markDmRead: (peerId: string) => {
        wsClient.send(WsEvents.MARK_DM_READ, { userId: peerId });
    },
};
