import { type ReactNode, useEffect, useState } from 'react';

import { CircleHelp, Plus, Ticket, Trash2 } from 'lucide-react';

import {
    useAdminInvites,
    useCreateAdminInvite,
    useDeleteAdminInvite,
} from '@/hooks/admin/useAdminInvites';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
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

export const AdminInvites = (): ReactNode => {
    const { data: invites, isLoading, error } = useAdminInvites();
    const { mutate: createInvite, isPending: isCreating } =
        useCreateAdminInvite();
    const { mutate: deleteInvite, isPending: isDeleting } =
        useDeleteAdminInvite();
    const { showToast } = useToast();

    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (confirmingDelete) {
            const timer = setTimeout(() => {
                setConfirmingDelete(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [confirmingDelete]);

    const handleCreateInvite = (): void => {
        createInvite(undefined, {
            onSuccess: (data) => {
                showToast(`Invite created: ${data.token}`, 'success');
            },
            onError: (e) => {
                showToast(e.message || 'Failed to create invite', 'error');
            },
        });
    };

    const handleDeleteInvite = (token: string): void => {
        deleteInvite(
            { token },
            {
                onSuccess: () => {
                    showToast('Invite deleted', 'success');
                },
                onError: (e) => {
                    showToast(e.message || 'Failed to delete invite', 'error');
                },
            },
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Heading level={2} variant="admin-page">
                        Invite Tokens
                    </Heading>
                    <Text as="p" variant="muted">
                        Generate tokens used during registration.
                    </Text>
                </div>
                <Button
                    disabled={isCreating}
                    loading={isCreating}
                    variant="primary"
                    onClick={handleCreateInvite}
                >
                    <Plus size={16} /> Generate Invite
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Token</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={2}>
                                <div className="py-10 text-muted-foreground">
                                    Loading invites...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell align="center" colSpan={2}>
                                <div className="py-10 text-danger">
                                    {error.message}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : invites && invites.length > 0 ? (
                        invites.map((token) => {
                            const isConfirming = confirmingDelete === token;

                            return (
                                <TableRow key={token}>
                                    <TableCell monospace>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Ticket size={16} />
                                            </div>
                                            <span className="font-semibold tracking-wider">
                                                {token}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell align="right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                disabled={isDeleting}
                                                size="sm"
                                                title={
                                                    isConfirming
                                                        ? 'Click again to confirm'
                                                        : 'Delete invite'
                                                }
                                                variant={
                                                    isConfirming
                                                        ? 'danger'
                                                        : 'ghost'
                                                }
                                                onClick={() => {
                                                    if (isConfirming) {
                                                        handleDeleteInvite(
                                                            token,
                                                        );
                                                        setConfirmingDelete(
                                                            null,
                                                        );
                                                    } else {
                                                        setConfirmingDelete(
                                                            token,
                                                        );
                                                    }
                                                }}
                                            >
                                                {isConfirming ? (
                                                    <CircleHelp size={16} />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={2}>
                                <div className="py-12 text-center text-muted-foreground">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-muted-foreground/30">
                                            <Ticket size={24} />
                                        </div>
                                    </div>
                                    <Text
                                        as="p"
                                        className="mb-1"
                                        size="sm"
                                        weight="medium"
                                    >
                                        No active invites
                                    </Text>
                                    <Text as="p" size="xs" variant="muted">
                                        Generate a token to allow users to sign
                                        up.
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
