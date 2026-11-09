import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Role, ServerMember } from '@/api/servers/servers.types';

import { useMemberModeration } from './useMemberModeration';

const role = (
    id: string,
    position: number,
    permissions: Partial<Role['permissions']> = {},
): Role =>
    ({
        id,
        serverId: 's1',
        name: id,
        color: null,
        position,
        permissions,
    }) as Role;

const member = (userId: string, roles: string[]): ServerMember =>
    ({
        id: `m-${userId}`,
        serverId: 's1',
        userId,
        roles,
        joinedAt: '',
    }) as ServerMember;

const roles = [
    role('@everyone', 0),
    role('mod', 5, { kickMembers: true, moderateMembers: true }),
    role('admin', 10, { administrator: true }),
];

describe('useMemberModeration', (): void => {
    it('grants a moderator only their role permissions, over lower members', (): void => {
        const { result } = renderHook(() =>
            useMemberModeration({
                serverRoles: roles,
                myMember: member('me', ['mod']),
                targetMember: member('them', []),
                ownerId: 'owner',
                currentUserId: 'me',
            }),
        );
        expect(result.current).toMatchObject({
            isOwner: false,
            canKick: true,
            canTimeout: true,
            canBan: false,
            canManageRoles: false,
            isHigherHierarchy: true,
        });
        expect(result.current.myHighestRole?.id).toBe('mod');
    });

    it('lets administrators do everything but not outrank a higher member', (): void => {
        const { result } = renderHook(() =>
            useMemberModeration({
                serverRoles: roles,
                myMember: member('me', ['admin']),
                targetMember: member('them', ['admin']),
                ownerId: 'owner',
                currentUserId: 'me',
            }),
        );
        expect(result.current).toMatchObject({
            canKick: true,
            canBan: true,
            canTimeout: true,
            canManageRoles: true,
            isHigherHierarchy: false,
        });
    });

    it('treats the server owner as above everyone', (): void => {
        const { result } = renderHook(() =>
            useMemberModeration({
                serverRoles: roles,
                myMember: member('owner', []),
                targetMember: member('them', ['admin']),
                ownerId: 'owner',
                currentUserId: 'owner',
            }),
        );
        expect(result.current).toMatchObject({
            isOwner: true,
            canBan: true,
            isHigherHierarchy: true,
        });
    });
});
