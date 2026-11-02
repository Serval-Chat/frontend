import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportPunishmentActions } from './ReportPunishmentActions';

const { warnUserMock, muteUserMock, banUserMock } = vi.hoisted(() => ({
    warnUserMock: vi.fn(),
    muteUserMock: vi.fn(),
    banUserMock: vi.fn(),
}));

vi.mock('@/api/warnings/warnings.api', () => ({
    warningsApi: { warnUser: warnUserMock },
}));
vi.mock('@/api/admin/bans.api', () => ({
    adminBansApi: {
        muteUser: muteUserMock,
        banUser: banUserMock,
    },
}));

describe('ReportPunishmentActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        warnUserMock.mockResolvedValue({});
        muteUserMock.mockResolvedValue({});
        banUserMock.mockResolvedValue({});
    });

    it.each([
        {
            action: 'warn',
            button: 'Issue warning',
            applyPunishment: warnUserMock,
            duration: undefined,
        },
        {
            action: 'mute',
            button: 'Mute user',
            applyPunishment: muteUserMock,
            duration: 60,
        },
        {
            action: 'ban',
            button: 'Ban user',
            applyPunishment: banUserMock,
            duration: 1440,
        },
    ])(
        'sends only the moderator reason for $action with a long reported message',
        async ({ action, button, applyPunishment, duration }) => {
            render(
                <ReportPunishmentActions
                    report={{
                        id: '100000000000000001',
                        targetType: 'message',
                        targetId: '200000000000000002',
                        targetUserId: '300000000000000003',
                        reason: 'spam',
                        reasonLabel: 'Spam',
                        status: 'open',
                        reporterId: '400000000000000004',
                        createdAt: '2026-10-24T00:00:00.000Z',
                        messageSnapshot: 'x'.repeat(10_000),
                        messageContent: { text: 'x'.repeat(10_000) },
                    }}
                />,
            );

            fireEvent.change(screen.getByRole('combobox'), {
                target: { value: action },
            });
            fireEvent.click(screen.getByRole('button', { name: button }));

            await waitFor(() => {
                expect(applyPunishment).toHaveBeenCalledWith(
                    '300000000000000003',
                    'Reported for Spam',
                    duration,
                );
            });
            expect(applyPunishment.mock.calls[0]?.[1]).toHaveLength(
                'Reported for Spam'.length,
            );
            expect(
                screen.queryByText(/reported message will be included/i),
            ).not.toBeInTheDocument();
        },
    );
});
