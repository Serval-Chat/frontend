import { type ReactNode, useMemo } from 'react';

import {
    ArrowLeft,
    BadgeCheck,
    Ban,
    Clock,
    Eye,
    Info,
    Link2,
    MessageSquare,
    RefreshCw,
    ShieldCheck,
    Trash2,
    UserMinus,
    Users,
} from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import {
    useAdminServerDetail,
    useAdminServerInvites,
    useDeleteAdminServerInvite,
    useDeleteServer,
    useRestoreServer,
    useUnverifyServer,
    useVerifyServer,
} from '@/hooks/admin/useAdminServers';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';
import { resolveApiUrl } from '@/utils/apiUrl';

import { AdminErrorDisplay } from './AdminErrorDisplay';
import { AdminNotesSection } from './AdminNotesSection';
import { AdminServerPreview } from './AdminServerPreview';
import { StatCard } from './StatCard';

interface AdminServerDetailProps {
    serverId: string;
    onBack: () => void;
    onViewUser: (userId: string) => void;
}

export const AdminServerDetail = ({
    serverId,
    onBack,
    onViewUser,
}: AdminServerDetailProps): ReactNode => {
    const { data: server, isLoading, error } = useAdminServerDetail(serverId);
    const { mutate: deleteServer, isPending: isDeleting } = useDeleteServer();
    const { mutate: restoreServer, isPending: isRestoring } =
        useRestoreServer();
    const { mutate: verifyServer, isPending: isVerifying } = useVerifyServer();
    const { mutate: unverifyServer, isPending: isUnverifying } =
        useUnverifyServer();
    const { showToast } = useToast();

    const { data: invites, isLoading: isLoadingInvites } =
        useAdminServerInvites(serverId);
    const { mutate: deleteInvite, isPending: isDeletingInvite } =
        useDeleteAdminServerInvite(serverId);

    const serverAge = useMemo(() => {
        if (!server) return '';
        const created = new Date(server.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
    }, [server]);

    if (isLoading) {
        return (
            <Box className="flex h-[60vh] items-center justify-center">
                <Stack className="items-center" gap="md">
                    <LoadingSpinner size="lg" />
                    <Text variant="muted">Loading server details...</Text>
                </Stack>
            </Box>
        );
    }

    if (error || !server) {
        return (
            <Box className="flex min-h-[400px] flex-col items-center justify-center">
                <Button
                    className="mb-8 w-fit self-start"
                    variant="ghost"
                    onClick={onBack}
                >
                    <ArrowLeft className="mr-2" size={16} />
                    Back to Server Moderation
                </Button>
                <AdminErrorDisplay
                    error={error}
                    title="Failed to Load Server Details"
                />
            </Box>
        );
    }

    const handleDelete = (): void => {
        if (
            !window.confirm(`Are you sure you want to delete "${server.name}"?`)
        )
            return;
        deleteServer(serverId, {
            onSuccess: () =>
                showToast('Server soft-deleted successfully', 'success'),
            onError: (err) =>
                showToast(err.message || 'Failed to delete server', 'error'),
        });
    };

    const handleRestore = (): void => {
        restoreServer(serverId, {
            onSuccess: () =>
                showToast('Server restored successfully', 'success'),
            onError: (err) =>
                showToast(err.message || 'Failed to restore server', 'error'),
        });
    };

    const handleRevokeInvite = (inviteId: string): void => {
        if (!window.confirm('Are you sure you want to revoke this invite?'))
            return;
        deleteInvite(inviteId, {
            onSuccess: () =>
                showToast('Invite revoked successfully', 'success'),
            onError: (err) =>
                showToast(err.message || 'Failed to revoke invite', 'error'),
        });
    };

    const handleToggleVerification = (): void => {
        if (server.verified) {
            if (
                !window.confirm(
                    'Are you sure you want to remove the verification badge?',
                )
            )
                return;
            unverifyServer(serverId, {
                onSuccess: () =>
                    showToast('Verification badge removed', 'success'),
                onError: (err) =>
                    showToast(err.message || 'Failed to remove badge', 'error'),
            });
        } else {
            if (!server.verificationRequested) {
                if (
                    !window.confirm(
                        'This server has NOT requested verification. Are you sure you want to force-verify it?',
                    )
                )
                    return;
            }
            verifyServer(serverId, {
                onSuccess: () =>
                    showToast('Server verified successfully', 'success'),
                onError: (err) =>
                    showToast(
                        err.message || 'Failed to verify server',
                        'error',
                    ),
            });
        }
    };

    return (
        <Stack
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            gap="md"
        >
            {/* Header & Controls */}
            <Box className="flex items-center justify-between pb-2">
                <Button
                    className="h-8 text-xs"
                    variant="ghost"
                    onClick={onBack}
                >
                    <ArrowLeft className="mr-2" size={14} />
                    Back to Servers
                </Button>
            </Box>

            {/* Split Screen Layout */}
            <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col lg:col-span-1">
                    <AdminServerPreview server={server as unknown as Server} />
                </div>

                <div className="flex flex-col gap-4 lg:col-span-2">
                    {/* Quick Stats Grid */}
                    <Box className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard
                            icon={<Users size={16} />}
                            title="Total Members"
                            value={server.memberCount}
                        />
                        <StatCard
                            icon={<MessageSquare size={16} />}
                            title="Message Volume"
                            value={server.messageVolume}
                        />
                        <StatCard
                            icon={<Clock size={16} />}
                            title="Server Age"
                            value={serverAge}
                        />
                    </Box>

                    {/* Moderation Metrics Grid */}
                    <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <StatCard
                            icon={<Ban size={16} />}
                            title="Bans (Last 24h)"
                            value={server.recentBanCount}
                        />
                        <StatCard
                            icon={<UserMinus size={16} />}
                            title="Kicks (Last 24h)"
                            value={server.recentKickCount}
                        />
                    </Box>

                    {/* Owner Card */}
                    {server.owner && (
                        <Box className="rounded-xl border border-border-subtle bg-bg-subtle p-4">
                            <Heading
                                className="mb-3"
                                level={4}
                                variant="admin-sub"
                            >
                                Ownership
                            </Heading>
                            <Box className="flex items-center justify-between gap-4">
                                <Box className="flex items-center gap-3 text-left">
                                    <UserProfilePicture
                                        size="md"
                                        src={
                                            resolveApiUrl(
                                                server.owner.profilePicture ||
                                                    undefined,
                                            ) || undefined
                                        }
                                        username={server.owner.username}
                                    />
                                    <Stack gap="none">
                                        <Text size="sm" weight="black">
                                            {server.owner.displayName ||
                                                server.owner.username}
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            @{server.owner.username}
                                        </Text>
                                    </Stack>
                                </Box>
                                <Button
                                    className="gap-2 rounded-lg text-xs"
                                    variant="normal"
                                    onClick={() =>
                                        onViewUser(server.owner!._id)
                                    }
                                >
                                    <Eye size={14} />
                                    View Details
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Server Actions */}
                    <Box className="rounded-xl border border-border-subtle bg-bg-subtle p-4">
                        <Stack
                            className="mb-3 items-center gap-2"
                            direction="row"
                        >
                            <Info className="text-primary" size={14} />
                            <Heading level={4} variant="admin-sub">
                                Moderation Controls
                            </Heading>
                        </Stack>
                        <Box className="flex flex-col gap-2 pt-2">
                            {/* Verification Toggle */}
                            <Button
                                className={
                                    server.verified
                                        ? 'hover:bg-info/10 hover:text-info w-full gap-2 rounded-lg text-xs'
                                        : 'w-full gap-2 rounded-lg text-xs hover:bg-primary/10 hover:text-primary'
                                }
                                loading={isVerifying || isUnverifying}
                                variant="ghost"
                                onClick={handleToggleVerification}
                            >
                                {server.verified ? (
                                    <>
                                        <ShieldCheck
                                            className="text-info"
                                            size={14}
                                        />
                                        Remove Verified Badge
                                    </>
                                ) : (
                                    <>
                                        <BadgeCheck
                                            className={
                                                server.verificationRequested
                                                    ? 'text-warning'
                                                    : 'text-primary'
                                            }
                                            size={14}
                                        />
                                        {server.verificationRequested
                                            ? 'Approve Verification Request'
                                            : 'Grant Verified Badge'}
                                    </>
                                )}
                            </Button>

                            {/* Delete/Restore Toggle */}
                            {server.deletedAt ? (
                                <Button
                                    className="w-full gap-2 rounded-lg text-xs"
                                    loading={isRestoring}
                                    variant="primary"
                                    onClick={handleRestore}
                                >
                                    <RefreshCw size={14} />
                                    Restore Server
                                </Button>
                            ) : (
                                <Button
                                    className="w-full gap-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/10 hover:text-danger"
                                    loading={isDeleting}
                                    variant="ghost"
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={16} />
                                    Soft Delete Server
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Server Invites */}
                    <Box className="rounded-xl border border-border-subtle bg-bg-subtle p-4">
                        <Stack
                            className="mb-3 items-center gap-2"
                            direction="row"
                        >
                            <Link2 className="text-primary" size={14} />
                            <Heading level={4} variant="admin-sub">
                                Active Invites ({invites?.length || 0})
                            </Heading>
                        </Stack>
                        <Box className="pt-2">
                            {isLoadingInvites ? (
                                <Text className="text-xs" variant="muted">
                                    Loading invites...
                                </Text>
                            ) : invites && invites.length > 0 ? (
                                <div className="custom-scrollbar max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                                    {invites.map((invite) => (
                                        <div
                                            className="flex items-center justify-between rounded-lg border border-border-subtle/50 bg-bg-secondary/30 p-2"
                                            key={invite._id}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs leading-tight font-bold">
                                                    {invite.customPath ||
                                                        invite.code}
                                                </span>
                                                <span className="text-[9px] font-medium text-muted-foreground uppercase">
                                                    {invite.uses} /{' '}
                                                    {invite.maxUses || '∞'} Uses
                                                    • Exp:{' '}
                                                    {invite.expiresAt
                                                        ? new Date(
                                                              invite.expiresAt,
                                                          ).toLocaleDateString()
                                                        : 'Never'}
                                                </span>
                                            </div>
                                            <Button
                                                className="h-6 w-6 p-0 text-danger hover:bg-danger/10"
                                                disabled={isDeletingInvite}
                                                variant="ghost"
                                                onClick={() =>
                                                    handleRevokeInvite(
                                                        invite._id,
                                                    )
                                                }
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Text className="text-xs" variant="muted">
                                    No active invites found.
                                </Text>
                            )}
                        </Box>
                    </Box>

                    {/* Admin Notes */}
                    <Box className="rounded-xl border border-border-subtle bg-bg-subtle p-6">
                        <AdminNotesSection
                            targetId={serverId}
                            targetType="Server"
                        />
                    </Box>
                </div>
            </div>
        </Stack>
    );
};
