import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { User } from '@/api/users/users.types';

import { MessageHeader } from './MessageHeader';

const TEST_TIMESTAMP = new Date().toISOString();

describe('MessageHeader', (): void => {
    it('renders bot tag for bot users', (): void => {
        const botUser: User = {
            id: 'u1',
            username: 'helper-bot',
            isBot: true,
        } as User;

        render(<MessageHeader timestamp={TEST_TIMESTAMP} user={botUser} />);

        expect(screen.getByText('BOT')).toBeInTheDocument();
    });

    it('renders a verified checkmark next to the bot tag for a verified bot', (): void => {
        const verifiedBotUser: User = {
            id: 'u1',
            username: 'helper-bot',
            isBot: true,
            botVerified: true,
        } as User;

        render(
            <MessageHeader timestamp={TEST_TIMESTAMP} user={verifiedBotUser} />,
        );

        expect(screen.getByText('BOT')).toBeInTheDocument();
        expect(screen.getByLabelText('Verified bot')).toBeInTheDocument();
    });

    it('does not render a verified checkmark for an unverified bot', (): void => {
        const unverifiedBotUser: User = {
            id: 'u1',
            username: 'helper-bot',
            isBot: true,
            botVerified: false,
        } as User;

        render(
            <MessageHeader
                timestamp={TEST_TIMESTAMP}
                user={unverifiedBotUser}
            />,
        );

        expect(screen.getByText('BOT')).toBeInTheDocument();
        expect(screen.queryByLabelText('Verified bot')).not.toBeInTheDocument();
    });

    it('does not render bot tag for non-bot users', (): void => {
        const humanUser: User = {
            id: 'u2',
            username: 'alice',
            isBot: false,
        } as User;

        render(<MessageHeader timestamp={TEST_TIMESTAMP} user={humanUser} />);

        expect(screen.queryByText('BOT')).not.toBeInTheDocument();
    });

    it('renders webhook tag for webhook messages', (): void => {
        const webhookUser: User = {
            id: 'u3',
            username: 'incoming-hook',
            isBot: false,
        } as User;

        render(
            <MessageHeader
                isWebhook
                timestamp={TEST_TIMESTAMP}
                user={webhookUser}
            />,
        );

        expect(screen.getByText('WEBHOOK')).toBeInTheDocument();
    });
});
