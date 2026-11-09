import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SettingsModal } from './SettingsModal';

vi.mock('@/api/users/users.queries', () => ({
    useMe: () => ({ data: null }),
}));
vi.mock('@/features/users/hooks/useSelfStatus', () => ({
    useSelfStatus: () => ({ status: 'offline' }),
}));
vi.mock('@/store/hooks', () => ({
    useAppSelector: vi.fn().mockReturnValue(null),
}));
vi.mock('./AccountSettings', () => ({
    AccountSettings: () => <div>Account settings section</div>,
}));
vi.mock('./ReportsSettings', () => ({
    ReportsSettings: () => <div>My reports section</div>,
}));
vi.mock('./LogoutConfirmModal', () => ({
    LogoutConfirmModal: () => null,
}));

describe('SettingsModal', () => {
    it('navigates to and renders My Reports when selected', () => {
        render(
            <MemoryRouter initialEntries={['/chat/@setting/my-account']}>
                <Routes>
                    <Route
                        element={<SettingsModal isOpen onClose={vi.fn()} />}
                        path="/chat/@setting/:section"
                    />
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'My Reports' }));

        expect(screen.getByText('My reports section')).toBeInTheDocument();
    });
});
