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
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';

import { AdminErrorDisplay } from './AdminErrorDisplay';
import { StatCard } from './StatCard';

export const AdminOverview = (): ReactNode => {
    const { data: stats, isLoading, error } = useAdminStats();

    if (isLoading) {
        return (
            <Box className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
            </Box>
        );
    }

    if (error || !stats) {
        return (
            <Box className="flex min-h-[400px] items-center justify-center">
                <AdminErrorDisplay
                    error={error}
                    title="Statistics Unavailable"
                />
            </Box>
        );
    }

    return (
        <Stack
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            gap="xl"
        >
            <Box className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
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
            </Box>
        </Stack>
    );
};
