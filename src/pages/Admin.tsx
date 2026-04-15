import { type ReactNode } from 'react';

import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

import { AdminAuditLogs } from '@/ui/components/admin/AdminAuditLogs';
import { AdminAwaitingReview } from '@/ui/components/admin/AdminAwaitingReview';
import { AdminBadges } from '@/ui/components/admin/AdminBadges';
import { AdminIAM } from '@/ui/components/admin/AdminIAM';
import { AdminInvites } from '@/ui/components/admin/AdminInvites';
import { AdminLayout } from '@/ui/components/admin/AdminLayout';
import { AdminOverview } from '@/ui/components/admin/AdminOverview';
import { AdminServerDetail } from '@/ui/components/admin/AdminServerDetail';
import { AdminServers } from '@/ui/components/admin/AdminServers';
import { AdminSettings } from '@/ui/components/admin/AdminSettings';
import { AdminSidebar } from '@/ui/components/admin/AdminSidebar';
import { AdminUserDetail } from '@/ui/components/admin/AdminUserDetail';
import { Text } from '@/ui/components/common/Text';

const AdminUserDetailWrapper = (): ReactNode => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    if (!userId) return <Navigate replace to="/admin/users" />;
    return (
        <AdminUserDetail
            userId={userId}
            onBack={() => void navigate('/admin/users')}
        />
    );
};

const AdminServerDetailWrapper = (): ReactNode => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    if (!serverId) return <Navigate replace to="/admin/servers" />;
    return (
        <AdminServerDetail
            serverId={serverId}
            onBack={() => void navigate('/admin/servers')}
            onViewUser={(uid) => void navigate(`/admin/users/${uid}`)}
        />
    );
};

export const Admin = (): ReactNode => {
    const location = useLocation();
    const navigate = useNavigate();

    const renderContent = (): ReactNode => (
        <Routes>
            <Route element={<Navigate replace to="overview" />} path="/" />
            <Route element={<AdminOverview />} path="overview" />

            <Route
                element={
                    <AdminIAM
                        onViewUser={(id) => void navigate(`/admin/users/${id}`)}
                    />
                }
                path="users"
            />
            <Route element={<AdminUserDetailWrapper />} path="users/:userId" />

            <Route
                element={
                    <AdminServers
                        onViewServer={(id) =>
                            void navigate(`/admin/servers/${id}`)
                        }
                    />
                }
                path="servers"
            />
            <Route
                element={
                    <AdminAwaitingReview
                        onViewServer={(id) =>
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

            <Route element={<AdminAuditLogs />} path="logs" />
            <Route element={<AdminBadges />} path="badges" />
            <Route element={<AdminInvites />} path="invites" />
            <Route element={<AdminSettings />} path="settings" />

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

    const getTitle = (): string => {
        const path = location.pathname;
        if (path.startsWith('/admin/users/')) return 'User Details';
        if (path.startsWith('/admin/servers/')) {
            if (path === '/admin/servers/review') return 'Awaiting Review';
            return 'Server Details';
        }
        if (path === '/admin/users') return 'User Management';
        if (path === '/admin/servers') return 'Server Moderation';
        if (path === '/admin/bans') return 'Bans & Mutes';
        if (path === '/admin/logs') return 'Audit Logs';
        if (path === '/admin/badges') return 'Badges';
        if (path === '/admin/invites') return 'Invite Tokens';
        if (path === '/admin/settings') return 'Admin Settings';
        if (path === '/admin/overview') return 'System Overview';
        return 'Admin Panel';
    };

    return (
        <AdminLayout sidebar={<AdminSidebar />} title={getTitle()}>
            {renderContent()}
        </AdminLayout>
    );
};
