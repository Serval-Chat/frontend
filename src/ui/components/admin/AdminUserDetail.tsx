import { type ReactNode, useMemo, useState } from 'react';

import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Plus,
    Server as ServerIconLucide,
    Shield,
    Users,
    XCircle,
} from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import type { Badge, User } from '@/api/users/users.types';
import { useAdminUserWarnings } from '@/api/warnings/warnings.queries';
import {
    useAdminBadges,
    useAssignBadgeToUser,
    useRemoveBadgeFromUser,
} from '@/hooks/admin/useAdminBadges';
import { useAdminUserDetail } from '@/hooks/admin/useAdminUsers';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

import { AdminErrorDisplay } from './AdminErrorDisplay';
import { AdminNotesSection } from './AdminNotesSection';

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
    const { data: allBadges } = useAdminBadges();
    const { mutate: assignBadge, isPending: isAssigning } =
        useAssignBadgeToUser();
    const { mutate: removeBadge, isPending: isRemoving } =
        useRemoveBadgeFromUser();
    const { showToast } = useToast();

    const [isAddingBadge, setIsAddingBadge] = useState(false);

    const availableBadges = useMemo(() => {
        if (!allBadges || !adminData) return [];
        return allBadges.filter(
            (b) =>
                !adminData.badges.some((ub: Badge | string) => {
                    if (typeof ub === 'string') return ub === b.id;
                    return ub.id === b.id;
                }),
        );
    }, [allBadges, adminData]);

    const badgeOptions = useMemo(
        () =>
            availableBadges.map((b) => ({
                id: b.id,
                label: b.name,
                description: b.description,
                icon: <UserBadge badge={b} />,
            })),
        [availableBadges],
    );

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

    const handleAssignBadge = (badgeId: string | null): void => {
        if (!badgeId) return;
        assignBadge(
            { userId, badgeId },
            {
                onSuccess: () => {
                    showToast('Badge assigned', 'success');
                    setIsAddingBadge(false);
                },
                onError: (e) => {
                    showToast(e.message || 'Failed to assign badge', 'error');
                },
            },
        );
    };

    const handleRemoveBadge = (badgeId: string): void => {
        if (!window.confirm(`Remove badge ${badgeId} from user?`)) return;

        removeBadge(
            { userId, badgeId },
            {
                onSuccess: () => {
                    showToast('Badge removed', 'success');
                },
                onError: (e) => {
                    showToast(e.message || 'Failed to remove badge', 'error');
                },
            },
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex h-full flex-col duration-700">
            <Button className="mb-4 w-fit" variant="ghost" onClick={onBack}>
                <ArrowLeft
                    className="transition-transform group-hover:-translate-x-1"
                    size={16}
                />
                Back to User List
            </Button>

            <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
                <div className="flex flex-col overflow-hidden lg:col-span-1">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                        <Users size={12} />
                        Public Profile View
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
                        <UserProfileCard
                            presenceStatus="offline"
                            user={
                                {
                                    ...adminData,
                                    profilePicture:
                                        adminData.profilePicture || undefined,
                                    banner: adminData.banner || undefined,
                                } as unknown as User
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-danger uppercase">
                        <Shield size={12} />
                        Administrative View
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
                        {/* Summary Header */}
                        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-subtle">
                            <div className="relative h-24 w-full overflow-hidden">
                                <div
                                    className="h-full w-full bg-cover bg-center"
                                    style={{
                                        backgroundImage: adminData.banner
                                            ? `url(${resolveApiUrl(adminData.banner)})`
                                            : 'none',
                                        backgroundColor: !adminData.banner
                                            ? 'var(--color-bg-secondary)'
                                            : 'transparent',
                                    }}
                                />
                            </div>
                            <div className="px-6 pb-6">
                                <div className="relative -mt-12 mb-4">
                                    <UserProfilePicture
                                        size="xl"
                                        src={
                                            resolveApiUrl(
                                                adminData.profilePicture ||
                                                    undefined,
                                            ) || undefined
                                        }
                                        username={adminData.username}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <StyledUserName
                                        className="text-2xl"
                                        user={
                                            {
                                                ...adminData,
                                                profilePicture:
                                                    adminData.profilePicture ||
                                                    undefined,
                                                banner:
                                                    adminData.banner ||
                                                    undefined,
                                            } as unknown as User
                                        }
                                    >
                                        {adminData.displayName ||
                                            adminData.username}
                                    </StyledUserName>
                                    <Text variant="muted">
                                        @{adminData.username}
                                    </Text>
                                </div>
                            </div>
                        </div>

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

                        {/* Badges Management */}
                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <Heading level={3} variant="admin-sub">
                                    Badges Management
                                </Heading>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        setIsAddingBadge(!isAddingBadge)
                                    }
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {isAddingBadge && (
                                <div className="animate-in slide-in-from-top-2 mb-4 space-y-2 rounded-xl border border-border-subtle bg-bg-secondary/50 p-4">
                                    <DropdownWithSearch
                                        label="Select badge to assign"
                                        options={badgeOptions}
                                        placeholder={
                                            isAssigning
                                                ? 'Assigning...'
                                                : 'Choose a badge...'
                                        }
                                        searchPlaceholder="Search available badges..."
                                        value={null}
                                        onChange={handleAssignBadge}
                                    />
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsAddingBadge(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {adminData.badges &&
                                adminData.badges.length > 0 ? (
                                    (
                                        adminData.badges as unknown as Badge[]
                                    ).map((badge: Badge) => (
                                        <div
                                            className="group relative inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-secondary/50 px-3 py-2 transition-all hover:border-danger/30 hover:bg-danger/5"
                                            key={badge.id}
                                        >
                                            <UserBadge badge={badge} />
                                            <div className="flex flex-col">
                                                <Text
                                                    as="span"
                                                    size="xs"
                                                    weight="bold"
                                                >
                                                    {badge.name}
                                                </Text>
                                                <Text
                                                    as="span"
                                                    className="text-[9px]"
                                                    variant="muted"
                                                >
                                                    {badge.id}
                                                </Text>
                                            </div>
                                            <button
                                                className="absolute -top-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm transition-transform group-hover:flex hover:scale-110"
                                                disabled={isRemoving}
                                                title="Remove badge"
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveBadge(badge.id)
                                                }
                                            >
                                                <XCircle size={12} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <Text
                                        as="p"
                                        className="w-full text-center"
                                        size="xs"
                                        variant="muted"
                                    >
                                        No badges assigned
                                    </Text>
                                )}
                            </div>
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

                        {/* Admin Notes */}
                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <AdminNotesSection
                                targetId={userId}
                                targetType="User"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Server Memberships Section */}
            <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ServerIconLucide className="text-primary" size={16} />
                    <Heading level={3} variant="admin-sub">
                        Server Memberships ({adminData.servers.length})
                    </Heading>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(adminData.servers || []).map((server) => (
                        <div
                            className="hover:border-border-hover flex items-center justify-between rounded-xl border border-border-subtle bg-bg-secondary/30 p-4 transition-all hover:bg-bg-secondary/50"
                            key={server._id}
                        >
                            <div className="flex items-center gap-4">
                                <ServerIcon
                                    server={
                                        {
                                            ...server,
                                            icon: server.icon || undefined,
                                        } as unknown as Server
                                    }
                                    size="sm"
                                />
                                <div className="flex flex-col">
                                    <Text weight="bold">{server.name}</Text>
                                    <div className="flex items-center gap-2">
                                        <Text size="xs" variant="muted">
                                            {server.memberCount} members
                                        </Text>
                                        <Text className="opacity-30" size="xs">
                                            •
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            Joined{' '}
                                            {server.joinedAt
                                                ? new Date(
                                                      server.joinedAt,
                                                  ).toLocaleDateString()
                                                : 'Unknown'}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
