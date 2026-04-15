import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Admin } from './Admin';

vi.mock('@/ui/components/admin/AdminLayout', () => ({
    AdminLayout: ({
        children,
        sidebar,
        title,
    }: {
        children: React.ReactNode;
        sidebar: React.ReactNode;
        title: string;
    }) => (
        <div data-testid="admin-layout">
            <div data-testid="admin-title">{title}</div>
            <div data-testid="admin-sidebar">{sidebar}</div>
            <div data-testid="admin-content">{children}</div>
        </div>
    ),
}));

vi.mock('@/ui/components/admin/AdminSidebar', () => ({
    AdminSidebar: () => {
        const location = useLocation();
        const activeSection = location.pathname.split('/')[2] || 'overview';
        return (
            <div data-active={activeSection} data-testid="admin-sidebar-inner">
                {[
                    'overview',
                    'users',
                    'logs',
                    'badges',
                    'settings',
                    'servers',
                    'bans',
                ].map((s) => (
                    <Link data-testid={`nav-${s}`} key={s} to={`/admin/${s}`}>
                        {s}
                    </Link>
                ))}
            </div>
        );
    },
}));

vi.mock('@/ui/components/admin/AdminOverview', () => ({
    AdminOverview: () => <div data-testid="admin-overview" />,
}));

vi.mock('@/ui/components/admin/AdminIAM', () => ({
    AdminIAM: ({ onViewUser }: { onViewUser: (id: string) => void }) => (
        <div data-testid="admin-iam">
            <button
                data-testid="view-user-btn"
                type="button"
                onClick={() => onViewUser('user-42')}
            >
                View user
            </button>
        </div>
    ),
}));

vi.mock('@/ui/components/admin/AdminUserDetail', () => ({
    AdminUserDetail: ({
        userId,
        onBack,
    }: {
        userId: string;
        onBack: () => void;
    }) => (
        <div data-testid="admin-user-detail" data-user-id={userId}>
            <button data-testid="back-btn" type="button" onClick={onBack}>
                Back
            </button>
        </div>
    ),
}));

vi.mock('@/ui/components/admin/AdminAuditLogs', () => ({
    AdminAuditLogs: () => <div data-testid="admin-audit-logs" />,
}));

vi.mock('@/ui/components/admin/AdminBadges', () => ({
    AdminBadges: () => <div data-testid="admin-badges" />,
}));

vi.mock('@/ui/components/admin/AdminSettings', () => ({
    AdminSettings: () => <div data-testid="admin-settings" />,
}));

vi.mock('@/ui/components/admin/AdminServers', () => ({
    AdminServers: ({
        onViewServer,
    }: {
        onViewServer: (id: string) => void;
    }) => (
        <div data-testid="admin-servers">
            <button
                data-testid="view-server-btn"
                onClick={() => onViewServer('server-1')}
            >
                View
            </button>
        </div>
    ),
}));

vi.mock('@/ui/components/admin/AdminAwaitingReview', () => ({
    AdminAwaitingReview: () => <div data-testid="admin-awaiting-review" />,
}));

vi.mock('@/ui/components/admin/AdminServerDetail', () => ({
    AdminServerDetail: () => <div data-testid="admin-server-detail" />,
}));

vi.mock('@/ui/components/admin/AdminInvites', () => ({
    AdminInvites: () => <div data-testid="admin-invites" />,
}));

vi.mock('@/ui/components/common/Text', () => ({
    Text: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));

describe('Admin page', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the Overview section by default', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByTestId('admin-overview')).toBeInTheDocument();
    });

    it('shows "System Overview" as the title by default', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'System Overview',
        );
    });

    it('passes "overview" as the active section to the sidebar by default', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByTestId('admin-sidebar-inner')).toHaveAttribute(
            'data-active',
            'overview',
        );
    });

    it('switches to the Users section when the sidebar emits "users"', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-users'));
        expect(screen.getByTestId('admin-iam')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'User Management',
        );
    });

    it('switches to Audit Logs when the sidebar emits "logs"', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-logs'));
        expect(screen.getByTestId('admin-audit-logs')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Audit Logs',
        );
    });

    it('switches to Badges when the sidebar emits "badges"', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-badges'));
        expect(screen.getByTestId('admin-badges')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent('Badges');
    });

    it('switches to Settings when the sidebar emits "settings"', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-settings'));
        expect(screen.getByTestId('admin-settings')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Admin Settings',
        );
    });

    it('shows "Coming Soon" content for "servers" section (no component implemented yet)', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-servers'));
        expect(screen.getByTestId('admin-servers')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Server Moderation',
        );
    });

    it('shows "Coming Soon" content for "bans" section (no component implemented yet)', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByTestId('nav-bans'));
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Bans & Mutes',
        );
    });

    it('shows UserDetail when AdminIAM emits onViewUser, and title becomes "User Details"', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByTestId('nav-users'));
        expect(screen.getByTestId('admin-iam')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('view-user-btn'));

        const detail = screen.getByTestId('admin-user-detail');
        expect(detail).toBeInTheDocument();
        expect(detail).toHaveAttribute('data-user-id', 'user-42');
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'User Details',
        );
        expect(screen.queryByTestId('admin-iam')).not.toBeInTheDocument();
    });

    it('returns to the IAM list when UserDetail emits onBack', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByTestId('nav-users'));
        fireEvent.click(screen.getByTestId('view-user-btn'));
        expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('back-btn'));

        expect(screen.getByTestId('admin-iam')).toBeInTheDocument();
        expect(
            screen.queryByTestId('admin-user-detail'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'User Management',
        );
    });

    it('clears the selected user when navigating away from users and back', () => {
        render(
            <MemoryRouter initialEntries={['/admin/overview']}>
                <Routes>
                    <Route element={<Admin />} path="/admin/*" />
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByTestId('nav-users'));
        fireEvent.click(screen.getByTestId('view-user-btn'));
        expect(screen.getByTestId('admin-user-detail')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('nav-overview'));
        expect(screen.getByTestId('admin-overview')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('nav-users'));
        expect(screen.getByTestId('admin-iam')).toBeInTheDocument();
        expect(
            screen.queryByTestId('admin-user-detail'),
        ).not.toBeInTheDocument();
    });
});
