import React from 'react';

import { ShieldAlert, Trash2 } from 'lucide-react';

import { useServerBans, useUnbanMember } from '@/api/servers/servers.queries';
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
import { useToast } from '@/ui/components/common/Toast';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

interface ServerBansSettingsProps {
    serverId: string;
}

/**
 * @description Renders the ban management section for a server.
 */
export const ServerBansSettings: React.FC<ServerBansSettingsProps> = ({
    serverId,
}) => {
    const { showToast } = useToast();
    const { data: bans = [], isLoading } = useServerBans(serverId);
    const { mutate: unbanMember, isPending: isUnbanning } =
        useUnbanMember(serverId);

    const handleUnban = (userId: string, username: string): void => {
        if (window.confirm(`Are you sure you want to unban ${username}?`)) {
            unbanMember(userId, {
                onSuccess: () => {
                    showToast(`${username} has been unbanned.`, 'success');
                },
                onError: (error) => {
                    showToast(
                        error.message || 'Failed to unban user.',
                        'error',
                    );
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-8 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Bans
                </Heading>
                <Text className="text-[var(--color-muted-foreground)]">
                    Manage users who have been banned from this server. Banned
                    users cannot join or see the server.
                </Text>
            </div>

            <div className="space-y-4">
                <Heading level={3}>Banned Users ({bans.length})</Heading>

                {bans.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-[var(--color-border-subtle)] rounded-lg opacity-50 bg-[var(--color-bg-subtle)]">
                        <ShieldAlert className="w-12 h-12 mb-3 text-[var(--color-muted-foreground)]" />
                        <Text className="mb-1" size="lg" weight="medium">
                            No active bans
                        </Text>
                        <Text size="sm">
                            Any users you ban will appear here.
                        </Text>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Banned At</TableHead>
                                <TableHead align="right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bans.map((ban) => (
                                <TableRow key={String(ban._id)}>
                                    <TableCell>
                                        <Box className="flex items-center gap-3">
                                            <UserProfilePicture
                                                size="sm"
                                                src={ban.user?.profilePicture}
                                                username={
                                                    ban.user?.displayName ||
                                                    ban.user?.username ||
                                                    'Unknown User'
                                                }
                                            />
                                            <Box className="flex flex-col min-w-0">
                                                <Text
                                                    className="truncate"
                                                    weight="bold"
                                                >
                                                    {ban.user?.displayName ||
                                                        ban.user?.username ||
                                                        'Unknown User'}
                                                </Text>
                                                <Text
                                                    className="text-[var(--color-muted-foreground)]"
                                                    size="xs"
                                                >
                                                    @
                                                    {ban.user?.username ||
                                                        'unknown'}
                                                </Text>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Text
                                            className="max-w-[300px] truncate"
                                            size="sm"
                                        >
                                            {ban.reason || 'No reason provided'}
                                        </Text>
                                    </TableCell>
                                    <TableCell muted>
                                        {new Date(
                                            ban.createdAt,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            disabled={isUnbanning}
                                            size="sm"
                                            title="Unban"
                                            variant="ghost"
                                            onClick={() =>
                                                handleUnban(
                                                    String(ban.userId),
                                                    ban.user?.username ||
                                                        'this user',
                                                )
                                            }
                                        >
                                            <Trash2 className="w-4 h-4 text-[var(--color-status-error)]" />
                                            <span className="ml-2 text-[var(--color-status-error)]">
                                                Unban
                                            </span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};
