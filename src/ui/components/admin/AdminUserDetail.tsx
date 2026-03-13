import { type ReactNode } from 'react';

import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Server,
    Shield,
    Users,
    XCircle,
} from 'lucide-react';

import type { User } from '@/api/users/users.types';
import { useAdminUserWarnings } from '@/api/warnings/warnings.queries';
import { useAdminUserDetail } from '@/hooks/admin/useAdminUsers';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

import { AdminErrorDisplay } from './AdminErrorDisplay';

interface AdminUserDetailProps {
    userId: string;
    onBack: () => void;
}

export const AdminUserDetail = ({
    userId,
    onBack,
}: AdminUserDetailProps): ReactNode => {
    const { data: adminData, isLoading, error } = useAdminUserDetail(userId);
    const { data: warnings } = useAdminUserWarnings(userId);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <Text as="p" size="sm" variant="muted">
                        Loading user intelligence...
                    </Text>
                </div>
            </div>
        );
    }

    if (error || !adminData) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <Button
                    className="mb-8 w-fit self-start"
                    variant="ghost"
                    onClick={onBack}
                >
                    <ArrowLeft
                        className="transition-transform group-hover:-translate-x-1"
                        size={16}
                    />
                    Back to User List
                </Button>
                <AdminErrorDisplay
                    error={error}
                    title="Intelligence Retrieval Failed"
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex h-full flex-col duration-700">
            {/* Back Button */}
            <Button className="mb-4 w-fit" variant="ghost" onClick={onBack}>
                <ArrowLeft
                    className="transition-transform group-hover:-translate-x-1"
                    size={16}
                />
                Back to User List
            </Button>

            {/* Split Screen Layout */}
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
                {/* LEFT: Normal User Profile Card - 1 column */}
                <div className="flex flex-col overflow-hidden lg:col-span-1">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                        <Users size={12} />
                        Public Profile View
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
                        <UserProfileCard
                            presenceStatus="offline"
                            user={adminData as unknown as User}
                        />
                    </div>
                </div>

                {/* RIGHT: Administrative Intelligence - 2 columns */}
                <div className="flex flex-col overflow-hidden lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-danger uppercase">
                        <Shield size={12} />
                        Administrative View
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
                        {/* Account Status */}
                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <Heading
                                className="mb-4"
                                level={3}
                                variant="admin-sub"
                            >
                                Account Status
                            </Heading>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-3">
                                    <Text
                                        as="span"
                                        className="mb-1 block text-[10px] tracking-tight uppercase"
                                        variant="muted"
                                        weight="bold"
                                    >
                                        Warnings
                                    </Text>
                                    <Text
                                        as="span"
                                        className={cn(
                                            'text-2xl',
                                            adminData.warningCount > 0
                                                ? 'text-caution'
                                                : 'text-success',
                                        )}
                                        weight="black"
                                    >
                                        {adminData.warningCount}
                                    </Text>
                                </div>
                                <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-3">
                                    <Text
                                        as="span"
                                        className="mb-1 block text-[10px] tracking-tight uppercase"
                                        variant="muted"
                                        weight="bold"
                                    >
                                        Status
                                    </Text>
                                    <Text
                                        as="span"
                                        className="text-lg text-success"
                                        weight="black"
                                    >
                                        Active
                                    </Text>
                                </div>
                            </div>

                            {adminData.banExpiry && (
                                <div className="mt-3 rounded-lg border border-danger/20 bg-danger/10 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-danger">
                                        <AlertTriangle size={16} />
                                        <Text
                                            as="span"
                                            className="tracking-tight uppercase"
                                            size="xs"
                                            weight="bold"
                                        >
                                            Banned Account
                                        </Text>
                                    </div>
                                    <Text as="p" size="sm">
                                        <Text as="span" variant="muted">
                                            Until:
                                        </Text>{' '}
                                        <Text as="span" weight="black">
                                            {new Date(
                                                adminData.banExpiry,
                                            ).toLocaleString()}
                                        </Text>
                                    </Text>
                                </div>
                            )}
                        </div>

                        {/* Account Information */}
                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <Heading
                                className="mb-4"
                                level={3}
                                variant="admin-sub"
                            >
                                Account Information
                            </Heading>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border-subtle/50 py-2">
                                    <Text
                                        as="span"
                                        className="tracking-wide uppercase"
                                        size="xs"
                                        variant="muted"
                                        weight="medium"
                                    >
                                        User ID
                                    </Text>
                                    <Text
                                        as="span"
                                        className="font-mono"
                                        size="xs"
                                        weight="bold"
                                    >
                                        {adminData._id}
                                    </Text>
                                </div>
                                <div className="flex items-center justify-between border-b border-border-subtle/50 py-2">
                                    <Text
                                        as="span"
                                        className="tracking-wide uppercase"
                                        size="xs"
                                        variant="muted"
                                        weight="medium"
                                    >
                                        Login
                                    </Text>
                                    <Text as="span" size="xs" weight="bold">
                                        {adminData.login}
                                    </Text>
                                </div>
                                <div className="flex items-center justify-between border-b border-border-subtle/50 py-2">
                                    <Text
                                        as="span"
                                        className="tracking-wide uppercase"
                                        size="xs"
                                        variant="muted"
                                        weight="medium"
                                    >
                                        Permissions
                                    </Text>
                                    <Text
                                        as="span"
                                        className="font-mono"
                                        size="xs"
                                        weight="bold"
                                    >
                                        {Object.entries(adminData.permissions)
                                            .filter(([_, v]) => v)
                                            .map(([k]) => k)
                                            .join(', ') || 'None'}
                                    </Text>
                                </div>
                                <div className="flex items-center gap-2 py-2">
                                    <Calendar
                                        className="text-muted-foreground"
                                        size={14}
                                    />
                                    <Text
                                        as="span"
                                        className="tracking-wide uppercase"
                                        size="xs"
                                        variant="muted"
                                        weight="medium"
                                    >
                                        Joined
                                    </Text>
                                    <Text
                                        as="span"
                                        className="ml-auto"
                                        size="xs"
                                        weight="bold"
                                    >
                                        {new Date(
                                            adminData.createdAt,
                                        ).toLocaleDateString()}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Recent Warnings */}
                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <AlertTriangle
                                    className="text-caution"
                                    size={16}
                                />
                                <Heading level={3} variant="admin-sub">
                                    Warning History ({warnings?.length || 0})
                                </Heading>
                            </div>

                            <div className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2">
                                {!warnings || warnings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle py-8 text-muted-foreground">
                                        <CheckCircle
                                            className="mb-2 text-success/50"
                                            size={24}
                                        />
                                        <Text
                                            as="span"
                                            size="xs"
                                            weight="medium"
                                        >
                                            No warnings on record
                                        </Text>
                                    </div>
                                ) : (
                                    warnings.map((warning) => (
                                        <div
                                            className="group rounded-lg border border-border-subtle bg-bg-secondary/50 p-3 transition-colors hover:border-caution/30"
                                            key={warning._id}
                                        >
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <Text
                                                    as="p"
                                                    className="line-clamp-2 leading-relaxed text-foreground"
                                                    size="xs"
                                                    weight="medium"
                                                >
                                                    {warning.message}
                                                </Text>
                                                {warning.acknowledged ? (
                                                    <div className="flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold tracking-tight whitespace-nowrap text-success uppercase">
                                                        <CheckCircle
                                                            size={10}
                                                        />
                                                        Ack
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 rounded bg-caution/10 px-1.5 py-0.5 text-[10px] font-bold tracking-tight whitespace-nowrap text-caution uppercase">
                                                        <XCircle size={10} />
                                                        Pending
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center gap-3 border-t border-border-subtle/50 pt-2 text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={10} />
                                                    <Text as="span">
                                                        {new Date(
                                                            warning.timestamp,
                                                        ).toLocaleDateString()}
                                                    </Text>
                                                </div>
                                                {warning.acknowledgedAt && (
                                                    <>
                                                        <div className="h-1 w-1 rounded-full bg-border-subtle" />
                                                        <div className="ml-auto flex items-center gap-1.5">
                                                            <Clock size={10} />
                                                            <Text as="span">
                                                                Ack:{' '}
                                                                {new Date(
                                                                    warning.acknowledgedAt,
                                                                ).toLocaleDateString()}
                                                            </Text>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Server Memberships Section */}
            <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Server className="text-primary" size={16} />
                    <Heading level={3} variant="admin-sub">
                        Server Memberships ({adminData.servers.length})
                    </Heading>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {adminData.servers.map((server) => (
                        <div
                            className="group flex items-center gap-3 rounded-xl border border-border-subtle/50 bg-bg-secondary/30 p-3 transition-all hover:border-primary/20 hover:bg-bg-secondary"
                            key={server._id}
                        >
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary ring-2 ring-border-subtle transition-all group-hover:ring-primary/30">
                                {server.icon ? (
                                    <img
                                        alt={server.name}
                                        className="h-full w-full object-cover"
                                        src={resolveApiUrl(server.icon) || ''}
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-black text-primary">
                                        {server.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Text
                                        as="span"
                                        className="truncate"
                                        size="sm"
                                        weight="bold"
                                    >
                                        {server.name}
                                    </Text>
                                    {server.isOwner && (
                                        <Text
                                            as="span"
                                            className="rounded bg-caution/10 px-1.5 py-0.5 text-[9px] text-caution uppercase"
                                            weight="black"
                                        >
                                            Owner
                                        </Text>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <Text
                                        as="span"
                                        className="flex items-center gap-1"
                                    >
                                        <Users size={10} />
                                        {server.memberCount} members
                                    </Text>
                                    <Text
                                        as="span"
                                        className="flex items-center gap-1"
                                    >
                                        <Clock size={10} />
                                        Joined{' '}
                                        {new Date(
                                            server.joinedAt,
                                        ).toLocaleDateString()}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
