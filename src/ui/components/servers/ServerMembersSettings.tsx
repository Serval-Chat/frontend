import { useMemo, useRef, useState } from 'react';

import { Search, Users } from 'lucide-react';

import { useServerMembersAdmin } from '@/api/serverMembersAdmin/serverMembersAdmin.queries';
import { useRoles } from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Popover } from '@/ui/components/common/Popover';
import { RoleDot } from '@/ui/components/common/RoleDot';
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
import { Box } from '@/ui/components/layout/Box';
import { colors } from '@/ui/theme';
import { resolveDisplayName } from '@/utils/displayName';
import { APP_LOCALE } from '@/utils/locale';

const LIMIT = 25;
const MAX_VISIBLE_ROLES = 3;

interface ServerMembersSettingsProps {
    serverId: string;
}

const JoinedViaCell = ({
    joinedVia,
}: {
    joinedVia?: { method: 'invite' | 'vanity'; code: string };
}) => {
    if (!joinedVia) {
        return (
            <Text size="sm" variant="muted">
                Unknown
            </Text>
        );
    }
    return (
        <Text className="block truncate" size="sm">
            {joinedVia.method === 'vanity' ? 'Vanity' : 'Invite'}:{' '}
            <span className="font-mono">{joinedVia.code}</span>
        </Text>
    );
};

const MemberRolesCell = ({ roles }: { roles: Role[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const visibleRoles = roles.slice(0, MAX_VISIBLE_ROLES);
    const hiddenCount = roles.length - visibleRoles.length;

    return (
        <div className="flex items-center gap-2 overflow-hidden">
            {visibleRoles.map((role) => (
                <div className="flex shrink-0 items-center gap-1.5" key={role.id}>
                    <RoleDot role={role} />
                    <Text className="truncate" size="xs">
                        {role.name}
                    </Text>
                </div>
            ))}
            {hiddenCount > 0 ? (
                <>
                    <button
                        className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        ref={triggerRef}
                        type="button"
                        onClick={(): void => {
                            setIsOpen((prev) => !prev);
                        }}
                    >
                        +{hiddenCount}
                    </button>
                    <Popover
                        className="max-h-64 w-56 overflow-y-auto p-1"
                        isOpen={isOpen}
                        triggerRef={triggerRef}
                        onClose={(): void => {
                            setIsOpen(false);
                        }}
                    >
                        <div className="flex flex-col gap-0.5">
                            {roles.map((role) => (
                                <div
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                                    key={role.id}
                                >
                                    <RoleDot role={role} />
                                    <Text className="truncate" size="xs">
                                        {role.name}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </Popover>
                </>
            ) : null}
        </div>
    );
};

export const ServerMembersSettings = ({
    serverId,
}: ServerMembersSettingsProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [roleId, setRoleId] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(0);

    const { data: roles = [] } = useRoles(serverId);
    const roleById = useMemo((): Map<string, Role> => {
        const map = new Map<string, Role>();
        for (const role of roles) map.set(role.id, role);
        return map;
    }, [roles]);

    const roleOptions = useMemo(
        () =>
            roles
                .filter((r): boolean => r.name !== '@everyone')
                .map((r) => ({
                    id: r.id,
                    label: r.name,
                    icon: <RoleDot role={r} />,
                })),
        [roles],
    );

    const { data, isLoading, isFetching, isError } = useServerMembersAdmin(
        serverId,
        {
            search: debouncedSearch || undefined,
            roleId: roleId ?? undefined,
            sortBy: 'joinedAt',
            sortDir,
        },
        { limit: LIMIT, offset: page * LIMIT },
    );

    const members = data?.members ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-3">
                <Users className="h-6 w-6 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Heading className="mb-1" level={2} variant="section">
                        Members
                    </Heading>
                    <Text variant="muted">
                        View and search everyone in this server, including
                        their roles, join date, and how they joined.
                    </Text>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input
                        icon={<Search size={16} />}
                        placeholder="Search by username or display name..."
                        value={searchTerm}
                        onChange={(e): void => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                    />
                </div>
                <div className="sm:w-56">
                    <DropdownWithSearch
                        allowClear
                        options={roleOptions}
                        placeholder="All roles"
                        searchPlaceholder="Search roles..."
                        value={roleId}
                        onChange={(value): void => {
                            setRoleId(value);
                            setPage(0);
                        }}
                    />
                </div>
                <Button
                    className="h-10"
                    retainSize
                    style={{
                        backgroundColor: colors.bgSubtle,
                        borderColor: colors.borderSubtle,
                    }}
                    variant="normal"
                    onClick={(): void => {
                        setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                        setPage(0);
                    }}
                >
                    Joined {sortDir === 'desc' ? 'Newest' : 'Oldest'}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner />
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-danger/30 bg-danger/5 py-12 text-center">
                    <Text className="mb-1" size="lg" weight="medium">
                        Failed to load members
                    </Text>
                    <Text size="sm" variant="muted">
                        You may not have permission to view this page, or
                        something went wrong.
                    </Text>
                </div>
            ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-subtle py-12 text-center opacity-50">
                    <Users className="mb-3 h-12 w-12 text-muted-foreground" />
                    <Text className="mb-1" size="lg" weight="medium">
                        No members found
                    </Text>
                    <Text size="sm">
                        Try adjusting your search or role filter.
                    </Text>
                </div>
            ) : (
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[35%]">User</TableHead>
                            <TableHead className="w-[30%]">Roles</TableHead>
                            <TableHead className="w-[15%]">Joined</TableHead>
                            <TableHead className="w-[20%]">
                                Joined Via
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => {
                            const resolvedName =
                                resolveDisplayName(
                                    member.nickname,
                                    member.user?.displayName,
                                    member.user?.username,
                                ) ?? 'Unknown User';

                            return (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <Box className="flex items-center gap-3">
                                            <UserProfilePicture
                                                size="sm"
                                                src={
                                                    member.user?.profilePicture
                                                }
                                                username={resolvedName}
                                            />
                                            <Box className="flex min-w-0 flex-col">
                                                <Text
                                                    className="truncate"
                                                    weight="bold"
                                                >
                                                    {resolvedName}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    variant="muted"
                                                >
                                                    @
                                                    {member.user?.username ||
                                                        'unknown'}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <MemberRolesCell
                                            roles={member.roles
                                                .map((id) => roleById.get(id))
                                                .filter(
                                                    (r): r is Role =>
                                                        !!r &&
                                                        r.name !== '@everyone',
                                                )}
                                        />
                                    </TableCell>
                                    <TableCell muted>
                                        {new Date(
                                            member.joinedAt,
                                        ).toLocaleDateString(APP_LOCALE)}
                                    </TableCell>
                                    <TableCell>
                                        <JoinedViaCell
                                            joinedVia={member.joinedVia}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {!isLoading && total > 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-subtle px-4 py-2">
                    <Button
                        disabled={page === 0 || isFetching}
                        variant="ghost"
                        onClick={(): void => {
                            setPage((p): number => Math.max(0, p - 1));
                        }}
                    >
                        Previous
                    </Button>
                    <Text size="sm" variant="muted">
                        Page {page + 1} of {totalPages} &middot; {total}{' '}
                        members
                    </Text>
                    <Button
                        disabled={page + 1 >= totalPages || isFetching}
                        variant="ghost"
                        onClick={(): void => {
                            setPage((p): number => p + 1);
                        }}
                    >
                        Next
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
