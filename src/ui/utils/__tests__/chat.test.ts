import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import {
    getHighestColorRoleForMember,
    getHighestRoleForMember,
    isWebhookUser,
    resolveWebhookUser,
} from '@/ui/utils/chat';

describe('chat utils', (): void => {
    const role1 = { id: '1', position: 1, color: '#ff0000' } as Role;
    const role2 = { id: '2', position: 2, color: null } as Role;
    const role3 = { id: '3', position: 3, color: '#00ff00' } as Role;

    const roleMap = new Map<string, Role>([
        ['1', role1],
        ['2', role2],
        ['3', role3],
    ]);

    describe('getHighestRoleForMember', (): void => {
        it('returns the highest role by position', (): void => {
            expect(getHighestRoleForMember(['1', '2'], roleMap)).toBe(role2);
            expect(getHighestRoleForMember(['1', '2', '3'], roleMap)).toBe(
                role3,
            );
        });

        it('returns undefined if no roles', (): void => {
            expect(getHighestRoleForMember([], roleMap)).toBeUndefined();
            expect(getHighestRoleForMember(undefined, roleMap)).toBeUndefined();
        });
    });

    describe('getHighestColorRoleForMember', (): void => {
        it('returns the highest role with a color', (): void => {
            expect(getHighestColorRoleForMember(['1', '2'], roleMap)).toBe(
                role1,
            );
            expect(getHighestColorRoleForMember(['1', '2', '3'], roleMap)).toBe(
                role3,
            );
        });

        it('returns undefined if no role has a color', (): void => {
            const noColorRole = { id: '4', position: 4, color: null } as Role;
            const anotherNoColorRole = { id: '5', position: 5 } as Role;
            const localMap = new Map<string, Role>([
                ['4', noColorRole],
                ['5', anotherNoColorRole],
            ]);
            expect(
                getHighestColorRoleForMember(['4', '5'], localMap),
            ).toBeUndefined();
        });

        it('ignores the default color #99aab5 and passes through to the next role', (): void => {
            const defaultColorRole = {
                id: '8',
                position: 8,
                color: '#99aab5',
            } as Role;
            const customColorRole = {
                id: '9',
                position: 5,
                color: '#ff00ff',
            } as Role;
            const localMap = new Map<string, Role>([
                ['8', defaultColorRole],
                ['9', customColorRole],
            ]);

            expect(getHighestColorRoleForMember(['8', '9'], localMap)).toBe(
                customColorRole,
            );

            expect(
                getHighestColorRoleForMember(['8'], localMap),
            ).toBeUndefined();
        });

        it('handles @everyone role properly (passes through if default, applies if custom)', (): void => {
            const everyoneDefault = {
                id: '10',
                name: '@everyone',
                position: 0,
                color: '#99aab5',
            } as Role;
            const everyoneCustom = {
                id: '11',
                name: '@everyone',
                position: 0,
                color: '#123456',
            } as Role;
            const someRole = {
                id: '12',
                name: 'Some Role',
                position: 1,
                color: '#99aab5',
            } as Role;

            const mapDefault = new Map<string, Role>([
                ['10', everyoneDefault],
                ['12', someRole],
            ]);
            const mapCustom = new Map<string, Role>([
                ['11', everyoneCustom],
                ['12', someRole],
            ]);

            expect(
                getHighestColorRoleForMember(['10', '12'], mapDefault),
            ).toBeUndefined();

            expect(getHighestColorRoleForMember(['11', '12'], mapCustom)).toBe(
                everyoneCustom,
            );
        });

        it('supports multi-color roles', (): void => {
            const multiColorRole = {
                id: '6',
                position: 6,
                colors: ['#ff0000', '#00ff00'],
            } as Role;
            const localMap = new Map<string, Role>([['6', multiColorRole]]);
            expect(getHighestColorRoleForMember(['6'], localMap)).toBe(
                multiColorRole,
            );
        });

        it('supports gradient roles defined by startColor/endColor', (): void => {
            const gradientRole = {
                id: '7',
                position: 7,
                startColor: '#111111',
                endColor: '#222222',
            } as Role;
            const localMap = new Map<string, Role>([['7', gradientRole]]);
            expect(getHighestColorRoleForMember(['7'], localMap)).toBe(
                gradientRole,
            );
        });
    });

    describe('resolveWebhookUser', (): void => {
        it('returns undefined if message is not a webhook', (): void => {
            const msg = {
                id: 'msg1',
                isWebhook: false,
                text: 'hello',
            } as ChatMessage;
            expect(resolveWebhookUser(msg)).toBeUndefined();
        });

        it('resolves webhook user details correctly', (): void => {
            const msg = {
                id: 'msg2',
                isWebhook: true,
                webhookUsername: 'Bridge Bot',
                webhookAvatarUrl: 'https://example.com/avatar.png',
                createdAt: '2026-05-17T12:00:00Z',
            } as ChatMessage;

            const user = resolveWebhookUser(msg);
            expect(user).toBeDefined();
            expect(user?.id).toBe('webhook-msg2');
            expect(user?.username).toBe('Bridge Bot');
            expect(user?.displayName).toBe('Bridge Bot');
            expect(user?.profilePicture).toBe(
                '/api/v1/embed/proxy?url=https%3A%2F%2Fexample.com%2Favatar.png',
            );
        });
    });

    describe('isWebhookUser', (): void => {
        it('detects synthetic webhook users by their id prefix', (): void => {
            expect(isWebhookUser({ id: 'webhook-msg2' })).toBe(true);
            expect(
                isWebhookUser(
                    resolveWebhookUser({
                        id: 'msg2',
                        isWebhook: true,
                        webhookUsername: 'Bridge Bot',
                        createdAt: '2026-05-17T12:00:00Z',
                    } as ChatMessage),
                ),
            ).toBe(true);
        });

        it('returns false for real users and missing ids', (): void => {
            expect(isWebhookUser({ id: '507f1f77bcf86cd799439011' })).toBe(
                false,
            );
            expect(isWebhookUser({})).toBe(false);
            expect(isWebhookUser()).toBe(false);
            expect(isWebhookUser(null)).toBe(false);
        });
    });
});
