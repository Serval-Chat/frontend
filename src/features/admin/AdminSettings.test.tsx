import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminSettings } from './AdminSettings';

const { saveReportReasons } = vi.hoisted(() => ({
    saveReportReasons: vi.fn(),
}));

vi.mock('@/hooks/admin/useAdminReports', () => ({
    useAdminReportOptions: () => ({
        data: [
            {
                id: 'harassment',
                targetType: 'message',
                label: 'Harassment or bullying',
                enabled: true,
                position: 0,
                subcategories: [],
            },
            {
                id: 'user_impersonation',
                targetType: 'user',
                label: 'Impersonation',
                enabled: true,
                position: 0,
                subcategories: [],
            },
        ],
        isLoading: false,
        isError: false,
    }),
    useUpdateAdminReportOptions: () => ({
        mutate: saveReportReasons,
        isPending: false,
        isError: false,
    }),
}));
vi.mock('@/features/settings/ThemeSwitcher', () => ({
    ThemeSwitcher: () => null,
}));

describe('AdminSettings report reason editor', () => {
    beforeEach(() => saveReportReasons.mockReset());

    it('saves each reason with its selected target type', () => {
        render(<AdminSettings />);

        const targetTypes = screen.getAllByLabelText(/^Report reason type /);
        fireEvent.change(targetTypes[0]!, { target: { value: 'user' } });
        fireEvent.change(targetTypes[1]!, { target: { value: 'message' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save reasons' }));

        const savedOptions = saveReportReasons.mock.calls[0]?.[0] as {
            targetType: string;
        }[];
        expect(savedOptions.map((option) => option.targetType)).toEqual([
            'user',
            'message',
        ]);
    });
});
