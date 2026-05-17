import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreatePollModal } from './CreatePollModal';

vi.mock('@/hooks/useCustomEmojis', () => ({
    useCustomEmojis: () => ({
        customCategories: [],
        isLoading: false,
    }),
}));

describe('CreatePollModal', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('submits a 90 day poll without clamping it to 7 days', () => {
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
});
