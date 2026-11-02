import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AdminReports } from './AdminReports';

vi.mock('@/hooks/admin/useAdminReports', () => ({
    useAdminReports: () => ({
        data: [
            {
                id: '100000000000000001',
                targetType: 'message',
                targetId: '200000000000000002',
                targetUserId: '300000000000000003',
                targetUsername: 'Nickname',
                messageSnapshot: 'Check https://example.test',
                messageContent: {
                    text: 'Check https://example.test',
                    isEdited: true,
                    editedAt: '2026-10-24T00:10:00.000Z',
                    attachments: [
                        {
                            attachmentId: 'file-1',
                            type: 'image',
                            mimeType: 'image/png',
                            name: 'evidence.png',
                            size: 42,
                        },
                    ],
                    embeds: [
                        {
                            title: 'Saved preview',
                            url: 'https://example.test',
                            description: 'Saved description',
                            image: { url: 'https://example.test/preview.png' },
                        },
                    ],
                    components: [
                        {
                            type: 'button',
                            style: 'link',
                            label: 'External link',
                            url: 'https://example.test/button',
                        },
                    ],
                    poll: {
                        title: 'Report poll',
                        options: [{ id: 'yes', text: 'Yes', votes: 2 }],
                        multiSelect: false,
                    },
                    editHistory: [
                        {
                            text: 'First version',
                            editedAt: '2026-10-23T23:00:00.000Z',
                        },
                        {
                            text: 'Second version',
                            editedAt: '2026-10-23T23:30:00.000Z',
                        },
                    ],
                },
                messageContext: [
                    {
                        id: '150000000000000001',
                        senderId: '500000000000000005',
                        senderUsername: 'Previous Author',
                        isTarget: false,
                        text: 'Message before the report target',
                        createdAt: '2026-10-23T22:59:00.000Z',
                        editHistory: [],
                    },
                    {
                        id: '200000000000000002',
                        senderId: '300000000000000003',
                        senderUsername: 'Nickname',
                        isTarget: true,
                        text: 'Check https://example.test',
                        isEdited: true,
                        editedAt: '2026-10-24T00:10:00.000Z',
                        editHistory: [
                            {
                                text: 'First version',
                                editedAt: '2026-10-23T23:00:00.000Z',
                            },
                            {
                                text: 'Second version',
                                editedAt: '2026-10-23T23:30:00.000Z',
                            },
                        ],
                    },
                    {
                        id: '250000000000000002',
                        senderId: '500000000000000005',
                        senderUsername: 'Next Author',
                        isTarget: false,
                        text: 'Message after the report target',
                        createdAt: '2026-10-24T00:11:00.000Z',
                        editHistory: [],
                    },
                ],
                reason: 'spam',
                status: 'open',
                reporterId: '400000000000000004',
                createdAt: '2026-10-24T00:00:00.000Z',
            },
        ],
        isLoading: false,
        isError: false,
    }),
    useUpdateAdminReport: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useUsers', () => ({
    useUsers: () => ({
        data: [
            {
                id: '400000000000000004',
                username: 'reporter',
                displayName: 'Reporter Name',
            },
            {
                id: '300000000000000003',
                username: 'nickname',
                displayName: 'Nickname',
                profilePicture: '/api/v1/profile/picture/avatar.png',
            },
        ],
    }),
}));
vi.mock('@/ui/components/chat/Message', () => ({
    Message: ({
        message,
        user,
        disableActions,
        isReportPreview,
        reportPoll,
    }: {
        message: {
            text: string;
            attachments: unknown[];
            embeds: unknown[];
            components: unknown[];
        };
        user: { displayName?: string; username: string };
        disableActions: boolean;
        isReportPreview: boolean;
        reportPoll?: { title: string };
    }) => (
        <div
            data-attachment-count={message.attachments.length}
            data-component-count={message.components.length}
            data-disable-actions={disableActions}
            data-embed-count={message.embeds.length}
            data-report-poll={reportPoll?.title}
            data-report-preview={isReportPreview}
            data-testid="chat-message"
        >
            {user.displayName ?? user.username}: {message.text}
            {message.embeds.map((embed) => {
                const item = embed as {
                    title?: string;
                    description?: string;
                    image?: { url: string };
                };
                return (
                    <div key={item.title}>
                        {item.title ? <span>{item.title}</span> : null}
                        {item.description ? (
                            <span>{item.description}</span>
                        ) : null}
                        {item.image ? (
                            <span>External media preview omitted</span>
                        ) : null}
                    </div>
                );
            })}
            {message.components.map((component) => {
                const item = component as { label?: string; url?: string };
                return (
                    <span key={item.label}>
                        {item.label} {item.url}
                    </span>
                );
            })}
            {reportPoll?.title}
        </div>
    ),
}));

const UserDetailsRoute = () => {
    const location = useLocation();
    return <div>Profile route return path: {location.state?.from}</div>;
};

describe('AdminReports', () => {
    it('opens the reported user profile and preserves the report queue return path', () => {
        render(
            <MemoryRouter initialEntries={['/admin/reports?status=open']}>
                <Routes>
                    <Route element={<AdminReports />} path="/admin/reports" />
                    <Route
                        element={<UserDetailsRoute />}
                        path="/admin/users/:userId"
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('link', {
                name: 'View reporter profile: Reporter Name',
            }),
        ).toHaveAttribute('href', '/admin/users/400000000000000004');
        expect(screen.getByTestId('chat-message')).toHaveTextContent(
            'Nickname: Check https://example.test',
        );
        expect(
            screen.getByRole('region', {
                name: 'Message context at report time',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Message before the report target'),
        ).toBeInTheDocument();
        expect(screen.getByText('First version')).toHaveClass(
            'text-text-muted',
        );
        expect(screen.getByText('Second version')).toHaveClass(
            'text-text-muted',
        );
        expect(
            screen.getByText('Message after the report target'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-attachment-count',
            '1',
        );
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-embed-count',
            '1',
        );
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-component-count',
            '1',
        );
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-report-poll',
            'Report poll',
        );
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-report-preview',
            'true',
        );
        expect(screen.getByTestId('chat-message')).toHaveAttribute(
            'data-disable-actions',
            'true',
        );
        expect(screen.getByText('Saved preview')).toBeInTheDocument();
        expect(screen.getByText('Saved description')).toBeInTheDocument();
        expect(screen.getByText(/External link/)).toBeInTheDocument();
        expect(
            screen.getByRole('region', { name: 'Reported message' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('External media preview omitted'),
        ).toBeInTheDocument();
        expect(
            document.querySelector('a[href^="https://example.test"]'),
        ).toBeNull();
        expect(
            document.querySelector('img[src^="https://example.test"]'),
        ).toBeNull();

        fireEvent.click(
            screen.getByRole('link', {
                name: 'Open current profile (reported as Nickname)',
            }),
        );

        expect(
            screen.getByText(
                'Profile route return path: /admin/reports?status=open',
            ),
        ).toBeInTheDocument();
    });
});
