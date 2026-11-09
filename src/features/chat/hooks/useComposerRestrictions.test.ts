import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Server, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';

import { useComposerRestrictions } from './useComposerRestrictions';

const timedOutMember = {
    communicationDisabledUntil: new Date(Date.now() + 60_000).toISOString(),
} as ServerMember;

describe('useComposerRestrictions', (): void => {
    it('applies a timeout before the server and current user have loaded', (): void => {
        const { result } = renderHook(() =>
            useComposerRestrictions({
                me: undefined,
                serverDetails: undefined,
                myMember: timedOutMember,
            }),
        );
        expect(result.current.isTimedOut).toBe(true);
    });

    it('lets the server owner ignore their own timeout', (): void => {
        const { result } = renderHook(() =>
            useComposerRestrictions({
                me: { id: 'me' } as User,
                serverDetails: { ownerId: 'me' } as Server,
                myMember: timedOutMember,
            }),
        );
        expect(result.current.isTimedOut).toBe(false);
    });
});
