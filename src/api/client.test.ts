import { beforeEach, describe, expect, it, vi } from 'vitest';

import { removeAuthToken } from '@/utils/authToken';

import { apiClient } from './client';

vi.mock('@/utils/authToken', () => ({
    getAuthToken: vi.fn(() => null),
    removeAuthToken: vi.fn(),
}));

type RejectedHandler = (error: unknown) => Promise<never>;

const getResponseRejectedHandler = (): RejectedHandler => {
    const handlers = (
        apiClient.interceptors.response as unknown as {
            handlers: ({ rejected: RejectedHandler } | null)[];
        }
    ).handlers;
    const handler = handlers.find((h) => h !== null);
    if (!handler) throw new Error('no response interceptor registered');
    return handler.rejected;
};

describe('apiClient response interceptor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('clears the auth token on a 401 (a real session-invalid signal)', async () => {
        const rejected = getResponseRejectedHandler();

        await expect(
            rejected({ response: { status: 401 } }),
        ).rejects.toBeDefined();

        expect(removeAuthToken).toHaveBeenCalled();
    });

    it('does not clear the auth token on a 400 (a business-logic failure on an otherwise-valid session, e.g. entering the wrong current password to confirm going passwordless)', async () => {
        const rejected = getResponseRejectedHandler();

        await expect(
            rejected({ response: { status: 400 } }),
        ).rejects.toBeDefined();

        expect(removeAuthToken).not.toHaveBeenCalled();
    });

    it('does not clear the auth token on a network error with no response at all', async () => {
        const rejected = getResponseRejectedHandler();

        await expect(rejected({})).rejects.toBeDefined();

        expect(removeAuthToken).not.toHaveBeenCalled();
    });
});
