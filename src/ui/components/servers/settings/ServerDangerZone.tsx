import React, { useState } from 'react';

import { BadgeCheck, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useDeleteServer,
    useMembers,
    useRequestServerVerification,
    useTransferOwnership,
} from '@/api/servers/servers.queries';
import type { Server, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ServerDangerZoneProps {
    server: Server;
    serverId: string;
}

export const ServerDangerZone = ({
    server,
    serverId,
}: ServerDangerZoneProps): React.ReactNode => {
    const navigate = useNavigate();
    const { data: me } = useMe();
    const { data: members } = useMembers(serverId);
    const { mutate: deleteServer, isPending: isDeleting } = useDeleteServer();
    const { mutate: transferOwnership, isPending: isTransferring } =
        useTransferOwnership(serverId);
    const { mutate: requestVerification, isPending: isRequestingVerification } =
        useRequestServerVerification(serverId);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState('');

    const transferableMembers = React.useMemo(
        (): ServerMember[] =>
            members?.reduce<ServerMember[]>((acc, m): ServerMember[] => {
                if (m.userId !== me?.id) acc.push(m);
                return acc;
            }, []) ?? [],
        [members, me?.id],
    );

    const handleDeleteServer = (): void => {
        if (confirmDeleteName !== server.name) return;
        deleteServer(serverId, {
            onSuccess: (): void => {
                void navigate('/chat/@me');
            },
        });
    };

    const handleTransferOwnership = (newOwnerId: string): void => {
        transferOwnership(newOwnerId, {
            onSuccess: (): void => {
                setIsTransferModalOpen(false);
            },
        });
    };

    return (
        <>
            <div className="space-y-6 pt-10">
                <div className="border-b border-border-subtle pb-4">
                    <Heading
                        className="text-primary"
                        level={2}
                        variant="section"
                    >
                        Verification
                    </Heading>
                </div>

                <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="space-y-1">
                            <Text as="p" weight="bold">
                                Apply for Server Verification
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Verified servers get a badge to tell everyone
                                this is the official community server.
                            </Text>
                        </div>
                        {server.verified ? (
                            <Text
                                className="flex items-center gap-1.5 px-4 font-semibold text-primary"
                                size="sm"
                            >
                                <BadgeCheck size={16} /> Verified
                            </Text>
                        ) : server.verificationRequested ? (
                            <Text
                                className="px-4 font-semibold"
                                size="sm"
                                variant="muted"
                            >
                                Pending Review
                            </Text>
                        ) : (
                            <Button
                                className="min-w-[120px]"
                                loading={isRequestingVerification}
                                variant="primary"
                                onClick={(): void => {
                                    requestVerification();
                                }}
                            >
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                Apply
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border-b border-border-subtle pt-4 pb-4">
                    <Heading className="text-error" level={2} variant="section">
                        Danger Zone
                    </Heading>
                </div>

                <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="space-y-1">
                            <Text as="p" weight="bold">
                                Transfer Ownership
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Give this server to another member. This action
                                cannot be undone.
                            </Text>
                        </div>
                        <Button
                            className="min-w-[120px]"
                            variant="danger"
                            onClick={(): void => {
                                setIsTransferModalOpen(true);
                            }}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Transfer
                        </Button>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="space-y-1">
                            <Text as="p" variant="danger" weight="bold">
                                Delete Server
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Permanently delete this server and all its data.
                                This action is IRREVERSIBLE.
                            </Text>
                        </div>
                        <Button
                            className="min-w-[120px]"
                            variant="danger"
                            onClick={(): void => {
                                setIsDeleteModalOpen(true);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Server
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                className="max-w-md"
                isOpen={isDeleteModalOpen}
                title={`Delete '${server.name}'`}
                onClose={(): void => {
                    setIsDeleteModalOpen(false);
                    setConfirmDeleteName('');
                }}
            >
                <div className="space-y-6">
                    <div className="border-status-error bg-status-error-bg text-status-error rounded-md border p-4 text-sm">
                        Are you sure you want to delete{' '}
                        <strong>{server.name}</strong>? This action cannot be
                        undone. All messages, channels, and roles will be
                        permanently removed.
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-muted-foreground uppercase"
                            htmlFor="confirm-delete-name"
                        >
                            Enter Server Name
                        </label>
                        <Input
                            id="confirm-delete-name"
                            placeholder={server.name}
                            value={confirmDeleteName}
                            onChange={(e): void => {
                                setConfirmDeleteName(e.target.value);
                            }}
                        />
                    </div>

                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
                        <Button
                            className="min-w-[96px]"
                            variant="ghost"
                            onClick={(): void => {
                                setIsDeleteModalOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="min-w-[96px]"
                            disabled={confirmDeleteName !== server.name}
                            loading={isDeleting}
                            variant="danger"
                            onClick={handleDeleteServer}
                        >
                            Delete Server
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                className="max-w-md"
                isOpen={isTransferModalOpen}
                title="Transfer Ownership"
                onClose={(): void => {
                    setIsTransferModalOpen(false);
                }}
            >
                <div className="space-y-6">
                    <Text size="sm" variant="muted">
                        Transferring ownership will make another member the
                        owner of this server. You will no longer have full
                        control over the server.
                    </Text>

                    <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto">
                        {transferableMembers.map((member) => (
                            <div
                                className="group flex items-center justify-between rounded-md p-2 transition-colors hover:bg-bg-subtle"
                                key={member.userId}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 overflow-hidden rounded-full bg-bg-secondary">
                                        {member.user.profilePicture ? (
                                            <img
                                                alt={member.user.username}
                                                className="h-full w-full object-cover"
                                                src={
                                                    resolveApiUrl(
                                                        member.user
                                                            .profilePicture,
                                                    ) || ''
                                                }
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                                                {member.user.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <Text size="sm" weight="semibold">
                                            {member.user.displayName ||
                                                member.user.username}
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            @{member.user.username}
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    className="opacity-0 transition-opacity group-hover:opacity-100"
                                    loading={isTransferring}
                                    size="sm"
                                    variant="primary"
                                    onClick={(): void => {
                                        handleTransferOwnership(member.userId);
                                    }}
                                >
                                    Transfer
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="-mx-6 -mb-6 flex justify-end p-6 pt-4">
                        <Button
                            variant="ghost"
                            onClick={(): void => {
                                setIsTransferModalOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
