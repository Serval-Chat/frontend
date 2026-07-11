import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    Server as ServerIconLucide,
    VolumeX,
    XCircle,
} from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import type { Warning } from '@/api/warnings/warnings.types';
import type { AdminExtendedUser, AdminUserServer } from '@/types/admin';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';

export const AdminAccountStatus = ({
    adminData,
    isCurrentlyBanned,
    isCurrentlyMuted,
    muteUntilLabel,
}: {
    adminData: AdminExtendedUser;
    isCurrentlyBanned: boolean;
    isCurrentlyMuted: boolean;
    muteUntilLabel: string;
}): React.ReactNode => (
    <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
        <Heading className="mb-4" level={3} variant="admin-sub">
            Account Status
        </Heading>
        <div className="flex items-start gap-3">
            <div className="flex aspect-square w-24 flex-col justify-center rounded-lg border border-border-subtle bg-bg-secondary/50 p-3">
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
            <div className="flex aspect-square w-24 flex-col justify-center rounded-lg border border-border-subtle bg-bg-secondary/50 p-3">
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
                    className={cn(
                        'text-lg font-black',
                        isCurrentlyBanned
                            ? 'text-danger'
                            : isCurrentlyMuted
                              ? 'text-caution'
                              : 'text-success',
                    )}
                >
                    {isCurrentlyBanned
                        ? 'Banned'
                        : isCurrentlyMuted
                          ? 'Muted'
                          : 'Active'}
                </Text>
            </div>
        </div>

        {isCurrentlyBanned ? (
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
                        {new Date(adminData.banExpiry!).toLocaleString(
                            APP_LOCALE,
                        )}
                    </Text>
                </Text>
            </div>
        ) : null}

        {isCurrentlyMuted && !isCurrentlyBanned ? (
            <div className="mt-3 rounded-lg border border-caution/20 bg-caution/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-caution">
                    <VolumeX size={16} />
                    <Text
                        as="span"
                        className="tracking-tight uppercase"
                        size="xs"
                        weight="bold"
                    >
                        Muted Account
                    </Text>
                </div>
                <Text as="p" size="sm">
                    <Text as="span" variant="muted">
                        Until:
                    </Text>{' '}
                    <Text as="span" weight="black">
                        {muteUntilLabel}
                    </Text>
                </Text>
                {adminData.muteReason ? (
                    <Text className="mt-2" size="sm">
                        <Text as="span" variant="muted">
                            Reason:
                        </Text>{' '}
                        <Text as="span" weight="semibold">
                            {adminData.muteReason}
                        </Text>
                    </Text>
                ) : null}
            </div>
        ) : null}
    </div>
);

export const AdminAccountInformation = ({
    adminData,
}: {
    adminData: AdminExtendedUser;
}): React.ReactNode => (
    <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
        <Heading className="mb-4" level={3} variant="admin-sub">
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
                <Text as="span" className="font-mono" size="xs" weight="bold">
                    {adminData.id}
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
                <Text as="span" className="font-mono" size="xs" weight="bold">
                    {Object.entries(adminData.permissions)
                        .flatMap(([k, v]) => (v ? [k] : []))
                        .join(', ') || 'None'}
                </Text>
            </div>
            <div className="flex items-center gap-2 py-2">
                <Calendar className="text-muted-foreground" size={14} />
                <Text
                    as="span"
                    className="tracking-wide uppercase"
                    size="xs"
                    variant="muted"
                    weight="medium"
                >
                    Joined
                </Text>
                <Text as="span" className="ml-auto" size="xs" weight="bold">
                    {new Date(adminData.createdAt).toLocaleDateString(
                        APP_LOCALE,
                    )}
                </Text>
            </div>
        </div>
    </div>
);

export const AdminWarningHistory = ({
    warnings,
}: {
    warnings: Warning[] | undefined;
}): React.ReactNode => (
    <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
        <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="text-caution" size={16} />
            <Heading level={3} variant="admin-sub">
                Warning History ({warnings?.length || 0})
            </Heading>
        </div>

        <div className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2">
            {!warnings || warnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle py-8 text-muted-foreground">
                    <CheckCircle className="mb-2 text-success/50" size={24} />
                    <Text as="span" size="xs" weight="medium">
                        No warnings on record
                    </Text>
                </div>
            ) : (
                warnings.map((warning) => (
                    <div
                        className="group rounded-lg border border-border-subtle bg-bg-secondary/50 p-3 transition-colors hover:border-caution/30"
                        key={warning.id}
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
                                    <CheckCircle size={10} />
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
                                    ).toLocaleDateString(APP_LOCALE)}
                                </Text>
                            </div>
                            {warning.acknowledgedAt ? (
                                <>
                                    <div className="h-1 w-1 rounded-full bg-border-subtle" />
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <Clock size={10} />
                                        <Text as="span">
                                            Ack:{' '}
                                            {new Date(
                                                warning.acknowledgedAt,
                                            ).toLocaleDateString(APP_LOCALE)}
                                        </Text>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const AdminServerMemberships = ({
    servers,
}: {
    servers: AdminUserServer[];
}): React.ReactNode => (
    <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-subtle p-6">
        <div className="mb-4 flex items-center gap-2">
            <ServerIconLucide className="text-primary" size={16} />
            <Heading level={3} variant="admin-sub">
                Server Memberships ({servers.length})
            </Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(servers || []).map((server) => (
                <div
                    className="hover:border-border-hover flex items-center justify-between rounded-xl border border-border-subtle bg-bg-secondary/30 p-4 transition-all hover:bg-bg-secondary/50"
                    key={server.id}
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
                                          ).toLocaleDateString(APP_LOCALE)
                                        : 'Unknown'}
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
