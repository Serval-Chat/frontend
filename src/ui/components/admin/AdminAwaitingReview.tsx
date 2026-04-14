import { type ReactNode, useState } from 'react';

import { BadgeCheck, Eye, MessageSquare, Users, XCircle } from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminAwaitingReviewServers,
    useDeclineVerification,
    useVerifyServer,
} from '@/hooks/admin/useAdminServers';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LatexRenderer } from '@/ui/components/common/LatexRenderer';
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

export const AdminAwaitingReview = ({
    onViewServer,
}: {
    onViewServer: (serverId: string) => void;
}): ReactNode => {
    const [page, setPage] = useState(0);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;

    const { data, isLoading } = useAdminAwaitingReviewServers(page, LIMIT);
    const { mutate: verifyServer, isPending: isVerifying } = useVerifyServer();
    const { mutate: declineVerification, isPending: isDeclining } =
        useDeclineVerification();

    const handleDecline = (serverId: string, serverName: string): void => {
        if (
            confirm(
                `Are you sure you want to decline the verification request for "${serverName}"?`,
            )
        ) {
            declineVerification(serverId);
        }
    };

    const handleVerify = (serverId: string): void => {
        verifyServer(serverId);
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
                    Awaiting Review
                </Heading>
                <Text as="p" variant="muted">
                    Review and weigh server verification requests based on
                    organic community activity.
                </Text>
            </div>

            <div className="border-warning/20 bg-warning/5 text-warning/80 rounded-lg border p-3 text-xs">
                <strong>Weighting Logic:</strong> Servers are ranked by{' '}
                <LatexRenderer content="(\text{Members} \times 10) + \text{Real Messages}" />
                . High-weight communities appear first.
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Server</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Metrics (Score)</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data?.items && data.items.length > 0 ? (
                        data.items.map((server) => (
                            <TableRow key={server._id}>
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
                                                {server._id}
                                            </span>
                                        </div>
                                    </div>
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
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Users size={12} />
                                                <span className="font-mono font-bold text-foreground">
                                                    {server.memberCount}
                                                </span>{' '}
                                                members
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MessageSquare size={12} />
                                                <span className="font-mono font-bold text-foreground">
                                                    {server.realMessageCount}
                                                </span>{' '}
                                                msgs
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border-subtle">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{
                                                        width: `${Math.min(100, (server.weightScore || 0) / 10)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="font-mono text-[10px] font-bold text-primary">
                                                {server.weightScore} pts
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell align="right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            title="View Details"
                                            variant="ghost"
                                            onClick={() =>
                                                onViewServer(server._id)
                                            }
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            className="text-primary hover:bg-primary/10"
                                            disabled={isVerifying}
                                            size="sm"
                                            title="Verify Server"
                                            variant="ghost"
                                            onClick={() =>
                                                handleVerify(server._id)
                                            }
                                        >
                                            <BadgeCheck
                                                size={18}
                                                strokeWidth={2.5}
                                            />
                                        </Button>
                                        <Button
                                            className="text-danger hover:bg-danger/10"
                                            disabled={isDeclining}
                                            size="sm"
                                            title="Decline Request"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDecline(
                                                    server._id,
                                                    server.name,
                                                )
                                            }
                                        >
                                            <XCircle size={18} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <BadgeCheck
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        Queue is clear!
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        No new verification requests at this
                                        time.
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
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Page {page + 1}
                    </span>
                    <Button
                        disabled={data.items.length < LIMIT}
                        variant="ghost"
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
