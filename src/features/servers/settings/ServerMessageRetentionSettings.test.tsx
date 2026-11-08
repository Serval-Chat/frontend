import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Server } from '@/api/servers/servers.types';
import { ServerMessageRetentionSettings } from '@/features/servers/settings/ServerMessageRetentionSettings';
import { DELETED_MESSAGE_RETENTION_OPTIONS } from '@/utils/deletedMessageRetention';

const mocks = vi.hoisted(() => ({
    flushDeletedMessages: vi.fn(),
    updateServer: vi.fn(),
    useServerDetails: vi.fn(),
    useFlushDeletedMessages: vi.fn(),
    useUpdateServer: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useFlushDeletedMessages: mocks.useFlushDeletedMessages,
    useServerDetails: mocks.useServerDetails,
    useUpdateServer: mocks.useUpdateServer,
}));

describe('ServerMessageRetentionSettings', () => {
    const server: Server = {
        id: 'server-1',
        name: 'Test server',
        ownerId: 'owner-1',
        deletedMessageRetentionMinutes: 4320,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useServerDetails.mockReturnValue({
            data: server,
            isLoading: false,
        });
        mocks.useUpdateServer.mockReturnValue({
            mutate: mocks.updateServer,
            isPending: false,
        });
        mocks.useFlushDeletedMessages.mockReturnValue({
            mutate: mocks.flushDeletedMessages,
            isPending: false,
        });
        mocks.updateServer.mockImplementation((_updates, callbacks) => {
            callbacks.onSuccess({
                ...server,
                deletedMessageRetentionMinutes: 5,
            });
        });
    });

    it('renders the ten-stop retention slider and saves its selected duration', () => {
        render(<ServerMessageRetentionSettings serverId="server-1" />);

        const slider = screen.getByRole('slider', {
            name: 'Deleted Message Retention',
        });
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute(
            'max',
            String(DELETED_MESSAGE_RETENTION_OPTIONS.length - 1),
        );
        expect(slider).toHaveAttribute('step', '1');
        expect(slider).toHaveValue('9');
        expect(slider).toHaveAttribute('aria-valuetext', '3 days');

        fireEvent.change(slider, { target: { value: '0' } });
        expect(screen.getAllByText('5 minutes')).toHaveLength(2);
        fireEvent.click(
            screen.getByRole('button', { name: 'Save unsaved changes' }),
        );

        expect(mocks.updateServer).toHaveBeenCalledWith(
            { deletedMessageRetentionMinutes: 5 },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it.each(
        DELETED_MESSAGE_RETENTION_OPTIONS.map((minutes, index) => [
            minutes,
            index,
        ]),
    )('snaps the slider to %i minutes', (minutes, index) => {
        render(<ServerMessageRetentionSettings serverId="server-1" />);

        const slider = screen.getByRole('slider', {
            name: 'Deleted Message Retention',
        });
        fireEvent.change(slider, { target: { value: String(index) } });

        expect(slider).toHaveValue(String(index));
        if (minutes === 4320) {
            expect(mocks.updateServer).not.toHaveBeenCalled();
        } else {
            fireEvent.click(
                screen.getByRole('button', { name: 'Save unsaved changes' }),
            );
            expect(mocks.updateServer).toHaveBeenCalledWith(
                { deletedMessageRetentionMinutes: minutes },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        }
    });

    it('sanitizes malformed stored values before showing them', () => {
        mocks.useServerDetails.mockReturnValue({
            data: { ...server, deletedMessageRetentionMinutes: 999_999 },
            isLoading: false,
        });

        render(<ServerMessageRetentionSettings serverId="server-1" />);

        expect(
            screen.getByRole('slider', {
                name: 'Deleted Message Retention',
            }),
        ).toHaveValue('9');
        expect(screen.getByText('3 days')).toBeInTheDocument();
    });

    it('requires explicit confirmation before permanently flushing messages', () => {
        render(<ServerMessageRetentionSettings serverId="server-1" />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete All Deleted Messages',
            }),
        );
        expect(
            screen.getByText(
                /This permanently deletes every already-deleted message/,
            ),
        ).toBeInTheDocument();
        expect(mocks.flushDeletedMessages).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mocks.flushDeletedMessages).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete All Deleted Messages',
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Permanently Delete All' }),
        );

        expect(mocks.flushDeletedMessages).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });
});
