import { render, screen } from '@testing-library/react';
import { Outlet } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as UsersQueries from '@/api/users/users.queries';

import { AdminRoute } from './AdminRoute';

vi.mock('react-router-dom', () => ({
    Navigate: ({ to }: { to: string }) => (
        <div data-testid="navigate" data-to={to} />
    ),
    Outlet: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

vi.mock('@/ui/components/common/LoadingSpinner', () => ({
    LoadingSpinner: ({ size }: { size: string }) => (
        <div data-size={size} data-testid="loading-spinner" />
    ),
}));

describe('AdminRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Outlet).mockReturnValue(
            <div data-testid="outlet">Admin Content</div>,
        );
    });

    it('shows a loading spinner while the user query is in flight', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as never);

        render(<AdminRoute />);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner')).toHaveAttribute(
            'data-size',
            'lg',
        );
    });

    it('redirects to /login when there is no authenticated user', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: undefined,
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        const nav = screen.getByTestId('navigate');
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveAttribute('data-to', '/login');
    });

    it('redirects to / when the user has no admin permissions at all', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: {
                _id: 'user-1',
                username: 'alice',
                permissions: {
                    adminAccess: false,
                    viewUsers: false,
                    manageUsers: false,
                    manageBadges: false,
                    banUsers: false,
                    viewBans: false,
                    warnUsers: false,
                    viewLogs: false,
                    manageServer: false,
                    manageInvites: false,
                },
            },
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        const nav = screen.getByTestId('navigate');
        expect(nav).toHaveAttribute('data-to', '/');
    });

    it('redirects to / when the user has no permissions object', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: {
                _id: 'user-2',
                username: 'bob',
                permissions: undefined,
            },
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        const nav = screen.getByTestId('navigate');
        expect(nav).toHaveAttribute('data-to', '/');
    });

    it('renders the outlet when the user has adminAccess=true', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: {
                _id: 'admin-1',
                username: 'superadmin',
                permissions: {
                    adminAccess: true,
                    viewUsers: false,
                    manageUsers: false,
                    manageBadges: false,
                    banUsers: false,
                    viewBans: false,
                    warnUsers: false,
                    viewLogs: false,
                    manageServer: false,
                    manageInvites: false,
                },
            },
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('renders the outlet when the user has any single permission (e.g. viewUsers)', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: {
                _id: 'mod-1',
                username: 'moderator',
                permissions: {
                    adminAccess: false,
                    viewUsers: true,
                    manageUsers: false,
                    manageBadges: false,
                    banUsers: false,
                    viewBans: false,
                    warnUsers: false,
                    viewLogs: false,
                    manageServer: false,
                    manageInvites: false,
                },
            },
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('renders the outlet for a moderator with multiple (but non-super) permissions', () => {
        vi.mocked(UsersQueries.useMe).mockReturnValue({
            data: {
                _id: 'mod-2',
                username: 'partial-mod',
                permissions: {
                    adminAccess: false,
                    viewUsers: true,
                    manageUsers: false,
                    manageBadges: false,
                    banUsers: true,
                    viewBans: true,
                    warnUsers: false,
                    viewLogs: false,
                    manageServer: false,
                    manageInvites: false,
                },
            },
            isLoading: false,
        } as never);

        render(<AdminRoute />);

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
});
