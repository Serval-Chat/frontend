import { describe, expect, it } from 'vitest';

import type {
    MarkdownBlockadeRule,
    Role,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import { ParserFeature } from '@/utils/textParser/types';

import { getBlockedMarkdownFeatures } from './markdownBlockade';

const makeServer = (rules: MarkdownBlockadeRule[]): Server =>
    ({
        _id: 'server-1',
        name: 'Server',
        ownerId: 'owner-user',
        markdownBlockadeRules: rules,
    }) as Server;

const makeMember = (roles: string[]): ServerMember =>
    ({
        _id: 'member-1',
        serverId: 'server-1',
        userId: 'owner-user',
        roles,
        joinedAt: '2026-05-26T00:00:00.000Z',
        user: {
            _id: 'owner-user',
            login: 'owner@example.com',
            username: 'Owner',
            createdAt: new Date(),
        },
    }) as ServerMember;

describe('markdown blockade resolution', (): void => {
    it('lets a specific empty role rule override broader everyone disallowed features', (): void => {
        const ownerRole: Role = {
            _id: 'owner-role',
            serverId: 'server-1',
            name: 'Owner',
            color: null,
            position: 10,
        };
        const server = makeServer([
            {
                targetType: 'everyone',
                targetId: 'everyone',
                features: [ParserFeature.H1, ParserFeature.BOLD],
            },
            {
                targetType: 'role',
                targetId: ownerRole._id,
                features: [],
            },
        ]);

        expect(
            getBlockedMarkdownFeatures({
                server,
                senderId: 'owner-user',
                senderMember: makeMember([ownerRole._id]),
                senderRoles: [ownerRole],
            }),
        ).toEqual([]);
    });

    it('still applies broader everyone disallowed features when no specific rule matches', (): void => {
        const server = makeServer([
            {
                targetType: 'everyone',
                targetId: 'everyone',
                features: [ParserFeature.H1, ParserFeature.BOLD],
            },
        ]);

        expect(
            getBlockedMarkdownFeatures({
                server,
                senderId: 'member-user',
                senderMember: makeMember([]),
                senderRoles: [],
            }),
        ).toEqual([ParserFeature.H1, ParserFeature.BOLD]);
    });

    it('does not block markdown when a sender role can bypass markdown restrictions', (): void => {
        const trustedRole: Role = {
            _id: 'trusted-role',
            serverId: 'server-1',
            name: 'Trusted',
            color: null,
            position: 10,
            permissions: {
                bypassMarkdownRestrictions: true,
            } as Role['permissions'],
        };
        const server = makeServer([
            {
                targetType: 'everyone',
                targetId: 'everyone',
                features: [ParserFeature.H1, ParserFeature.BOLD],
            },
        ]);

        expect(
            getBlockedMarkdownFeatures({
                server,
                senderId: 'owner-user',
                senderMember: makeMember([trustedRole._id]),
                senderRoles: [trustedRole],
            }),
        ).toEqual([]);
    });

    it('does not block markdown when a channel override grants bypass markdown restrictions', (): void => {
        const memberRole: Role = {
            _id: 'member-role',
            serverId: 'server-1',
            name: 'Member',
            color: null,
            position: 1,
        };
        const server = makeServer([
            {
                targetType: 'everyone',
                targetId: 'everyone',
                features: [ParserFeature.H1, ParserFeature.BOLD],
            },
        ]);

        expect(
            getBlockedMarkdownFeatures({
                server,
                channel: {
                    _id: 'channel-1',
                    serverId: 'server-1',
                    name: 'general',
                    type: 'text',
                    position: 0,
                    permissions: {
                        [memberRole._id]: {
                            bypassMarkdownRestrictions: true,
                        },
                    },
                },
                senderId: 'owner-user',
                senderMember: makeMember([memberRole._id]),
                senderRoles: [memberRole],
            }),
        ).toEqual([]);
    });
});
