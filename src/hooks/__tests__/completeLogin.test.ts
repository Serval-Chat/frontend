import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { completeLogin } from '@/hooks/completeLogin';
import {
    checkAndMigrateVapid,
    listenForSwNavigation,
    setupWebPush,
} from '@/lib/pushClient';
import { setAuthToken } from '@/utils/authToken';

vi.mock('@/utils/authToken', () => ({
    setAuthToken: vi.fn(),
}));

vi.mock('@/lib/pushClient', () => ({
    setupWebPush: vi.fn(),
    checkAndMigrateVapid: vi.fn(),
    listenForSwNavigation: vi.fn(),
}));

describe('completeLogin', () => {
    it('sets the auth token, invalidates the me query, sets up push, and navigates, in order', async () => {
        const calls: string[] = [];
        vi.mocked(setAuthToken).mockImplementation(async () => {
            calls.push('setAuthToken');
        });
        vi.mocked(setupWebPush).mockImplementation(async () => {
            calls.push('setupWebPush');
        });
        vi.mocked(checkAndMigrateVapid).mockImplementation(async () => {
            calls.push('checkAndMigrateVapid');
        });
        vi.mocked(listenForSwNavigation).mockImplementation(() => {
            calls.push('listenForSwNavigation');
        });

        const navigate = vi.fn(() => {
            calls.push('navigate');
        }) as unknown as NavigateFunction;
        const invalidateQueries = vi.fn(async () => {
            calls.push('invalidateQueries');
        });
        const queryClient = { invalidateQueries } as unknown as QueryClient;

        await completeLogin('tok-1', true, navigate, queryClient);

        expect(setAuthToken).toHaveBeenCalledWith('tok-1', true);
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['me'] });
        expect(navigate).toHaveBeenCalledWith('/chat/@me');
        expect(calls).toEqual([
            'setAuthToken',
            'invalidateQueries',
            'setupWebPush',
            'checkAndMigrateVapid',
            'listenForSwNavigation',
            'navigate',
        ]);
    });
});
