import { type ReactNode, useState } from 'react';

import {
    BadgeCheck,
    Eye,
    Play,
    ShieldCheck,
    ShieldOff,
    Users,
    XCircle,
} from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminAwaitingReviewServers,
    useAdminServerVerificationStats,
    useRunServerVerificationNow,
    useSetServerVerificationOverride,
} from '@/hooks/admin/useAdminServers';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/components/common/Table';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { cn } from '@/utils/cn';

export const AdminAwaitingReview = ({
    onViewServer,
}: {
    onViewServer: (serverId: string) => void;
}): ReactNode => {
    const [page, setPage] = useState(0);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;

    const { data, isLoading } = useAdminAwaitingReviewServers(page, LIMIT);
    const { data: verificationStats } = useAdminServerVerificationStats();
    const { mutate: runVerificationNow, isPending: isRunningVerification } =
        useRunServerVerificationNow();
    const { mutate: setVerificationOverride, isPending: isSettingOverride } =
        useSetServerVerificationOverride();

    const formatScore = (score?: number): string =>
        score === undefined ? '0.00' : score.toFixed(2);

    const formatDate = (value?: string | Date | null): string => {
        if (value === undefined || value === null) return 'Never';
        return new Date(value).toLocaleString();
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            <div className="flex flex-col gap-1">
                <Heading
                    className="flex items-center gap-3"
                    level={2}
                    variant="admin-page"
                >
                    <BadgeCheck className="text-warning" />
                    Eligibility Requests
                </Heading>
                <Text as="p" variant="muted">
                    Review servers that applied for verification eligibility
                    using the latest scoring run.
                </Text>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="min-w-0">
                    <Text as="p" size="sm" weight="medium">
                        Server-side scoring
                    </Text>
                    <Text as="p" className="truncate" size="xs" variant="muted">
                        Last run: {formatDate(verificationStats?.lastRunAt)}
                    </Text>
                </div>
                <Button
                    retainSize
                    disabled={isRunningVerification}
                    icon={Play}
                    loading={isRunningVerification}
                    size="sm"
                    onClick={(): void => runVerificationNow()}
                >
                    Run now
                </Button>
            </div>

            <div className="grid gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
                <div>
                    <Text
                        as="p"
                        className="text-[10px] uppercase"
                        variant="muted"
                    >
                        P80 threshold
                    </Text>
                    <span className="font-mono font-bold">
                        {formatScore(verificationStats?.p80Threshold)}
                    </span>
                </div>
                <div>
                    <Text
                        as="p"
                        className="text-[10px] uppercase"
                        variant="muted"
                    >
                        P65 threshold
                    </Text>
                    <span className="font-mono font-bold">
                        {formatScore(verificationStats?.p65Threshold)}
                    </span>
                </div>
                <div>
                    <Text
                        as="p"
                        className="text-[10px] uppercase"
                        variant="muted"
                    >
                        Eligible
                    </Text>
                    <span className="font-bold">
                        {verificationStats?.eligibleServerCount ?? 0}
                    </span>
                </div>
                <div>
                    <Text
                        as="p"
                        className="text-[10px] uppercase"
                        variant="muted"
                    >
                        Verified
                    </Text>
                    <span className="font-bold">
                        {verificationStats?.verifiedServerCount ?? 0}
                    </span>
                </div>
                <div>
                    <Text
                        as="p"
                        className="text-[10px] uppercase"
                        variant="muted"
                    >
                        Schedule
                    </Text>
                    <span className="text-xs font-medium">Daily default</span>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Server</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Eligible</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Failure reasons</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={8}>
                                <div className="py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data?.items && data.items.length > 0 ? (
                        data.items.map((server) => (
                            <TableRow key={server.id}>
                                <TableCell className="min-w-0">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <ServerIcon
                                            server={server as unknown as Server}
                                            size="sm"
                                        />
                                        <div className="flex min-w-0 flex-col truncate">
                                            <span className="truncate font-bold text-foreground">
                                                {server.name}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                                                {server.id}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell monospace>
                                    {formatScore(server.verificationScore)}
                                </TableCell>

                                <TableCell>
                                    <div
                                        className={cn(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                            server.verificationEligible
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-danger/10 text-danger',
                                        )}
                                    >
                                        {server.verificationEligible
                                            ? 'Yes'
                                            : 'No'}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                                server.verified
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-bg-tertiary text-muted-foreground',
                                            )}
                                        >
                                            {server.verified ? 'Yes' : 'No'}
                                        </div>
                                        {server.verificationOverride && (
                                            <div className="bg-warning/10 text-warning inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                                Override
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="max-w-[220px]">
                                    {server.verificationEligible ? (
                                        <Text size="xs" variant="muted">
                                            -
                                        </Text>
                                    ) : (
                                        <span className="line-clamp-2 text-xs text-muted-foreground">
                                            {server.verificationFailureReasons?.join(
                                                ', ',
                                            ) || 'Not computed'}
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="min-w-0">
                                    {server.owner ? (
                                        <div className="flex min-w-0 items-center gap-3">
                                            <UserProfilePicture
                                                size="sm"
                                                src={
                                                    server.owner.profilePicture
                                                }
                                                username={server.owner.username}
                                            />
                                            <div className="flex min-w-0 flex-col truncate">
                                                <span className="truncate text-sm font-medium">
                                                    {server.owner.displayName ||
                                                        server.owner.username}
                                                </span>
                                                <span className="truncate text-[10px] text-muted-foreground">
                                                    @{server.owner.username}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Text
                                            className="italic"
                                            color="danger"
                                            size="xs"
                                        >
                                            Unknown Owner
                                        </Text>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users
                                            className="opacity-40"
                                            size={14}
                                        />
                                        <span className="font-bold">
                                            {server.memberCount}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell align="right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            title="View Details"
                                            variant="ghost"
                                            onClick={(): void =>
                                                onViewServer(server.id)
                                            }
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            className="text-primary hover:bg-primary/10"
                                            disabled={isSettingOverride}
                                            size="sm"
                                            title="Force Verified"
                                            variant="ghost"
                                            onClick={(): void =>
                                                setVerificationOverride({
                                                    serverId: server.id,
                                                    override: 'verified',
                                                })
                                            }
                                        >
                                            <ShieldCheck size={16} />
                                        </Button>
                                        <Button
                                            className="text-danger hover:bg-danger/10"
                                            disabled={isSettingOverride}
                                            size="sm"
                                            title="Force Unverified"
                                            variant="ghost"
                                            onClick={(): void =>
                                                setVerificationOverride({
                                                    serverId: server.id,
                                                    override: 'unverified',
                                                })
                                            }
                                        >
                                            <ShieldOff size={16} />
                                        </Button>
                                        {server.verificationOverride && (
                                            <Button
                                                disabled={isSettingOverride}
                                                size="sm"
                                                title="Clear Verification Override"
                                                variant="ghost"
                                                onClick={(): void =>
                                                    setVerificationOverride({
                                                        serverId: server.id,
                                                        override: null,
                                                    })
                                                }
                                            >
                                                <XCircle size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={8}>
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <BadgeCheck
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        Queue is clear
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        No servers have applied for an
                                        eligibility check.
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {!isLoading && data && (data.items.length > 0 || page > 0) && (
                <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-subtle px-4 py-2">
                    <Button
                        disabled={page === 0}
                        variant="ghost"
                        onClick={(): void =>
                            setPage((p): number => Math.max(0, p - 1))
                        }
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Page {page + 1}
                    </span>
                    <Button
                        disabled={data.items.length < LIMIT}
                        variant="ghost"
                        onClick={(): void => setPage((p): number => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
