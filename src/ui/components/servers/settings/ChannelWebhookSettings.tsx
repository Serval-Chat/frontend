import { useMemo, useState } from 'react';

import { Check, Copy, Plus, Trash2, Webhook } from 'lucide-react';

import {
    useCreateWebhook,
    useDeleteWebhook,
    useWebhooks,
} from '@/api/webhooks/webhooks.queries';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { resolveApiUrl } from '@/utils/apiUrl';
import { APP_LOCALE } from '@/utils/locale';

interface ChannelWebhookSettingsProps {
    serverId: string;
    channelId: string;
}

export const ChannelWebhookSettings = ({
    serverId,
    channelId,
}: ChannelWebhookSettingsProps) => {
    const [name, setName] = useState('');
    const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);
    const [pendingDeleteWebhookId, setPendingDeleteWebhookId] = useState<
        string | null
    >(null);
    const { hasPermission } = usePermissions(serverId, channelId);
    const canManageWebhooks = hasPermission('manageWebhooks');

    const { data: webhooks = [], isLoading } = useWebhooks(serverId, channelId);
    const createWebhook = useCreateWebhook(serverId, channelId);
    const deleteWebhook = useDeleteWebhook(serverId, channelId);

    const canCreate = useMemo(
        (): boolean =>
            !!name.trim() && !createWebhook.isPending && canManageWebhooks,
        [name, createWebhook.isPending, canManageWebhooks],
    );

    const handleCreate = (): void => {
        if (!canCreate) return;
        createWebhook.mutate(
            { name: name.trim() },
            {
                onSuccess: (): void => setName(''),
            },
        );
    };

    const buildWebhookUrl = (token: string): string =>
        `${window.location.origin}/api/v1/webhooks/${token}`;

    const getWebhookInitial = (webhookName: string): string =>
        webhookName.trim().charAt(0).toUpperCase() || 'W';

    const handleCopy = (webhookId: string, token: string): void => {
        void navigator.clipboard.writeText(buildWebhookUrl(token));
        setCopiedWebhookId(webhookId);
        window.setTimeout((): void => {
            setCopiedWebhookId((current): string | null =>
                current === webhookId ? null : current,
            );
        }, 1500);
    };

    const handleConfirmDelete = (): void => {
        if (!pendingDeleteWebhookId) return;
        deleteWebhook.mutate(pendingDeleteWebhookId, {
            onSuccess: (): void => setPendingDeleteWebhookId(null),
        });
    };

    return (
        <div className="max-w-3xl space-y-8 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Webhooks
                </Heading>
                <Text variant="muted">
                    Create and manage channel webhooks for bot-style message
                    delivery.
                </Text>
            </div>

            {!canManageWebhooks ? (
                <div className="rounded-lg border border-border-subtle bg-bg-secondary p-6">
                    <Text variant="muted">
                        You need the Manage Webhooks permission to view and
                        manage webhooks for this channel.
                    </Text>
                </div>
            ) : (
                <>
                    <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-secondary p-5">
                        <Text as="p" className="font-medium">
                            Create webhook
                        </Text>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Webhook name"
                                value={name}
                                onChange={(e): void => setName(e.target.value)}
                            />
                            <Button
                                disabled={!canCreate}
                                loading={createWebhook.isPending}
                                onClick={handleCreate}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="rounded-lg border border-border-subtle bg-bg-secondary p-5">
                                <Text variant="muted">Loading webhooks...</Text>
                            </div>
                        ) : webhooks.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-secondary p-8 text-center">
                                <Webhook className="mx-auto mb-3 h-5 w-5 text-muted-foreground" />
                                <Text variant="muted">
                                    No webhooks created for this channel yet.
                                </Text>
                            </div>
                        ) : (
                            webhooks.map((webhook) => (
                                <div
                                    className="space-y-3 rounded-lg border border-border-subtle bg-bg-secondary p-4"
                                    key={webhook._id}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            {webhook.avatarUrl ? (
                                                <img
                                                    alt=""
                                                    className="h-10 w-10 rounded-full border border-border-subtle object-cover"
                                                    src={
                                                        resolveApiUrl(
                                                            webhook.avatarUrl,
                                                        ) ?? webhook.avatarUrl
                                                    }
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-subtle text-sm font-semibold text-muted-foreground">
                                                    {getWebhookInitial(
                                                        webhook.name,
                                                    )}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <Text
                                                    as="p"
                                                    className="truncate font-medium"
                                                >
                                                    {webhook.name}
                                                </Text>
                                                <Text
                                                    as="p"
                                                    className="mt-0.5"
                                                    size="xs"
                                                    variant="muted"
                                                >
                                                    Created{' '}
                                                    {new Date(
                                                        webhook.createdAt,
                                                    ).toLocaleString(
                                                        APP_LOCALE,
                                                    )}
                                                </Text>
                                            </div>
                                        </div>
                                        <Button
                                            loading={
                                                deleteWebhook.isPending &&
                                                deleteWebhook.variables ===
                                                    webhook._id
                                            }
                                            size="sm"
                                            variant="danger"
                                            onClick={(): void =>
                                                setPendingDeleteWebhookId(
                                                    webhook._id,
                                                )
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Text size="xs" variant="muted">
                                            Webhook URL
                                        </Text>
                                        <div className="flex gap-2">
                                            <div
                                                className="min-w-0 flex-1 rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm text-muted-foreground"
                                                title={buildWebhookUrl(
                                                    webhook.token,
                                                )}
                                            >
                                                <span className="block truncate">
                                                    {buildWebhookUrl(
                                                        webhook.token,
                                                    )}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(): void =>
                                                    handleCopy(
                                                        webhook._id,
                                                        webhook.token,
                                                    )
                                                }
                                            >
                                                {copiedWebhookId ===
                                                webhook._id ? (
                                                    <Check className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
            {pendingDeleteWebhookId && (
                <Modal
                    isOpen
                    title="Delete Webhook"
                    onClose={(): void => setPendingDeleteWebhookId(null)}
                >
                    <div className="flex flex-col gap-4 p-4">
                        <Text as="p" variant="muted">
                            Are you sure you want to delete this webhook? This
                            cannot be undone.
                        </Text>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={(): void =>
                                    setPendingDeleteWebhookId(null)
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                loading={deleteWebhook.isPending}
                                variant="danger"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
