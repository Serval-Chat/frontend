import { describe, expect, it } from 'vitest';

import type { Role } from '@/api/servers/servers.types';

import {
    getReadableRoleTextColorAt,
    getReadableRoleTextStyleAt,
    getRoleBackgroundColorAt,
    getRoleStyle,
    parseCssColor,
} from './roleColor';

const makeRole = (role: Partial<Role>): Role =>
    ({
        _id: 'role-1',
        serverId: 'server-1',
        name: 'Readable Role',
        color: null,
        position: 1,
        ...role,
    }) as Role;

describe('roleColor', (): void => {
    it('parses common CSS color formats used by role colors', (): void => {
        expect(parseCssColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(parseCssColor('#112233')).toEqual({ r: 17, g: 34, b: 51 });
        expect(parseCssColor('rgb(12, 34, 56)')).toEqual({
            r: 12,
            g: 34,
            b: 56,
        });
    });

    it('samples multi-stop role gradients across the pill', (): void => {
        const role = makeRole({
            colors: ['#000000', '#ffffff'],
        });

        expect(getRoleBackgroundColorAt(role, 0)).toEqual({
            r: 0,
            g: 0,
            b: 0,
        });
        expect(getRoleBackgroundColorAt(role, 1)).toEqual({
            r: 255,
            g: 255,
            b: 255,
        });
        expect(getRoleBackgroundColorAt(role, 0.5)).toEqual({
            r: 127.5,
            g: 127.5,
            b: 127.5,
        });
    });

    it('uses a single role color stop as both the painted and sampled background', (): void => {
        const role = makeRole({
            colors: ['#fff7a8'],
        });

        expect(getRoleStyle(role)).toEqual({ backgroundColor: '#fff7a8' });
        expect(getRoleBackgroundColorAt(role, 0.5)).toEqual({
            r: 255,
            g: 247,
            b: 168,
        });
    });

    it('wraps samples for repeated role gradients', (): void => {
        const role = makeRole({
            colors: ['#000000', '#ffffff'],
            gradientRepeat: 2,
        });

        expect(getRoleBackgroundColorAt(role, 0.25)).toEqual({
            r: 127.5,
            g: 127.5,
            b: 127.5,
        });
        expect(getRoleBackgroundColorAt(role, 0.75)).toEqual({
            r: 127.5,
            g: 127.5,
            b: 127.5,
        });
    });

    it('chooses dark glyphs on bright role colors and white glyphs on dark role colors', (): void => {
        expect(
            getReadableRoleTextColorAt(makeRole({ color: '#fff7a8' }), 0.5),
        ).toBe('#111827');
        expect(
            getReadableRoleTextColorAt(makeRole({ color: '#191627' }), 0.5),
        ).toBe('#ffffff');
    });

    it('keeps transition samples on a high contrast foreground instead of a low contrast gray', (): void => {
        const role = makeRole({
            colors: ['#000000', '#ffffff'],
        });

        expect(getReadableRoleTextColorAt(role, 0.5)).toBe('#111827');
        expect(getReadableRoleTextStyleAt(role, 0.5).textShadow).toContain(
            'rgba(255, 255, 255',
        );
    });
});
