import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageContent } from './MessageContent';

describe('MessageContent embeds', () => {
    it('renders embed-only bot message content', () => {
        render(
            <MessageContent
                embeds={[
                    {
                        title: 'Bot Status',
                        description: 'All systems operational',
                    },
                ]}
                text=""
            />,
        );

        expect(screen.getByText('Bot Status')).toBeInTheDocument();
        expect(screen.getByText('All systems operational')).toBeInTheDocument();
    });

    it('renders both plain text and embed content', () => {
        render(
            <MessageContent
                embeds={[
                    {
                        title: 'Build Result',
                        description: 'Deployment completed',
                    },
                ]}
                text="New deployment ready"
            />,
        );

        expect(screen.getByText('New deployment ready')).toBeInTheDocument();
        expect(screen.getByText('Build Result')).toBeInTheDocument();
        expect(screen.getByText('Deployment completed')).toBeInTheDocument();
    });
});
