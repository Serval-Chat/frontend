import { describe, expect, it } from 'vitest';

import type { Role } from '@/api/servers/servers.types';
import {
    getHighestColorRoleForMember,
    getHighestRoleForMember,
} from '@/ui/utils/chat';

describe('chat utils', () => {
    const role1 = { _id: '1', position: 1, color: '#ff0000' } as Role;
    const role2 = { _id: '2', position: 2, color: null } as Role;
    const role3 = { _id: '3', position: 3, color: '#00ff00' } as Role;

    const roleMap = new Map<string, Role>([
        ['1', role1],
        ['2', role2],
        ['3', role3],
    ]);

    describe('getHighestRoleForMember', () => {
        it('returns the highest role by position', () => {
            expect(getHighestRoleForMember(['1', '2'], roleMap)).toBe(role2);
            expect(getHighestRoleForMember(['1', '2', '3'], roleMap)).toBe(
                role3,
            );
        });

        it('returns undefined if no roles', () => {
            expect(getHighestRoleForMember([], roleMap)).toBeUndefined();
            expect(getHighestRoleForMember(undefined, roleMap)).toBeUndefined();
        });
    });

    describe('getHighestColorRoleForMember', () => {
        it('returns the highest role with a color', () => {
            // role1: pos 1, #ff0000
            // role2: pos 2, null
            // role3: pos 3, #00ff00
            expect(getHighestColorRoleForMember(['1', '2'], roleMap)).toBe(
                role1,
            );
            expect(getHighestColorRoleForMember(['1', '2', '3'], roleMap)).toBe(
                role3,
            );
        });

        it('returns undefined if no role has a color', () => {
            const noColorRole = { _id: '4', position: 4, color: null } as Role;
            const anotherNoColorRole = { _id: '5', position: 5 } as Role;
            const localMap = new Map<string, Role>([
                ['4', noColorRole],
                ['5', anotherNoColorRole],
            ]);
            expect(
                getHighestColorRoleForMember(['4', '5'], localMap),
            ).toBeUndefined();
        });

        it('supports multi-color roles', () => {
            const multiColorRole = {
                _id: '6',
                position: 6,
                colors: ['#ff0000', '#00ff00'],
            } as Role;
            const localMap = new Map<string, Role>([['6', multiColorRole]]);
            expect(getHighestColorRoleForMember(['6'], localMap)).toBe(
                multiColorRole,
            );
        });
    });
});
