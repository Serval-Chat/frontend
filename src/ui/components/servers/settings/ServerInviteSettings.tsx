import { useState } from 'react';

import { Check, Copy, Plus, Trash2 } from 'lucide-react';

import {
    useCreateInvite,
    useDeleteInvite,
    useServerInvites,
} from '@/api/invites/invites.queries';
import {
    useDeleteVanityLink,
    useSetVanityLink,
    useVanityLink,
} from '@/api/vanity/vanity.queries';
import { usePermissions } from '@/hooks/usePermissions';
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
import { APP_LOCALE } from '@/utils/locale';

interface ServerInviteSettingsProps {
    serverId: string;
}

const formatExpiry = (expiresAt?: string): string => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    return date.toLocaleString(APP_LOCALE);
};

const buildInviteUrl = (code: string): string =>
    `${globalThis.location.origin}/invite/${code}`;

const VanityLinkSection = ({ serverId }: { serverId: string }) => {
    const { showToast } = useToast();
    const { isOwner } = usePermissions(serverId);
    const { data: vanityLink, isLoading } = useVanityLink(serverId);
    const { mutate: setVanityLink, isPending: isSaving } =
        useSetVanityLink(serverId);
    const { mutate: deleteVanityLink, isPending: isDeleting } =
        useDeleteVanityLink(serverId);

    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);

    const currentCode = vanityLink?.code ?? null;

    const handleSave = (): void => {
        if (!code.trim()) return;
        setVanityLink(
            { code: code.trim() },
            {
                onSuccess: (): void => {
                    setCode('');
                    showToast('Vanity link set!', 'success');
                },
                onError: (): void => {
                    showToast('Failed to set vanity link.', 'error');
                },
            },
        );
    };

    const handleDelete = (): void => {
        deleteVanityLink(undefined, {
            onSuccess: (): void => {
                showToast('Vanity link removed.', 'info');
            },
            onError: (): void => {
                showToast('Failed to remove vanity link.', 'error');
            },
        });
    };

    const handleCopy = (): void => {
        if (!currentCode) return;
        void navigator.clipboard.writeText(buildInviteUrl(currentCode));
        setCopied(true);
        globalThis.setTimeout((): void => {
            setCopied(false);
        }, 1500);
    };

    if (isLoading) {
        return null;
    }

    return (
        <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
            <div>
                <Heading level={3}>Vanity Link</Heading>
                <Text size="xs" variant="muted">
                    A single, permanent invite link for your server. Only the
                    server owner can set or change it.
                </Text>
            </div>

            {currentCode ? (
                <div className="flex items-center gap-2">
                    <Input
                        readOnly
                        className="font-mono"
                        value={buildInviteUrl(currentCode)}
                    />
                    <Button
                        size="sm"
                        title="Copy Link"
                        variant="ghost"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                    {isOwner ? (
                        <Button
                            disabled={isDeleting}
                            loading={isDeleting}
                            size="sm"
                            title="Remove"
                            variant="ghost"
                            onClick={handleDelete}
                        >
                            <Trash2 className="text-status-error h-4 w-4" />
                        </Button>
                    ) : null}
                </div>
            ) : !isOwner ? (
                <Text size="sm" variant="muted">
                    No vanity link has been set for this server.
                </Text>
            ) : null}

            {isOwner ? (
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="e.g. awesome-server"
                        value={code}
                        onChange={(e): void => {
                            setCode(e.target.value);
                        }}
                    />
                    <Button
                        disabled={isSaving || !code.trim()}
                        loading={isSaving}
                        variant="primary"
                        onClick={handleSave}
                    >
                        {currentCode ? 'Change' : 'Set'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
};

export const ServerInviteSettings = ({
    serverId,
}: ServerInviteSettingsProps) => {
    const { showToast } = useToast();
    const { data: invites = [], isLoading } = useServerInvites(serverId);
    const { mutate: createInvite, isPending: isCreating } =
        useCreateInvite(serverId);
    const { mutate: deleteInvite } = useDeleteInvite(serverId);

    const [maxUses, setMaxUses] = useState<number>(0);
    const [expiresIn, setExpiresIn] = useState<number>(0); // 0 = never

    const handleCreateInvite = (): void => {
        createInvite(
            {
                maxUses: maxUses > 0 ? maxUses : undefined,
                expiresIn: expiresIn > 0 ? expiresIn : undefined,
            },
            {
                onSuccess: (): void => {
                    setMaxUses(0);
                    setExpiresIn(0);
                    showToast('Invite generated successfully!', 'success');
                },
                onError: (): void => {
                    showToast('Failed to generate invite.', 'error');
                },
            },
        );
    };

    const handleCopy = (code: string): void => {
        void navigator.clipboard.writeText(buildInviteUrl(code));
        showToast('Invite link copied to clipboard!', 'success');
    };

    const handleDelete = (inviteId: string): void => {
        deleteInvite(inviteId, {
            onSuccess: (): void => {
                showToast('Invite deleted.', 'info');
            },
            onError: (): void => {
                showToast('Failed to delete invite.', 'error');
            },
        });
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
                <Text variant="muted">
                    Create and manage invitations for your server.
                </Text>
            </div>

            {/* Create Invite Form */}
            <div className="space-y-6 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                <Heading level={3}>Create New Invite</Heading>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="max-uses"
                        >
                            Max Uses
                        </label>
                        <Input
                            id="max-uses"
                            min={0}
                            type="number"
                            value={maxUses}
                            onChange={(e): void => {
                                setMaxUses(
                                    Number.parseInt(e.target.value) || 0,
                                );
                            }}
                        />
                        <Text size="xs" variant="muted">
                            0 for unlimited uses.
                        </Text>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="expires-in"
                        >
                            Expire After
                        </label>
                        <select
                            className="border-input-border bg-input-bg h-10 w-full rounded-md border px-3 text-sm transition-all focus:ring-2 focus:ring-primary focus:outline-none"
                            id="expires-in"
                            value={expiresIn}
                            onChange={(e): void => {
                                setExpiresIn(Number.parseInt(e.target.value));
                            }}
                        >
                            <option value={0}>Never</option>
                            <option value={1800}>30 Minutes</option>
                            <option value={3600}>1 Hour</option>
                            <option value={21_600}>6 Hours</option>
                            <option value={43_200}>12 Hours</option>
                            <option value={86_400}>24 Hours</option>
                            <option value={604_800}>7 Days</option>
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
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Invite
                    </Button>
                </div>
            </div>

            <VanityLinkSection serverId={serverId} />

            {/* Invites List */}
            <div className="space-y-4">
                <Heading level={3}>Active Invites ({invites.length})</Heading>

                {invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
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
                                <TableHead>Created By</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead>Expires At</TableHead>
                                <TableHead align="right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invites.map((invite) => (
                                <TableRow key={invite.id}>
                                    <TableCell monospace>
                                        {invite.code}
                                    </TableCell>
                                    <TableCell muted>
                                        {invite.createdByUsername ?? 'Unknown'}
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
                                                onClick={(): void => {
                                                    handleCopy(invite.code);
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                title="Delete"
                                                variant="ghost"
                                                onClick={(): void => {
                                                    handleDelete(invite.id);
                                                }}
                                            >
                                                <Trash2 className="text-status-error h-4 w-4" />
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
