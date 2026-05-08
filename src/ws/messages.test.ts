import { describe, expect, it, vi } from 'vitest';

import { wsClient } from './client';
import { WsEvents } from './events';
import { wsMessages } from './messages';

vi.mock('./client', () => ({
    wsClient: {
        send: vi.fn(),
    },
}));

describe('wsMessages', () => {
    it('markDmRead should send peerId instead of userId', () => {
        const peerId = '12345';
        wsMessages.markDmRead(peerId);

        expect(wsClient.send).toHaveBeenCalledWith(WsEvents.MARK_DM_READ, {
            peerId,
        });
    });
});
