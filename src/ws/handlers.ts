import { wsClient } from './client';
import {
    type IMessageDm,
    type IMessageServer,
    type IWsErrorEvent,
    WsEvents,
} from './events';

/**
 * @description Global WS handlers
 */
export const setupGlobalWsHandlers = () => {
    wsClient.on<IWsErrorEvent>(WsEvents.ERROR, (payload) => {
        console.error('[WS] Global Error:', payload.message);
    });
};

/**
 * @description WS handlers
 */
export const wsHandlers = {
    onMessageDm: (handler: (message: IMessageDm) => void) => {
        return wsClient.on(WsEvents.MESSAGE_DM, handler);
    },
    onMessageServer: (handler: (message: IMessageServer) => void) => {
        return wsClient.on(WsEvents.MESSAGE_SERVER, handler);
    },
};
