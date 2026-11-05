import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuth } from './useAuth';

const auth = vi.hoisted(() => ({ hasToken: false }));

vi.mock('@/utils/authToken', () => ({
    hasAuthToken: (): boolean => auth.hasToken,
}));

describe('useAuth', (): void => {
    it('updates on auth-change and storage events', (): void => {
        auth.hasToken = false;
        const { result } = renderHook(useAuth);
        expect(result.current.isAuthenticated).toBe(false);

        auth.hasToken = true;
        act((): void => {
            globalThis.dispatchEvent(new Event('auth-change'));
        });
        expect(result.current.isAuthenticated).toBe(true);

        auth.hasToken = false;
        act((): void => {
            globalThis.dispatchEvent(new Event('storage'));
        });
        expect(result.current.isAuthenticated).toBe(false);
    });
});
