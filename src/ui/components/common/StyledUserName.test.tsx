import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';

import { StyledUserName } from './StyledUserName';

vi.mock('@/utils/apiUrl', () => ({
    resolveApiUrl: (url: string) => `http://api${url}`,
}));

describe('StyledUserName Bot Coloring', () => {
    it('uses role color when role is present', () => {
        const botUser: User = {
            _id: 'bot-1',
            username: 'Bot',
            isBot: true,
        } as User;
        const coloredRole: Role = {
            _id: 'role-1',
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

    it('prioritizes role color over user gradient', () => {
        const user: User = {
            _id: 'user-1',
            username: 'Alpha',
            usernameGradient: {
                enabled: true,
                colors: ['#00ff00', '#0000ff'],
                angle: 45,
            },
        } as User;
        const role: Role = {
            _id: 'role-1',
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

    it('uses user gradient when no role color is provided', () => {
        const user: User = {
            _id: 'user-2',
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

    it('falls back to @everyone default role color', () => {
        const user: User = { _id: 'user-3', username: 'EveryoneUser' } as User;
        const everyoneRole: Role = {
            _id: 'everyone-role',
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

    it('does not apply user gradient when colors are disabled', () => {
        const user: User = {
            _id: 'user-4',
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
});
