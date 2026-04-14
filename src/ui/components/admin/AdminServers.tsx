import { type ReactNode, useEffect, useState } from 'react';

import {
    BadgeCheck,
    Eye,
    RotateCcw,
    Search,
    Server as ServerIconLucide,
    Trash2,
    Users,
} from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminServers,
    useDeleteServer,
    useRestoreServer,
} from '@/hooks/admin/useAdminServers';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
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

export const AdminServers = ({
    onViewServer,
}: {
    onViewServer: (serverId: string) => void;
}): ReactNode => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, ADMIN_CONSTANTS.SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: servers, isLoading } = useAdminServers(
        debouncedSearch,
        page,
        LIMIT,
    );
    const { mutate: deleteServer, isPending: isDeleting } = useDeleteServer();
    const { mutate: restoreServer, isPending: isRestoring } =
        useRestoreServer();

    const handleDelete = (serverId: string, serverName: string): void => {
        if (
            confirm(
                `Are you sure you want to delete the server "${serverName}"?`,
            )
        ) {
            deleteServer(serverId);
        }
    };

    const handleRestore = (serverId: string): void => {
        restoreServer(serverId);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <Heading
                    className="flex items-center gap-3"
                    level={2}
                    variant="admin-page"
                >
                    <ServerIconLucide className="text-primary" />
                    Server Moderation
                </Heading>
                <Text as="p" variant="muted">
                    Monitor and manage all servers across the platform.
                </Text>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="relative flex-1">
                    <Search
                        className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                        size={16}
                    />
                    <Input
                        className="pl-10"
                        placeholder="Search servers by name..."
                        size="admin"
                        type="text"
                        value={searchTerm}
                        variant="admin"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Servers List */}
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Server</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : servers && servers.length > 0 ? (
                        servers.map((server) => (
                            <TableRow key={server._id}>
                                <TableCell className="min-w-0">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <ServerIcon
                                            server={server as unknown as Server}
                                            size="sm"
                                        />
                                        <div className="flex max-w-[150px] min-w-0 flex-col truncate md:max-w-[250px]">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                {server.verified && (
                                                    <BadgeCheck
                                                        className="shrink-0 text-primary"
                                                        size={16}
                                                        strokeWidth={2.5}
                                                    />
                                                )}
                                                <span className="truncate font-bold text-foreground">
                                                    {server.name}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                                                {server._id}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                                server.deletedAt
                                                    ? 'bg-danger/10 text-danger'
                                                    : 'bg-primary/10 text-primary',
                                            )}
                                        >
                                            {server.deletedAt
                                                ? 'Deleted'
                                                : 'Active'}
                                        </div>
                                        {server.verificationRequested &&
                                            !server.verified && (
                                                <div className="bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                                    Review
                                                </div>
                                            )}
                                    </div>
                                </TableCell>

                                <TableCell className="min-w-0">
                                    {server.owner ? (
                                        <div className="flex min-w-0 items-center gap-3 space-x-0">
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

                                <TableCell align="right" className="shrink-0">
                                    <div className="flex shrink-0 justify-end gap-1">
                                        <Button
                                            size="sm"
                                            title="View Server Details"
                                            variant="ghost"
                                            onClick={() =>
                                                onViewServer(server._id)
                                            }
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        {server.deletedAt ? (
                                            <Button
                                                className="text-primary hover:bg-primary/10"
                                                disabled={isRestoring}
                                                size="sm"
                                                title="Restore Server"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleRestore(server._id)
                                                }
                                            >
                                                <RotateCcw size={16} />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="text-danger hover:bg-danger/10"
                                                disabled={isDeleting}
                                                size="sm"
                                                title="Delete Server"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDelete(
                                                        server._id,
                                                        server.name,
                                                    )
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <ServerIconLucide
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        No servers found
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        Try searching for a different server
                                        name
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {!isLoading && servers && (servers.length > 0 || page > 0) && (
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
                        disabled={servers.length < LIMIT}
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
