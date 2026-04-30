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

        it('ignores the default color #99aab5 and passes through to the next role', () => {
            const defaultColorRole = {
                _id: '8',
                position: 8,
                color: '#99aab5',
            } as Role;
            const customColorRole = {
                _id: '9',
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

        it('handles @everyone role properly (passes through if default, applies if custom)', () => {
            const everyoneDefault = {
                _id: '10',
                name: '@everyone',
                position: 0,
                color: '#99aab5',
            } as Role;
            const everyoneCustom = {
                _id: '11',
                name: '@everyone',
                position: 0,
                color: '#123456',
            } as Role;
            const someRole = {
                _id: '12',
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

        it('supports gradient roles defined by startColor/endColor', () => {
            const gradientRole = {
                _id: '7',
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
});
