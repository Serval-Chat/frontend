import React, { useState } from 'react';

import { Copy, Plus, Trash2 } from 'lucide-react';

import {
    useCreateInvite,
    useDeleteInvite,
    useServerInvites,
} from '@/api/invites/invites.queries';
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
import { useToast } from '@/ui/components/common/Toast';

interface ServerInviteSettingsProps {
    serverId: string;
}

export const ServerInviteSettings: React.FC<ServerInviteSettingsProps> = ({
    serverId,
}) => {
    const { showToast } = useToast();
    const { data: invites = [], isLoading } = useServerInvites(serverId);
    const { mutate: createInvite, isPending: isCreating } =
        useCreateInvite(serverId);
    const { mutate: deleteInvite } = useDeleteInvite(serverId);

    const [customPath, setCustomPath] = useState('');
    const [maxUses, setMaxUses] = useState<number>(0);
    const [expiresIn, setExpiresIn] = useState<number>(0); // 0 = never

    const handleCreateInvite = (): void => {
        createInvite(
            {
                customPath: customPath || undefined,
                maxUses: maxUses > 0 ? maxUses : undefined,
                expiresIn: expiresIn > 0 ? expiresIn : undefined,
            },
            {
                onSuccess: () => {
                    setCustomPath('');
                    setMaxUses(0);
                    setExpiresIn(0);
                    showToast('Invite generated successfully!', 'success');
                },
                onError: () => {
                    showToast('Failed to generate invite.', 'error');
                },
            },
        );
    };

    const handleCopy = (code: string): void => {
        const url = `${window.location.origin}/invite/${code}`;
        void navigator.clipboard.writeText(url);
        showToast('Invite link copied to clipboard!', 'success');
    };

    const handleDelete = (inviteId: string): void => {
        deleteInvite(inviteId, {
            onSuccess: () => {
                showToast('Invite deleted.', 'info');
            },
            onError: () => {
                showToast('Failed to delete invite.', 'error');
            },
        });
    };

    const formatExpiry = (expiresAt?: string): string => {
        if (!expiresAt) return 'Never';
        const date = new Date(expiresAt);
        return date.toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Invites
                </Heading>
                <Text className="text-[var(--color-muted-foreground)]">
                    Create and manage invitations for your server.
                </Text>
            </div>

            {/* Create Invite Form */}
            <div className="p-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] space-y-6">
                <Heading level={3} size="sm" weight="bold">
                    Create New Invite
                </Heading>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="custom-path"
                        >
                            Custom Path (Vanity)
                        </label>
                        <Input
                            id="custom-path"
                            placeholder="e.g. awesome-server"
                            value={customPath}
                            onChange={(e) => setCustomPath(e.target.value)}
                        />
                        <Text
                            className="text-[var(--color-muted-foreground)]"
                            size="xs"
                        >
                            Optional. Leave empty for random code.
                        </Text>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="max-uses"
                        >
                            Max Uses
                        </label>
                        <Input
                            id="max-uses"
                            min={0}
                            type="number"
                            value={maxUses}
                            onChange={(e) =>
                                setMaxUses(parseInt(e.target.value) || 0)
                            }
                        />
                        <Text
                            className="text-[var(--color-muted-foreground)]"
                            size="xs"
                        >
                            0 for unlimited uses.
                        </Text>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="expires-in"
                        >
                            Expire After
                        </label>
                        <select
                            className="w-full h-10 px-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                            id="expires-in"
                            value={expiresIn}
                            onChange={(e) =>
                                setExpiresIn(parseInt(e.target.value))
                            }
                        >
                            <option value={0}>Never</option>
                            <option value={1800}>30 Minutes</option>
                            <option value={3600}>1 Hour</option>
                            <option value={21600}>6 Hours</option>
                            <option value={43200}>12 Hours</option>
                            <option value={86400}>24 Hours</option>
                            <option value={604800}>7 Days</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        disabled={isCreating}
                        loading={isCreating}
                        variant="primary"
                        onClick={handleCreateInvite}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Invite
                    </Button>
                </div>
            </div>

            {/* Invites List */}
            <div className="space-y-4">
                <Heading level={3} size="sm" weight="bold">
                    Active Invites ({invites.length})
                </Heading>

                {invites.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                        <Text className="mb-1" size="lg" weight="medium">
                            No active invites
                        </Text>
                        <Text size="sm">
                            Create an invite above to start inviting members.
                        </Text>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invite Code</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead>Expires At</TableHead>
                                <TableHead align="right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invites.map((invite) => (
                                <TableRow key={invite._id}>
                                    <TableCell monospace>
                                        {invite.customPath || invite.code}
                                    </TableCell>
                                    <TableCell>
                                        {invite.uses} /{' '}
                                        {invite.maxUses === 0
                                            ? '∞'
                                            : invite.maxUses}
                                    </TableCell>
                                    <TableCell muted>
                                        {formatExpiry(invite.expiresAt)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                title="Copy Link"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleCopy(
                                                        invite.customPath ||
                                                            invite.code,
                                                    )
                                                }
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                title="Delete"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDelete(invite._id)
                                                }
                                            >
                                                <Trash2 className="w-4 h-4 text-[var(--color-status-error)]" />
                                            </Button>
                                        </div>
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
