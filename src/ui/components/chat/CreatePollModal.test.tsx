import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreatePollModal } from './CreatePollModal';

vi.mock(
    '@/hooks/useCustomEmojis',
    (): {
        useCustomEmojis: () => {
            customCategories: never[];
            isLoading: boolean;
        };
    } => ({
        useCustomEmojis: (): {
            customCategories: never[];
            isLoading: false;
        } => ({
            customCategories: [],
            isLoading: false,
        }),
    }),
);

describe('CreatePollModal', (): void => {
    afterEach((): void => {
        vi.useRealTimers();
    });

    it('submits a 90 day poll without clamping it to 7 days', (): void => {
        const now = new Date('2026-05-17T12:00:00.000Z');
        vi.useFakeTimers();
        vi.setSystemTime(now);

        const onSubmit = vi.fn();

        render(
            <CreatePollModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
        );

        fireEvent.change(screen.getByPlaceholderText('Ask a question...'), {
            target: { value: 'Long poll?' },
        });
        fireEvent.change(screen.getByPlaceholderText('Option 1'), {
            target: { value: 'Yes' },
        });
        fireEvent.change(screen.getByPlaceholderText('Option 2'), {
            target: { value: 'No' },
        });

        fireEvent.click(screen.getByRole('button', { name: '90 days' }));
        fireEvent.click(screen.getByRole('button', { name: 'Create Poll' }));

        expect(onSubmit).toHaveBeenCalledOnce();

        const submittedPoll = onSubmit.mock.calls[0]![0];
        expect(submittedPoll.expiresAt).toBe(
            new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        );
    });

    it('removes the emoji picker resize listener it added', (): void => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = render(
            <CreatePollModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Choose emoji for option 1' }),
        );

        const addedResizeHandlers = addSpy.mock.calls
            .filter(([type]): boolean => type === 'resize')
            .map(([, handler]): unknown => handler);
        expect(addedResizeHandlers.length).toBeGreaterThan(0);

        unmount();

        const removedResizeHandlers = new Set(
            removeSpy.mock.calls
                .filter(([type]): boolean => type === 'resize')
                .map(([, handler]): unknown => handler),
        );
        for (const handler of addedResizeHandlers) {
            expect(removedResizeHandlers.has(handler)).toBe(true);
        }

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });
});
