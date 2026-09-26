import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/api/client';

import { pingsApi } from './pings.api';

vi.mock('@/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('pingsApi.getPings', () => {
    it('GETs the pings list endpoint and returns its payload', async () => {
        const payload = { pings: [] };
        vi.mocked(apiClient.get).mockResolvedValue({ data: payload });

        const result = await pingsApi.getPings();

        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/pings');
        expect(result).toEqual(payload);
    });
});

describe('pingsApi.deletePing', () => {
    it('DELETEs the single-ping endpoint for the given id', async () => {
        const payload = { success: true };
        vi.mocked(apiClient.delete).mockResolvedValue({ data: payload });

        const result = await pingsApi.deletePing('0362009044010926080');

        expect(apiClient.delete).toHaveBeenCalledWith(
            '/api/v1/pings/0362009044010926080',
        );
        expect(result).toEqual(payload);
    });
});

describe('pingsApi.clearChannelPings', () => {
    it('DELETEs the channel-scoped endpoint for the given channel', async () => {
        const payload = { success: true, clearedCount: 2 };
        vi.mocked(apiClient.delete).mockResolvedValue({ data: payload });

        const result = await pingsApi.clearChannelPings('ch-42');

        expect(apiClient.delete).toHaveBeenCalledWith(
            '/api/v1/pings/channel/ch-42',
        );
        expect(result).toEqual(payload);
    });
});
