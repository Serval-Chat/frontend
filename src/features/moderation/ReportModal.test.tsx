import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportModal } from './ReportModal';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/hooks/useReports', () => ({
    useReportOptions: (targetType: string) => ({
        data:
            targetType === 'user'
                ? [
                      {
                          id: 'user_impersonation',
                          targetType: 'user',
                          label: 'Impersonation',
                          subcategories: [],
                      },
                  ]
                : [
                      {
                          id: 'spam',
                          targetType: 'message',
                          label: 'Spam or scams',
                          subcategories: [
                              { id: 'advertising', label: 'Advertising' },
                          ],
                      },
                  ],
        isLoading: false,
        isError: false,
    }),
    useSubmitReport: () => ({ mutate, isPending: false, isError: false }),
}));

describe('ReportModal', () => {
    beforeEach(() => mutate.mockReset());

    it('submits the selected reason, optional details, and target', async () => {
        render(
            <ReportModal
                isOpen
                targetId="1234567890123456789"
                targetType="message"
                onClose={vi.fn()}
            />,
        );

        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'spam' },
        });
        fireEvent.change(screen.getByLabelText('Subcategory (optional)'), {
            target: { value: 'advertising' },
        });
        fireEvent.change(screen.getByLabelText('Details (optional)'), {
            target: { value: 'Repeated advertising' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

        expect(mutate).toHaveBeenCalledWith(
            {
                targetType: 'message',
                targetId: '1234567890123456789',
                reason: 'spam',
                subReason: 'advertising',
                details: 'Repeated advertising',
            },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
        const onSuccess = mutate.mock.calls[0]?.[1]?.onSuccess;
        onSuccess?.({ id: '9234567890123456789' });

        expect(
            await screen.findByText(
                'Your report has been submitted to platform staff for review. Thank you for helping keep Serchat safe.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'You can check its status later in Settings under My Reports.',
            ),
        ).toBeInTheDocument();
    });

    it('loads profile-specific reasons for a user report', () => {
        render(
            <ReportModal
                isOpen
                targetId="1234567890123456789"
                targetType="user"
                onClose={vi.fn()}
            />,
        );

        const reasonOptions = screen.getByLabelText(
            'Reason',
        ) as HTMLSelectElement;

        expect(
            Array.from(reasonOptions.options).map((option) => option.value),
        ).toEqual(['user_impersonation']);
        expect(screen.getByText('Impersonation')).toBeInTheDocument();
    });
});
