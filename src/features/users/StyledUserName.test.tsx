import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';

import { StyledUserName } from './StyledUserName';

vi.mock('@/utils/apiUrl', (): { resolveApiUrl: (url: string) => string } => ({
    resolveApiUrl: (url: string): string => `http://api${url}`,
}));

describe('StyledUserName Bot Coloring', (): void => {
    it('uses role color when role is present', (): void => {
        const botUser: User = {
            id: 'bot-1',
            username: 'Bot',
            isBot: true,
        } as User;
        const coloredRole: Role = {
            id: 'role-1',
            serverId: 'server-1',
            color: '#ff0000',
            name: 'Bot Role',
            position: 1,
        } as Role;

        const { container } = render(
            <StyledUserName role={coloredRole} user={botUser}>
                {botUser.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.color).toBe('rgb(255, 0, 0)');
    });

    it('prioritizes role color over user gradient', (): void => {
        const user: User = {
            id: 'user-1',
            username: 'Alpha',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 45,
            },
        } as User;
        const role: Role = {
            id: 'role-1',
            serverId: 'server-1',
            name: 'Moderator',
            color: '#ff0000',
            position: 10,
        } as Role;

        const { container } = render(
            <StyledUserName role={role} user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.color).toBe('rgb(255, 0, 0)');
        expect(firstCharSpan?.style.backgroundImage).toBe('');
    });

    it('uses user gradient when no role color is provided', (): void => {
        const user: User = {
            id: 'user-2',
            username: 'Gradient',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 135,
            },
        } as User;

        const { container } = render(
            <StyledUserName user={user}>{user.username}</StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.backgroundImage).toContain(
            'linear-gradient(135deg',
        );
        expect(firstCharSpan?.style.backgroundImage).toContain(
            'rgb(0, 255, 0)',
        );
        expect(firstCharSpan?.style.backgroundImage).toContain(
            'rgb(0, 0, 255)',
        );
        expect(firstCharSpan?.style.color).toBe('transparent');
    });

    it('falls back to @everyone default role color', (): void => {
        const user: User = { id: 'user-3', username: 'EveryoneUser' } as User;
        const everyoneRole: Role = {
            id: 'everyone-role',
            serverId: 'server-1',
            name: '@everyone',
            color: '#99aab5',
            position: 0,
        } as Role;

        const { container } = render(
            <StyledUserName role={everyoneRole} user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.color).toBe('rgb(153, 170, 181)');
    });

    it('does not apply user gradient when colors are disabled', (): void => {
        const user: User = {
            id: 'user-4',
            username: 'NoColor',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 90,
            },
        } as User;

        const { container } = render(
            <StyledUserName disableColors user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.backgroundImage).toBe('');
        expect(firstCharSpan?.style.color).toBe('');
    });

    it('keeps role color and removes glow when custom colors and glow are disabled', (): void => {
        const user: User = {
            id: 'user-5',
            username: 'RoleWins',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 90,
            },
            usernameGlow: {
                enabled: true,
                color: '#00ff00',
                intensity: 5,
            },
        } as User;
        const role: Role = {
            id: 'role-2',
            serverId: 'server-1',
            name: 'Member',
            color: '#ff0000',
            position: 10,
        } as Role;

        const { container } = render(
            <StyledUserName disableColors disableGlow role={role} user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        expect(firstCharSpan?.style.color).toBe('rgb(255, 0, 0)');
        expect(firstCharSpan?.style.backgroundImage).toBe('');
        expect(
            container.querySelectorAll('span[aria-hidden="true"]'),
        ).toHaveLength(0);
    });

    it('does not use a disabled user glow color over role color', (): void => {
        const user: User = {
            id: 'user-6',
            username: 'RoleGlow',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 90,
            },
            usernameGlow: {
                enabled: false,
                color: '#2c7ead',
                intensity: 8,
            },
        } as User;
        const role: Role = {
            id: 'role-3',
            serverId: 'server-1',
            name: 'Administrator',
            color: '#e67e22',
            position: 10,
        } as Role;

        const { container } = render(
            <StyledUserName role={role} user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        const firstGlowSpan = container.querySelector<HTMLSpanElement>(
            'span[aria-hidden="true"]',
        );

        expect(firstCharSpan?.style.color).toBe('rgb(230, 126, 34)');
        expect(firstGlowSpan?.style.color).toBe('rgb(230, 126, 34)');
    });

    it('does not use an enabled user glow color over role color', (): void => {
        const user: User = {
            id: 'user-7',
            username: 'RoleGlowWins',
            usernameGradient: {
                enabled: true,
                colors: ['#ff45ec', '#2f98ff'],
                angle: 90,
            },
            usernameGlow: {
                enabled: true,
                color: '#da45ff',
                intensity: 8,
            },
        } as User;
        const role: Role = {
            id: 'role-4',
            serverId: 'server-1',
            name: 'Administrator',
            color: '#e67e22',
            position: 10,
        } as Role;

        const { container } = render(
            <StyledUserName role={role} user={user}>
                {user.username}
            </StyledUserName>,
        );

        const firstCharSpan =
            container.querySelector<HTMLSpanElement>('span.relative');
        const firstGlowSpan = container.querySelector<HTMLSpanElement>(
            'span[aria-hidden="true"]',
        );

        expect(firstCharSpan?.style.color).toBe('rgb(230, 126, 34)');
        expect(firstGlowSpan?.style.color).toBe('rgb(230, 126, 34)');
    });
});
