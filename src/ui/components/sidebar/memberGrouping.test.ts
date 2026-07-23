import { describe, expect, it } from 'vitest';

import type { ServerMember } from '@/api/servers/servers.types';

import { buildMemberGroups } from './memberGrouping';

const makeMember = (
    overrides: Partial<ServerMember> & { userId: string },
): ServerMember =>
    ({
        id: overrides.userId,
        serverId: 'server-1',
        nickname: undefined,
        roles: [],
        joinedAt: new Date().toISOString(),
        user: {
            id: overrides.userId,
            username: overrides.userId,
        },
        ...overrides,
    }) as ServerMember;

describe('buildMemberGroups', (): void => {
    it('puts the current user in the offline group when they set their own status to offline/invisible, instead of forcing them online', (): void => {
        const me = makeMember({ userId: 'me', online: true });

        const groups = buildMemberGroups({
            members: [me],
            roles: [],
            presenceMap: {
                me: { status: 'online', presenceStatus: 'offline' },
            },
            me: { id: 'me' },
            blocks: {},
        });

        const offlineGroup = groups.find((g) => g.id === 'offline');
        const onlineGroup = groups.find((g) => g.id === 'online');
        expect(offlineGroup?.members.map((m) => m.userId)).toEqual(['me']);
        expect(onlineGroup).toBeUndefined();
    });

    it('still shows the current user as online when they have not set themselves to invisible', (): void => {
        const me = makeMember({ userId: 'me', online: true });

        const groups = buildMemberGroups({
            members: [me],
            roles: [],
            presenceMap: {
                me: { status: 'online', presenceStatus: 'dnd' },
            },
            me: { id: 'me' },
            blocks: {},
        });

        const onlineGroup = groups.find((g) => g.id === 'online');
        expect(onlineGroup?.members.map((m) => m.userId)).toEqual(['me']);
    });

    it('falls back to showing the current user as online before their presence entry has loaded', (): void => {
        const me = makeMember({ userId: 'me', online: true });

        const groups = buildMemberGroups({
            members: [me],
            roles: [],
            presenceMap: {},
            me: { id: 'me' },
            blocks: {},
        });

        const onlineGroup = groups.find((g) => g.id === 'online');
        expect(onlineGroup?.members.map((m) => m.userId)).toEqual(['me']);
    });

    it('puts another (non-self) member who is genuinely offline in the offline group', (): void => {
        const other = makeMember({ userId: 'other', online: false });

        const groups = buildMemberGroups({
            members: [other],
            roles: [],
            presenceMap: {
                other: { status: 'offline' },
            },
            me: { id: 'me' },
            blocks: {},
        });

        const offlineGroup = groups.find((g) => g.id === 'offline');
        expect(offlineGroup?.members.map((m) => m.userId)).toEqual(['other']);
    });

    it('does not put another (non-self) online member in the offline group just because they picked dnd', (): void => {
        const other = makeMember({ userId: 'other', online: true });

        const groups = buildMemberGroups({
            members: [other],
            roles: [],
            presenceMap: {
                other: { status: 'online', presenceStatus: 'dnd' },
            },
            me: { id: 'me' },
            blocks: {},
        });

        const onlineGroup = groups.find((g) => g.id === 'online');
        expect(onlineGroup?.members.map((m) => m.userId)).toEqual(['other']);
    });
});
