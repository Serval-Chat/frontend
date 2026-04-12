import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageReaction } from '@/api/chat/chat.types';
import * as hooksPattern from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';
import { Reactions } from '@/ui/components/chat/Reactions';
import { TypingIndicator } from '@/ui/components/chat/TypingIndicator';

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(() => vi.fn()),
    useAppSelector: vi.fn(),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

interface MockMessage {
    _id: string;
    messageId: string;
    senderId: string;
    text: string;
    createdAt: string;
    replyTo?: { _id: string; user?: { _id: string }; text: string };
    user: { _id: string; username: string };
}

vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({
        message,
        isGrouped,
    }: {
        message: MockMessage;
        isGrouped: boolean;
    }) => (
        <div data-testid={`message-${message.messageId}`}>
            Message {message.messageId} - {message.senderId} (Grouped:{' '}
            {String(isGrouped)})
        </div>
    ),
}));

describe('Frontend Blocking Content Filters', () => {
    let mockUseAppSelector: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector = vi.spyOn(hooksPattern, 'useAppSelector');
    });

    describe('MessagesList (Flags: SPOILER_MESSAGES, HIDE_REPLIES_TO_THEM)', () => {
        it('renders collapsed group for messages from blocked users (Flag 2)', () => {
            mockUseAppSelector.mockReturnValue({
                'sender-blocked': BlockFlags.SPOILER_MESSAGES,
            });

            const messages: MockMessage[] = [
                {
                    _id: 'm1',
                    messageId: 'm1',
                    senderId: 'sender-ok',
                    text: 'Hello',
                    createdAt: '2023-01-01T00:00:00Z',
                    user: { _id: 'sender-ok', username: 'Ok' },
                },
                {
                    _id: 'm2',
                    messageId: 'm2',
                    senderId: 'sender-blocked',
                    text: 'Bad',
                    createdAt: '2023-01-01T00:01:00Z',
                    user: { _id: 'sender-blocked', username: 'Blocked' },
                },
                {
                    _id: 'm3',
                    messageId: 'm3',
                    senderId: 'sender-blocked',
                    text: 'Stuff',
                    createdAt: '2023-01-01T00:02:00Z',
                    user: { _id: 'sender-blocked', username: 'Blocked' },
                },
            ];

            render(
                <MessagesList
                    messages={messages as unknown as ProcessedChatMessage[]}
                />,
            );

            expect(screen.getByTestId('message-m1')).toBeInTheDocument();
            expect(screen.queryByTestId('message-m2')).not.toBeInTheDocument();
            expect(screen.queryByTestId('message-m3')).not.toBeInTheDocument();

            const expandBtn = screen.getByText('2 messages from blocked users');
            expect(expandBtn).toBeInTheDocument();

            fireEvent.click(expandBtn);

            expect(screen.getByTestId('message-m2')).toBeInTheDocument();
            expect(screen.getByTestId('message-m3')).toBeInTheDocument();
            expect(
                screen.getByText('2 messages from blocked users'),
            ).toBeInTheDocument();
        });

        it('completely hides messages that are replies to blocked users (Flag 4)', () => {
            mockUseAppSelector.mockReturnValue({
                'sender-blocked': BlockFlags.HIDE_REPLIES_TO_THEM,
            });

            const messages: MockMessage[] = [
                {
                    _id: 'm1',
                    messageId: 'm1',
                    senderId: 'sender-ok',
                    text: 'Normal',
                    createdAt: '2023-01-01T00:00:00Z',
                    user: { _id: 'sender-ok', username: 'Ok' },
                },
                {
                    _id: 'm2',
                    messageId: 'm2',
                    senderId: 'ok-2',
                    text: 'Reply to Bob',
                    createdAt: '2023-01-01T00:01:00Z',
                    replyTo: {
                        _id: 'm1',
                        user: { _id: 'sender-blocked' },
                        text: 'Hello',
                    },
                    user: { _id: 'ok-2', username: 'Ok 2' },
                },
            ];

            render(
                <MessagesList
                    messages={messages as unknown as ProcessedChatMessage[]}
                />,
            );

            expect(screen.getByTestId('message-m1')).toBeInTheDocument();
            expect(screen.queryByTestId('message-m2')).not.toBeInTheDocument();
        });
    });

    describe('TypingIndicator (Flag 8: HIDE_FROM_TYPING_INDICATORS)', () => {
        it('removes blocked users from typing users list', () => {
            mockUseAppSelector.mockReturnValue({
                'blocked-usr': BlockFlags.HIDE_FROM_TYPING_INDICATORS,
            });

            const typingUsers = [
                { userId: 'ok-1', username: 'Alice' },
                { userId: 'blocked-usr', username: 'Bob' },
                { userId: 'ok-2', username: 'Charlie' },
            ];

            const { container } = render(
                <TypingIndicator typingUsers={typingUsers} />,
            );

            expect(container.textContent).toMatch(
                /Alice and Charlie are typing/,
            );
            expect(container.textContent).not.toMatch(/Bob/);
        });
    });

    describe('Reactions (Flag 9: HIDE_THEIR_REACTIONS)', () => {
        it('removes the blocked user from the users array so chip count drops', () => {
            mockUseAppSelector.mockReturnValue({
                'u-blocked': BlockFlags.HIDE_THEIR_REACTIONS,
            });

            const reactions = [
                {
                    emoji: '❤️',
                    emojiType: 'unicode',
                    users: ['u-ok', 'u-blocked'],
                },
                {
                    emoji: '👍',
                    emojiType: 'unicode',
                    users: ['u-blocked'],
                },
            ];

            const { container } = render(
                <QueryClientProvider client={queryClient}>
                    <Reactions
                        messageId="m1"
                        reactions={reactions as unknown as MessageReaction[]}
                    />
                </QueryClientProvider>,
            );

            expect(container.textContent).toMatch(/1/);
            expect(container.textContent).not.toMatch(/👍/);
        });
    });
});
