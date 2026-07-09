import { describe, expect, it, vi } from 'vitest';

import { wsClient } from './client';
import { WsEvents } from './events';
import { wsMessages } from './messages';

vi.mock('./client', () => ({
    wsClient: {
        send: vi.fn(),
    },
}));

describe('wsMessages', (): void => {
    it('sendMessageServer should cap noEmbedsUrls at 25', (): void => {
        const noEmbedsUrls = Array.from(
            { length: 26 },
            (_, index): string => `https://example.com/${String(index)}`,
        );

        wsMessages.sendMessageServer(
            'server-1',
            'channel-1',
            'hello',
            undefined,
            undefined,
            undefined,
            undefined,
            noEmbedsUrls,
        );

        expect(wsClient.send).toHaveBeenCalledWith(
            WsEvents.SEND_MESSAGE_SERVER,
            expect.objectContaining({
                noEmbedsUrls: noEmbedsUrls.slice(0, 25),
            }),
        );
    });

    it('markDmRead should send peerId instead of userId', (): void => {
        const peerId = '12345';
        wsMessages.markDmRead(peerId);

        expect(wsClient.send).toHaveBeenCalledWith(WsEvents.MARK_DM_READ, {
            peerId,
        });
    });
});
