import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { interactionsApi } from '@/api/interactions/interactions.api';
import { ToastProvider } from '@/ui/components/common/Toast';

import { MessageContent } from './MessageContent';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>
            <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
    </QueryClientProvider>
);

vi.mock('@/api/interactions/interactions.api', () => ({
    interactionsApi: {
        createComponentInteraction: vi.fn(),
    },
}));

describe('MessageContent embeds', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('renders embed-only bot message content', (): void => {
        render(
            <TestWrapper>
                <MessageContent
                    embeds={[
                        {
                            title: 'Bot Status',
                            description: 'All systems operational',
                        },
                    ]}
                    text=""
                />
            </TestWrapper>,
        );

        expect(screen.getByText('Bot Status')).toBeInTheDocument();
        expect(screen.getByText('All systems operational')).toBeInTheDocument();
    });

    it('renders both plain text and embed content', (): void => {
        render(
            <TestWrapper>
                <MessageContent
                    embeds={[
                        {
                            title: 'Build Result',
                            description: 'Deployment completed',
                        },
                    ]}
                    text="New deployment ready"
                />
            </TestWrapper>,
        );

        expect(screen.getByText('New deployment ready')).toBeInTheDocument();
        expect(screen.getByText('Build Result')).toBeInTheDocument();
        expect(screen.getByText('Deployment completed')).toBeInTheDocument();
    });

    it('renders embed buttons and sends custom button clicks', async (): Promise<void> => {
        vi.mocked(interactionsApi.createComponentInteraction).mockResolvedValue(
            {
                success: true,
            },
        );

        render(
            <TestWrapper>
                <MessageContent
                    channelId="channel-1"
                    components={[
                        {
                            type: 'button',
                            style: 'primary',
                            label: 'Cool button',
                            custom_id: 'cool',
                        },
                    ]}
                    embeds={[
                        {
                            title: 'Buttons',
                        },
                    ]}
                    messageId="message-1"
                    serverId="server-1"
                    text=""
                />
            </TestWrapper>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cool button' }));

        await waitFor((): void => {
            expect(
                interactionsApi.createComponentInteraction,
            ).toHaveBeenCalledWith({
                serverId: 'server-1',
                channelId: 'channel-1',
                messageId: 'message-1',
                componentIndex: 0,
                customId: 'cool',
            });
        });
    });

    it('does not invoke link or disabled embed buttons', (): void => {
        render(
            <TestWrapper>
                <MessageContent
                    channelId="channel-1"
                    components={[
                        {
                            type: 'button',
                            style: 'link',
                            label: 'Docs',
                            url: 'https://ser.chat',
                        },
                        {
                            type: 'button',
                            style: 'secondary',
                            label: 'Disabled',
                            custom_id: 'disabled',
                            disabled: true,
                        },
                    ]}
                    embeds={[
                        {
                            title: 'Buttons',
                        },
                    ]}
                    messageId="message-1"
                    serverId="server-1"
                    text=""
                />
            </TestWrapper>,
        );

        expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
            'href',
            'https://ser.chat',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
        expect(
            interactionsApi.createComponentInteraction,
        ).not.toHaveBeenCalled();
    });
});
