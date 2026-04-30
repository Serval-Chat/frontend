import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useMemberMaps } from '@/hooks/chat/useMemberMaps';

const makeUser = (id: string, username: string): User =>
    ({ _id: id, username }) as User;

const makeMember = (userId: string, roles: string[]): ServerMember =>
    ({
        _id: `member-${userId}`,
        serverId: 'server-1',
        userId,
        roles,
        joinedAt: new Date().toISOString(),
        user: makeUser(userId, `user-${userId}`),
    }) as ServerMember;

describe('useMemberMaps', () => {
    it('uses @everyone color role when member has no explicit roles', () => {
        const roles: Role[] = [
            {
                _id: 'everyone',
                serverId: 'server-1',
                name: '@everyone',
                color: '#99aab5',
                position: 0,
            } as Role,
        ];
        const members: ServerMember[] = [makeMember('u1', [])];

        const { result } = renderHook(() => useMemberMaps(members, roles));
        expect(result.current.highestRoleMap.get('u1')?._id).toBe('everyone');
    });

    it('prefers higher explicit role over @everyone for username color', () => {
        const roles: Role[] = [
            {
                _id: 'everyone',
                serverId: 'server-1',
                name: '@everyone',
                color: '#99aab5',
                position: 0,
            } as Role,
            {
                _id: 'vip',
                serverId: 'server-1',
                name: 'VIP',
                color: '#ff0066',
                position: 20,
            } as Role,
        ];
        const members: ServerMember[] = [makeMember('u1', ['vip'])];

        const { result } = renderHook(() => useMemberMaps(members, roles));
        expect(result.current.highestRoleMap.get('u1')?._id).toBe('vip');
    });

    it('adds @everyone for icon role resolution too', () => {
        const roles: Role[] = [
            {
                _id: 'everyone',
                serverId: 'server-1',
                name: '@everyone',
                color: '#99aab5',
                position: 0,
                icon: 'everyone.png',
            } as Role,
        ];
        const members: ServerMember[] = [makeMember('u1', [])];

        const { result } = renderHook(() => useMemberMaps(members, roles));
        expect(result.current.iconRoleMap.get('u1')?._id).toBe('everyone');
    });

    it('resolves @everyone when it only has start/end gradient colors', () => {
        const roles: Role[] = [
            {
                _id: 'everyone',
                serverId: 'server-1',
                name: '@everyone',
                color: null,
                startColor: '#123456',
                endColor: '#654321',
                position: 0,
            } as Role,
        ];
        const members: ServerMember[] = [makeMember('u1', [])];

        const { result } = renderHook(() => useMemberMaps(members, roles));
        expect(result.current.highestRoleMap.get('u1')?._id).toBe('everyone');
    });
});
