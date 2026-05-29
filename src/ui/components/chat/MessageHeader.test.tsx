import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { User } from '@/api/users/users.types';

import { MessageHeader } from './MessageHeader';

describe('MessageHeader', (): void => {
    it('renders bot tag for bot users', (): void => {
        const botUser: User = {
            _id: 'u1',
            username: 'helper-bot',
            isBot: true,
        } as User;

        render(
            <MessageHeader
                timestamp={new Date().toISOString()}
                user={botUser}
            />,
        );

        expect(screen.getByText('BOT')).toBeInTheDocument();
    });

    it('does not render bot tag for non-bot users', (): void => {
        const humanUser: User = {
            _id: 'u2',
            username: 'alice',
            isBot: false,
        } as User;

        render(
            <MessageHeader
                timestamp={new Date().toISOString()}
                user={humanUser}
            />,
        );

        expect(screen.queryByText('BOT')).not.toBeInTheDocument();
    });

    it('renders webhook tag for webhook messages', (): void => {
        const webhookUser: User = {
            _id: 'u3',
            username: 'incoming-hook',
            isBot: false,
        } as User;

        render(
            <MessageHeader
                isWebhook
                timestamp={new Date().toISOString()}
                user={webhookUser}
            />,
        );

        expect(screen.getByText('WEBHOOK')).toBeInTheDocument();
    });
});
