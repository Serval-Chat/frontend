import { type ReactNode } from 'react';

import {
    MessageSquare,
    Server,
    ShieldAlert,
    UserCheck,
    Users,
} from 'lucide-react';

import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

import { AdminErrorDisplay } from './AdminErrorDisplay';
import { StatCard } from './StatCard';

export const AdminOverview = (): ReactNode => {
    const { data: stats, isLoading, error } = useAdminStats();

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <AdminErrorDisplay
                    error={error}
                    title="Statistics Unavailable"
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                <StatCard
                    icon={<Users size={20} />}
                    title="Total Users"
                    trend={stats.usersTrend}
                    value={stats.users.toLocaleString()}
                />
                <StatCard
                    icon={<UserCheck size={20} />}
                    title="Online Now"
                    trend={stats.activeUsersTrend}
                    value={stats.activeUsers.toLocaleString()}
                />
                <StatCard
                    icon={<ShieldAlert size={20} />}
                    title="Active Bans"
                    trend={stats.bansTrend}
                    value={stats.bans.toLocaleString()}
                />
                <StatCard
                    icon={<Server size={20} />}
                    title="Total Servers"
                    trend={stats.serversTrend}
                    value={stats.servers.toLocaleString()}
                />
                <StatCard
                    icon={<MessageSquare size={20} />}
                    title="Messages Sent"
                    trend={stats.messagesTrend}
                    value={stats.messages.toLocaleString()}
                />
            </div>
        </div>
    );
};
