import { describe, expect, it } from 'vitest';

import type { Role } from '@/api/servers/servers.types';
import {
    exportRole,
    exportRoleList,
    importRolePayload,
} from './roleExport';

const sampleRole: Role = {
    id: 'role-123',
    serverId: 'server-456',
    name: 'Moderator',
    color: '#ff0000',
    position: 5,
    separateFromOtherRoles: true,
    description: 'Mod role',
    glowEnabled: true,
    permissions: {
        sendMessages: true,
        manageMessages: true,
        deleteMessagesOfOthers: true,
        manageChannels: false,
        manageRoles: false,
        banMembers: true,
        kickMembers: true,
        manageInvites: false,
        inviteUsers: true,
        manageServer: false,
        administrator: false,
        manageReactions: true,
        addReactions: true,
        viewCategories: true,
        viewChannels: true,
        pinMessages: true,
        connect: true,
        exportChannelMessages: false,
        bypassSlowmode: true,
        bypassMarkdownRestrictions: false,
        seeDeletedMessages: true,
        moderateMembers: true,
        manageStickers: false,
    },
};

const sampleRole2: Role = {
    id: 'role-789',
    serverId: 'server-456',
    name: 'Admin',
    color: '#00ff00',
    position: 10,
    separateFromOtherRoles: true,
    description: 'Admin role',
    glowEnabled: true,
    permissions: {
        sendMessages: true,
        manageMessages: true,
        deleteMessagesOfOthers: true,
        manageChannels: true,
        manageRoles: true,
        banMembers: true,
        kickMembers: true,
        manageInvites: true,
        inviteUsers: true,
        manageServer: true,
        administrator: true,
        manageReactions: true,
        addReactions: true,
        viewCategories: true,
        viewChannels: true,
        pinMessages: true,
        connect: true,
        exportChannelMessages: true,
        bypassSlowmode: true,
        bypassMarkdownRestrictions: true,
        seeDeletedMessages: true,
        moderateMembers: true,
        manageStickers: true,
    },
};

describe('roleExport utility', () => {
    it('exports and imports a single role without server/position metadata', async () => {
        const code = await exportRole(sampleRole);
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);

        const payload = await importRolePayload(code);
        expect(payload._v).toBe(1);
        expect(payload._type).toBe('role');

        if (payload._type === 'role') {
            expect(payload.name).toBe('Moderator');
            expect(payload.color).toBe('#ff0000');
            expect(payload.description).toBe('Mod role');
            expect(payload.separateFromOtherRoles).toBe(true);
            expect(payload.permissions?.banMembers).toBe(true);
            // Verify position/id/serverId are excluded
            expect('id' in payload).toBe(false);
            expect('serverId' in payload).toBe(false);
            expect('position' in payload).toBe(false);
        }
    });

    it('exports and imports a role list preserving relative positioning', async () => {
        const roles = [sampleRole2, sampleRole]; // highest to lowest
        const code = await exportRoleList(roles);
        expect(typeof code).toBe('string');

        const payload = await importRolePayload(code);
        expect(payload._v).toBe(1);
        expect(payload._type).toBe('role-list');

        if (payload._type === 'role-list') {
            expect(payload.roles).toHaveLength(2);
            expect(payload.roles[0]?.name).toBe('Admin');
            expect(payload.roles[0]?.position).toBe(2);
            expect(payload.roles[1]?.name).toBe('Moderator');
            expect(payload.roles[1]?.position).toBe(1);
        }
    });

    it('throws error for invalid base64 or non-role JSON payload', async () => {
        await expect(importRolePayload('invalid-base64!!!')).rejects.toThrow();
    });
});
