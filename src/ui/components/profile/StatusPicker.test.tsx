import type React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StatusPicker } from './StatusPicker';

vi.mock('@/ui/components/common/Popover', () => ({
    Popover: ({
        isOpen,
        children,
    }: {
        isOpen: boolean;
        children: React.ReactNode;
    }) => (isOpen ? <div>{children}</div> : null),
}));

describe('StatusPicker', (): void => {
    it('renders all manual status options, including offline', (): void => {
        render(
            <StatusPicker
                currentStatus="online"
                isOpen
                triggerRef={{ current: null }}
                onClose={vi.fn()}
                onSelect={vi.fn()}
            />,
        );

        expect(screen.getByText('Online')).toBeTruthy();
        expect(screen.getByText('Idle')).toBeTruthy();
        expect(screen.getByText('Do Not Disturb')).toBeTruthy();
        expect(screen.getByText('Offline')).toBeTruthy();
    });

    it('calls onSelect with "offline" and closes when the offline option is clicked', (): void => {
        const onSelect = vi.fn();
        const onClose = vi.fn();
        render(
            <StatusPicker
                currentStatus="online"
                isOpen
                triggerRef={{ current: null }}
                onClose={onClose}
                onSelect={onSelect}
            />,
        );

        fireEvent.click(screen.getByText('Offline'));

        expect(onSelect).toHaveBeenCalledWith('offline');
        expect(onClose).toHaveBeenCalled();
    });

    it('marks the offline option as selected only when it is the current status', (): void => {
        const { rerender } = render(
            <StatusPicker
                currentStatus="online"
                isOpen
                triggerRef={{ current: null }}
                onClose={vi.fn()}
                onSelect={vi.fn()}
            />,
        );
        const offlineButtonBefore = screen
            .getByText('Offline')
            .closest('button');
        expect(offlineButtonBefore?.querySelector('svg')).toBeNull();

        rerender(
            <StatusPicker
                currentStatus="offline"
                isOpen
                triggerRef={{ current: null }}
                onClose={vi.fn()}
                onSelect={vi.fn()}
            />,
        );
        const offlineButtonAfter = screen
            .getByText('Offline')
            .closest('button');
        expect(offlineButtonAfter?.querySelector('svg')).toBeTruthy();
    });
});
