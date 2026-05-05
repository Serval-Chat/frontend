import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageContent } from './MessageContent';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('MessageContent embeds', () => {
    it('renders embed-only bot message content', () => {
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

    it('renders both plain text and embed content', () => {
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
});
