import { beforeEach, describe, expect, it, vi } from 'vitest';

import { friendsApi } from '@/api/friends/friends.api';
import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';
import type { CommandContext } from '@/console/ConCommandRegistry';

import { userctlCommand } from './userctl';

vi.mock('@/api/friends/friends.api', () => ({
    friendsApi: {
        getFriendProfiles: vi.fn(),
    },
}));

vi.mock('@/api/users/users.api', () => ({
    usersApi: {
        getById: vi.fn(),
    },
}));

describe('userctl command', () => {
    let mockContext: CommandContext;

    const mockUsers: Record<string, Partial<User>> = {
        '1': {
            _id: '1',
            username: 'alice',
            displayName: 'Alice',
            pronouns: 'she/her',
            bio: 'developer',
            badges: [],
        },
        '2': {
            _id: '2',
            username: 'bob',
            displayName: 'Bob',
            pronouns: '',
            bio: '',
            badges: [],
        },
        '3': {
            _id: '3',
            username: 'charlie',
            displayName: '',
            pronouns: 'he/him',
            bio: '',
            badges: [],
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            dispatch: vi.fn() as any,
            writeLine: vi.fn(),
        };

        vi.mocked(friendsApi.getFriendProfiles).mockResolvedValue([
            { _id: '1' } as User,
            { _id: '2' } as User,
            { _id: '3' } as User,
        ]);

        vi.mocked(usersApi.getById).mockImplementation(
            async (id: string) => mockUsers[id] as User,
        );
    });

    it('matches userctl command', () => {
        expect(userctlCommand.match(1, ['userctl'])).toBe(true);
        expect(userctlCommand.match(2, ['userctl', '/query'])).toBe(true);
        expect(userctlCommand.match(1, ['help'])).toBe(false);
    });

    it('displays usage on help flag', async () => {
        const result = await userctlCommand.execute(
            2,
            ['userctl', '/?'],
            mockContext,
        );
        expect(result.output).toBeDefined();
        expect(result.output?.[0]).toContain(
            'Queries user profiles and friend accounts.',
        );
        expect(result.output?.join('\n')).toContain('/require-all');
    });

    it('returns error on invalid operand', async () => {
        const result = await userctlCommand.execute(
            2,
            ['userctl', '/invalid'],
            mockContext,
        );
        expect(result.output?.[0]).toContain(
            "userctl: invalid operand '/invalid'",
        );
    });

    it('returns error on missing query target', async () => {
        const result = await userctlCommand.execute(
            2,
            ['userctl', '/query'],
            mockContext,
        );
        expect(result.output?.[0]).toContain(
            'userctl: missing target for /query',
        );
    });

    it('queries friends with default options (uname, dname)', async () => {
        const result = await userctlCommand.execute(
            3,
            ['userctl', '/query', 'friends'],
            mockContext,
        );
        expect(result.output).toBeDefined();
        const outputStr = result.output?.join('\n') || '';
        expect(outputStr).toContain('alice');
        expect(outputStr).toContain('bob');
        expect(outputStr).toContain('charlie');
        expect(outputStr).toContain('Total friends: 3');
    });

    it('queries friends with /hide-empty', async () => {
        const result = await userctlCommand.execute(
            4,
            ['userctl', '/query', 'friends', '/hide-empty'],
            mockContext,
        );
        expect(result.output).toBeDefined();
        const outputStr = result.output?.join('\n') || '';
        expect(outputStr).toContain('alice');
        expect(outputStr).toContain('bob');
        expect(outputStr).toContain('charlie');
        expect(outputStr).toContain('Total friends: 3');
    });

    it('queries friends with /require-all (default columns: uname, dname)', async () => {
        const result = await userctlCommand.execute(
            4,
            ['userctl', '/query', 'friends', '/require-all'],
            mockContext,
        );
        expect(result.output).toBeDefined();
        const outputStr = result.output?.join('\n') || '';
        expect(outputStr).toContain('alice');
        expect(outputStr).toContain('bob');
        expect(outputStr).not.toContain('charlie');
        expect(outputStr).toContain('Total friends: 2');
    });

    it('queries friends with /filter and /require-all', async () => {
        const result = await userctlCommand.execute(
            5,
            [
                'userctl',
                '/query',
                'friends',
                '/filter:uname,pronouns,bio',
                '/require-all',
            ],
            mockContext,
        );
        expect(result.output).toBeDefined();
        const outputStr = result.output?.join('\n') || '';
        expect(outputStr).toContain('alice');
        expect(outputStr).not.toContain('bob');
        expect(outputStr).not.toContain('charlie');
        expect(outputStr).toContain('Total friends: 1');
    });

    it('returns error on invalid filters', async () => {
        const result = await userctlCommand.execute(
            4,
            ['userctl', '/query', 'friends', '/filter:invalid_field'],
            mockContext,
        );
        expect(result.output?.[0]).toContain(
            "userctl: invalid filter field 'invalid_field'",
        );
    });

    it('returns error on extra operands', async () => {
        const result = await userctlCommand.execute(
            4,
            ['userctl', '/query', 'friends', '/extra'],
            mockContext,
        );
        expect(result.output?.[0]).toContain(
            "userctl: invalid operand '/extra'",
        );
    });

    it('queries friends with badges and colors them', async () => {
        mockUsers['1'].badges = [
            {
                _id: 'b1',
                id: 'early_supporter',
                name: 'Early Supporter',
                color: '#ff5555',
                description: 'Early Supporter Badge',
                icon: '',
                createdAt: '',
            },
        ];

        const result = await userctlCommand.execute(
            4,
            ['userctl', '/query', 'friends', '/filter:badges'],
            mockContext,
        );
        expect(result.output).toBeDefined();
        const outputStr = result.output?.join('\n') || '';
        expect(outputStr).toContain(
            '\u001b[38;2;255;85;85mEarly Supporter\u001b[0m',
        );
    });
});
