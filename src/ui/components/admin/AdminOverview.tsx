import { type ReactNode, useState } from 'react';

import {
    MessageSquare,
    Server,
    ShieldAlert,
    UserCheck,
    Users,
} from 'lucide-react';

import { type StatsRange, useAdminStats } from '@/hooks/admin/useAdminStats';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';
import { cn } from '@/utils/cn';

import { AdminErrorDisplay } from './AdminErrorDisplay';
import { StatCard } from './StatCard';
import { StatChart } from './StatChart';

const RANGES: { label: string; value: StatsRange }[] = [
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: 'Lifetime', value: 'all' },
];

export const AdminOverview = (): ReactNode => {
    const [range, setRange] = useState<StatsRange>('24h');
    const { data: stats, isLoading, error } = useAdminStats(range);

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
            {/* Stat number cards */}
            <Box className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                <StatCard
                    icon={<Users size={20} />}
                    title="Total Users"
                    value={stats.users.toLocaleString()}
                />
                <StatCard
                    icon={<UserCheck size={20} />}
                    title="Online Now"
                    value={stats.activeUsers.toLocaleString()}
                />
                <StatCard
                    icon={<ShieldAlert size={20} />}
                    title="Active Bans"
                    value={stats.bans.toLocaleString()}
                />
                <StatCard
                    icon={<Server size={20} />}
                    title="Total Servers"
                    value={stats.servers.toLocaleString()}
                />
                <StatCard
                    icon={<MessageSquare size={20} />}
                    title="Messages Sent"
                    value={stats.messages.toLocaleString()}
                />
            </Box>

            {/* Timeline controls + charts */}
            <Stack gap="md">
                {/* Range selector */}
                <Box className="flex items-center justify-between">
                    <Text size="sm" variant="muted" weight="medium">
                        Activity
                    </Text>
                    <Box className="flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-subtle p-1">
                        {RANGES.map(({ label, value }) => (
                            <button
                                className={cn(
                                    'rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200',
                                    range === value
                                        ? 'bg-primary text-foreground-inverse shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                key={value}
                                type="button"
                                onClick={() => setRange(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </Box>
                </Box>

                {/* Chart grid */}
                <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <StatChart
                        data={stats.usersSparkline}
                        range={range}
                        title="New Users"
                    />
                    <StatChart
                        data={stats.bansSparkline}
                        range={range}
                        title="New Bans"
                    />
                    <StatChart
                        data={stats.serversSparkline}
                        range={range}
                        title="New Servers"
                    />
                    <StatChart
                        data={stats.messagesSparkline}
                        range={range}
                        title="Messages Sent"
                    />
                </Box>
            </Stack>
        </Stack>
    );
};
