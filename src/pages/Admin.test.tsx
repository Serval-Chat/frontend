import { fireEvent, render, screen } from '@testing-library/react';
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
    AdminSidebar: ({
        activeSection,
        onSectionChange,
    }: {
        activeSection: string;
        onSectionChange: (s: string) => void;
    }) => (
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
                <button
                    data-testid={`nav-${s}`}
                    key={s}
                    type="button"
                    onClick={() => onSectionChange(s)}
                >
                    {s}
                </button>
            ))}
        </div>
    ),
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

vi.mock('@/ui/components/common/Text', () => ({
    Text: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));

describe('Admin page', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the Overview section by default', () => {
        render(<Admin />);
        expect(screen.getByTestId('admin-overview')).toBeInTheDocument();
    });

    it('shows "System Overview" as the title by default', () => {
        render(<Admin />);
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'System Overview',
        );
    });

    it('passes "overview" as the active section to the sidebar by default', () => {
        render(<Admin />);
        expect(screen.getByTestId('admin-sidebar-inner')).toHaveAttribute(
            'data-active',
            'overview',
        );
    });

    it('switches to the Users section when the sidebar emits "users"', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-users'));
        expect(screen.getByTestId('admin-iam')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'User Management',
        );
    });

    it('switches to Audit Logs when the sidebar emits "logs"', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-logs'));
        expect(screen.getByTestId('admin-audit-logs')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Audit Logs',
        );
    });

    it('switches to Badges when the sidebar emits "badges"', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-badges'));
        expect(screen.getByTestId('admin-badges')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent('Badges');
    });

    it('switches to Settings when the sidebar emits "settings"', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-settings'));
        expect(screen.getByTestId('admin-settings')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Admin Settings',
        );
    });

    it('shows "Coming Soon" content for "servers" section (no component implemented yet)', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-servers'));
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Server Moderation',
        );
    });

    it('shows "Coming Soon" content for "bans" section (no component implemented yet)', () => {
        render(<Admin />);
        fireEvent.click(screen.getByTestId('nav-bans'));
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByTestId('admin-title')).toHaveTextContent(
            'Bans & Mutes',
        );
    });

    it('shows UserDetail when AdminIAM emits onViewUser, and title becomes "User Details"', () => {
        render(<Admin />);

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
        render(<Admin />);

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
        render(<Admin />);

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
