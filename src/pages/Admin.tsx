import type { ReactNode } from 'react';

import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

import { AdminAuditLogs } from '@/features/admin/AdminAuditLogs';
import { AdminAwaitingReview } from '@/features/admin/AdminAwaitingReview';
import { AdminBadges } from '@/features/admin/AdminBadges';
import { AdminBansAndMutes } from '@/features/admin/AdminBansAndMutes';
import { AdminBots } from '@/features/admin/AdminBots';
import { AdminBotsAwaitingReview } from '@/features/admin/AdminBotsAwaitingReview';
import { AdminIAM } from '@/features/admin/AdminIAM';
import { AdminInvites } from '@/features/admin/AdminInvites';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { AdminOverview } from '@/features/admin/AdminOverview';
import { AdminReports } from '@/features/admin/AdminReports';
import { AdminServerDetail } from '@/features/admin/AdminServerDetail';
import { AdminServers } from '@/features/admin/AdminServers';
import { AdminSettings } from '@/features/admin/AdminSettings';
import { AdminSidebar } from '@/features/admin/AdminSidebar';
import { AdminUserDetail } from '@/features/admin/AdminUserDetail';
import { Text } from '@/ui/primitives/Text';

const AdminUserDetailWrapper = (): ReactNode => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    if (!userId) return <Navigate replace to="/admin/users" />;
    const returnPath = (location.state as { from?: unknown } | null)?.from;
    const onBack = (): void =>
        void navigate(
            typeof returnPath === 'string' &&
                returnPath.startsWith('/admin/reports')
                ? returnPath
                : '/admin/users',
        );
    return <AdminUserDetail userId={userId} onBack={onBack} />;
};

const AdminServerDetailWrapper = (): ReactNode => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    if (!serverId) return <Navigate replace to="/admin/servers" />;
    return (
        <AdminServerDetail
            serverId={serverId}
            onBack={(): undefined => void navigate('/admin/servers')}
            onViewUser={(uid): undefined =>
                void navigate(`/admin/users/${uid}`)
            }
        />
    );
};

interface AdminContentProps {
    navigate: ReturnType<typeof useNavigate>;
}

const AdminContent = ({ navigate }: AdminContentProps): ReactNode => (
    <Routes>
        <Route element={<Navigate replace to="overview" />} path="/" />
        <Route element={<AdminOverview />} path="overview" />

        <Route
            element={
                <AdminIAM
                    onViewUser={(id): undefined =>
                        void navigate(`/admin/users/${id}`)
                    }
                />
            }
            path="users"
        />
        <Route element={<AdminUserDetailWrapper />} path="users/:userId" />

        <Route
            element={
                <AdminServers
                    onViewServer={(id): undefined =>
                        void navigate(`/admin/servers/${id}`)
                    }
                />
            }
            path="servers"
        />
        <Route
            element={
                <AdminAwaitingReview
                    onViewServer={(id): undefined =>
                        void navigate(`/admin/servers/${id}`)
                    }
                />
            }
            path="servers/review"
        />
        <Route
            element={<AdminServerDetailWrapper />}
            path="servers/:serverId"
        />

        <Route element={<AdminBots />} path="bots" />
        <Route element={<AdminBotsAwaitingReview />} path="bots/review" />

        <Route element={<AdminAuditLogs />} path="logs" />
        <Route element={<AdminReports />} path="reports" />
        <Route element={<AdminBadges />} path="badges" />
        <Route element={<AdminInvites />} path="invites" />
        <Route element={<AdminSettings />} path="settings" />

        <Route element={<AdminBansAndMutes />} path="bans" />

        <Route
            element={
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle text-muted-foreground">
                    <Text as="p" size="lg" weight="medium">
                        Coming Soon
                    </Text>
                    <Text as="p" size="sm">
                        This management module is under development.
                    </Text>
                </div>
            }
            path="*"
        />
    </Routes>
);

export const Admin = (): ReactNode => {
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = (): string => {
        const path = location.pathname;
        if (path.startsWith('/admin/users/')) return 'User Details';
        if (path.startsWith('/admin/servers/')) {
            if (path === '/admin/servers/review') return 'Awaiting Review';
            return 'Server Details';
        }
        if (path === '/admin/users') return 'User Management';
        if (path === '/admin/servers') return 'Server Moderation';
        if (path === '/admin/bots/review') return 'Bot Verification Requests';
        if (path === '/admin/bots') return 'Bot Moderation';
        if (path === '/admin/bans') return 'Bans & Mutes';
        if (path === '/admin/logs') return 'Audit Logs';
        if (path === '/admin/reports') return 'User Reports';
        if (path === '/admin/badges') return 'Badges';
        if (path === '/admin/invites') return 'Invite Tokens';
        if (path === '/admin/settings') return 'Admin Settings';
        if (path === '/admin/overview') return 'System Overview';
        return 'Admin Panel';
    };

    return (
        <AdminLayout sidebar={<AdminSidebar />} title={getTitle()}>
            <AdminContent navigate={navigate} />
        </AdminLayout>
    );
};
