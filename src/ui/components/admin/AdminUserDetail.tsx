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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Button
                    className="mb-8 w-fit self-start"
                    variant="ghost"
                    onClick={onBack}
                >
                    <ArrowLeft
                        className="group-hover:-translate-x-1 transition-transform"
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
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Back Button */}
            <Button className="mb-4 w-fit" variant="ghost" onClick={onBack}>
                <ArrowLeft
                    className="group-hover:-translate-x-1 transition-transform"
                    size={16}
                />
                Back to User List
            </Button>

            {/* Split Screen Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* LEFT: Normal User Profile Card - 1 column */}
                <div className="flex flex-col overflow-hidden lg:col-span-1">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Users size={12} />
                        Public Profile View
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <UserProfileCard
                            presenceStatus="offline"
                            user={adminData as unknown as User}
                        />
                    </div>
                </div>

                {/* RIGHT: Administrative Intelligence - 2 columns */}
                <div className="flex flex-col overflow-hidden lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-danger">
                        <Shield size={12} />
                        Administrative View
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
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
                                <div className="p-3 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                                    <Text
                                        as="span"
                                        className="block text-[10px] uppercase tracking-tight mb-1"
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
                                <div className="p-3 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                                    <Text
                                        as="span"
                                        className="block text-[10px] uppercase tracking-tight mb-1"
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
                                <div className="mt-3 p-4 rounded-lg bg-danger/10 border border-danger/20">
                                    <div className="flex items-center gap-2 text-danger mb-2">
                                        <AlertTriangle size={16} />
                                        <Text
                                            as="span"
                                            className="uppercase tracking-tight"
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
                                <div className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                                    <Text
                                        as="span"
                                        className="uppercase tracking-wide"
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
                                <div className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                                    <Text
                                        as="span"
                                        className="uppercase tracking-wide"
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
                                <div className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                                    <Text
                                        as="span"
                                        className="uppercase tracking-wide"
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
                                        className="uppercase tracking-wide"
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
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle
                                    className="text-caution"
                                    size={16}
                                />
                                <Heading level={3} variant="admin-sub">
                                    Warning History ({warnings?.length || 0})
                                </Heading>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {!warnings || warnings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed border-border-subtle rounded-xl">
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
                                            className="group p-3 rounded-lg bg-bg-secondary/50 border border-border-subtle hover:border-caution/30 transition-colors"
                                            key={warning._id}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <Text
                                                    as="p"
                                                    className="text-foreground leading-relaxed line-clamp-2"
                                                    size="xs"
                                                    weight="medium"
                                                >
                                                    {warning.message}
                                                </Text>
                                                {warning.acknowledged ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-success font-bold uppercase tracking-tight whitespace-nowrap bg-success/10 px-1.5 py-0.5 rounded">
                                                        <CheckCircle
                                                            size={10}
                                                        />
                                                        Ack
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] text-caution font-bold uppercase tracking-tight whitespace-nowrap bg-caution/10 px-1.5 py-0.5 rounded">
                                                        <XCircle size={10} />
                                                        Pending
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border-subtle/50 pt-2 mt-2">
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
                                                        <div className="w-1 h-1 rounded-full bg-border-subtle" />
                                                        <div className="flex items-center gap-1.5 ml-auto">
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
            <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Server className="text-primary" size={16} />
                    <Heading level={3} variant="admin-sub">
                        Server Memberships ({adminData.servers.length})
                    </Heading>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {adminData.servers.map((server) => (
                        <div
                            className="group flex items-center gap-3 p-3 rounded-xl bg-bg-secondary/30 border border-border-subtle/50 hover:bg-bg-secondary hover:border-primary/20 transition-all"
                            key={server._id}
                        >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-secondary flex-shrink-0 ring-2 ring-border-subtle group-hover:ring-primary/30 transition-all">
                                {server.icon ? (
                                    <img
                                        alt={server.name}
                                        className="w-full h-full object-cover"
                                        src={resolveApiUrl(server.icon) || ''}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-black bg-primary/10 text-primary">
                                        {server.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
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
                                            className="px-1.5 py-0.5 text-[9px] uppercase bg-caution/10 text-caution rounded"
                                            weight="black"
                                        >
                                            Owner
                                        </Text>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
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
