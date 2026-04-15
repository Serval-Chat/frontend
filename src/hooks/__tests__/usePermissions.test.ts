import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import * as UserQueries from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { usePermissions } from '@/hooks/usePermissions';

vi.mock('@/api/servers/servers.queries', () => ({
    useMembers: vi.fn(),
    useRoles: vi.fn(),
    useServerDetails: vi.fn(),
    useChannels: vi.fn(),
    useCategories: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn().mockReturnValue({ pathname: '/chat/@server/server1' }),
    useParams: vi.fn().mockReturnValue({ serverId: 'server1' }),
}));

describe('usePermissions', () => {
    const mockMe = { _id: 'user1' } as User;
    const mockServer = { _id: 'server1', ownerId: 'owner1' } as Server;
    const mockMember = { userId: 'user1', roles: ['role1'] } as ServerMember;
    const mockEveryoneRole = {
        _id: 'everyone_id',
        name: '@everyone',
        position: 0,
        permissions: { sendMessages: true },
    } as Role;
    const mockRole1 = {
        _id: 'role1',
        name: 'Role 1',
        position: 1,
        permissions: { sendMessages: false },
    } as Role;

    const setupMocks = (overrides = {}): object => {
        vi.mocked(UserQueries.useMe).mockReturnValue({ data: mockMe } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: mockServer,
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [mockMember],
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [mockEveryoneRole, mockRole1],
        } as never);
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [],
        } as never);
        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [],
        } as never);
        return overrides;
    };

    it('returns base server permissions when no channelId is provided', () => {
        setupMocks();
        const { result } = renderHook(() => usePermissions('server1'));
        expect(result.current.hasPermission('sendMessages')).toBe(true);
    });

    it('applies channel overrides (denying a permission)', () => {
        setupMocks();
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    permissions: {
                        role1: { sendMessages: false },
                        everyone_id: { sendMessages: false },
                    },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(false);
    });

    it('applies channel overrides (granting a permission)', () => {
        vi.mocked(UserQueries.useMe).mockReturnValue({ data: mockMe } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: mockServer,
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [mockMember],
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [
                {
                    _id: 'everyone_id',
                    name: '@everyone',
                    position: 0,
                    permissions: { sendMessages: false },
                },
                {
                    _id: 'role1',
                    name: 'Role 1',
                    position: 1,
                    permissions: { sendMessages: false },
                },
            ],
        } as never);

        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    permissions: {
                        role1: { sendMessages: true },
                    },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(true);
    });

    it('supports "everyone" literal key in overrides', () => {
        setupMocks();
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    permissions: {
                        everyone: { sendMessages: false },
                    },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        // even though role1 has nothing, everyone override should apply if no higher role has override
        expect(result.current.hasPermission('sendMessages')).toBe(false);
    });

    it('category overrides act as fallback', () => {
        setupMocks();
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    categoryId: 'cat1',
                    permissions: {}, // no channel override
                } as never,
            ],
        } as never);
        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [
                {
                    _id: 'cat1',
                    permissions: { role1: { sendMessages: false } },
                } as never,
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(false);
    });

    it('channel overrides win over category overrides', () => {
        setupMocks();
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    categoryId: 'cat1',
                    permissions: { role1: { sendMessages: true } },
                } as never,
            ],
        } as never);
        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [
                {
                    _id: 'cat1',
                    permissions: { role1: { sendMessages: false } },
                } as never,
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(true);
    });

    it('owner ignores all overrides', () => {
        vi.mocked(UserQueries.useMe).mockReturnValue({
            data: { _id: 'owner1' },
        } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { _id: 'server1', ownerId: 'owner1' },
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [{ userId: 'owner1', roles: [] }],
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [mockEveryoneRole],
        } as never);
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    permissions: { everyone: { sendMessages: false } },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(true);
    });

    it('administrator role ignores all overrides', () => {
        setupMocks();
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [
                mockEveryoneRole,
                {
                    _id: 'admin_role',
                    name: 'Admin',
                    position: 10,
                    permissions: { administrator: true },
                },
            ],
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [{ userId: 'user1', roles: ['admin_role'] }],
        } as never);
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    _id: 'channel1',
                    permissions: {
                        everyone: { sendMessages: false },
                        admin_role: { sendMessages: false },
                    },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            usePermissions('server1', 'channel1'),
        );

        expect(result.current.hasPermission('sendMessages')).toBe(true);
    });
});
