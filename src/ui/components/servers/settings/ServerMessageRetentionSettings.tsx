import { useState } from 'react';

import {
    useFlushDeletedMessages,
    useServerDetails,
    useUpdateServer,
} from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Slider } from '@/ui/components/common/Slider';
import { Text } from '@/ui/components/common/Text';
import {
    DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES,
    DELETED_MESSAGE_RETENTION_OPTIONS,
    formatDeletedMessageRetention,
    getDeletedMessageRetentionAtSliderIndex,
    getDeletedMessageRetentionSliderIndex,
    sanitizeDeletedMessageRetentionMinutes,
} from '@/utils/deletedMessageRetention';

interface ServerMessageRetentionSettingsProps {
    serverId: string;
}

const ServerMessageRetentionSettingsForm = ({
    server,
    serverId,
}: {
    server: Server;
    serverId: string;
}) => {
    const initialRetention = sanitizeDeletedMessageRetentionMinutes(
        server.deletedMessageRetentionMinutes ??
            DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES,
    );
    const [retentionMinutes, setRetentionMinutes] = useState(initialRetention);
    const [savedRetentionMinutes, setSavedRetentionMinutes] =
        useState(initialRetention);
    const { mutate: updateServer, isPending } = useUpdateServer(serverId);
    const {
        mutate: flushDeletedMessages,
        isPending: isFlushingDeletedMessages,
    } = useFlushDeletedMessages(serverId);
    const [isFlushConfirmOpen, setIsFlushConfirmOpen] = useState(false);
    const hasChanges = retentionMinutes !== savedRetentionMinutes;
    const sliderIndex = getDeletedMessageRetentionSliderIndex(retentionMinutes);

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            { deletedMessageRetentionMinutes: retentionMinutes },
            {
                onSuccess: (updatedServer): void => {
                    const saved = sanitizeDeletedMessageRetentionMinutes(
                        updatedServer.deletedMessageRetentionMinutes,
                    );
                    setRetentionMinutes(saved);
                    setSavedRetentionMinutes(saved);
                },
            },
        );
    };

    return (
        <div className="max-w-3xl space-y-8 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Message Retention
                </Heading>
                <Text variant="muted">
                    Choose how long server staff can view deleted messages.
                </Text>
            </div>

            <section className="space-y-5">
                <div className="space-y-1">
                    <Text as="p" weight="semibold">
                        Deleted Message Retention
                    </Text>
                    <Text as="p" size="xs" variant="muted">
                        Members with the See Deleted Messages permission can
                        view deleted messages during this period. After it ends,
                        deleted messages are hidden from server message views.
                    </Text>
                </div>

                <div className="max-w-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <Text as="label" htmlFor="deleted-message-retention">
                            Retention period
                        </Text>
                        <Text
                            aria-live="polite"
                            className="font-semibold text-foreground"
                        >
                            {formatDeletedMessageRetention(retentionMinutes)}
                        </Text>
                    </div>
                    <Slider
                        aria-label="Deleted Message Retention"
                        aria-valuetext={formatDeletedMessageRetention(
                            retentionMinutes,
                        )}
                        id="deleted-message-retention"
                        max={DELETED_MESSAGE_RETENTION_OPTIONS.length - 1}
                        min={0}
                        step={1}
                        value={sliderIndex}
                        onValueChange={(index): void => {
                            setRetentionMinutes(
                                getDeletedMessageRetentionAtSliderIndex(index),
                            );
                        }}
                    />
                    <div className="flex justify-between">
                        <Text size="xs" variant="muted">
                            5 minutes
                        </Text>
                        <Text size="xs" variant="muted">
                            3 days maximum
                        </Text>
                    </div>
                </div>
            </section>

            <section className="space-y-4 border-t border-border-subtle pt-6">
                <div className="space-y-1">
                    <Text as="p" variant="danger" weight="semibold">
                        Permanently delete deleted messages
                    </Text>
                    <Text as="p" size="xs" variant="muted">
                        Immediately and permanently remove every deleted message
                        from this server, regardless of its age. Active messages
                        are not affected.
                    </Text>
                </div>
                <Button
                    variant="danger"
                    onClick={(): void => {
                        setIsFlushConfirmOpen(true);
                    }}
                >
                    Delete All Deleted Messages
                </Button>
            </section>

            <SettingsFloatingBar
                isPending={isPending}
                isVisible={hasChanges}
                onReset={(): void => {
                    setRetentionMinutes(savedRetentionMinutes);
                }}
                onSave={handleSave}
            />

            <Modal
                className="max-w-md"
                isOpen={isFlushConfirmOpen}
                title="Delete all deleted messages?"
                onClose={(): void => {
                    setIsFlushConfirmOpen(false);
                }}
            >
                <div className="space-y-6">
                    <div className="border-status-error bg-status-error-bg text-status-error rounded-md border p-4 text-sm">
                        This permanently deletes every already-deleted message
                        in this server, including messages still within their
                        retention period. Active messages will remain. This
                        cannot be undone.
                    </div>
                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
                        <Button
                            disabled={isFlushingDeletedMessages}
                            variant="ghost"
                            onClick={(): void => {
                                setIsFlushConfirmOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={isFlushingDeletedMessages}
                            variant="danger"
                            onClick={(): void => {
                                flushDeletedMessages(undefined, {
                                    onSuccess: (): void => {
                                        setIsFlushConfirmOpen(false);
                                    },
                                });
                            }}
                        >
                            Permanently Delete All
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export const ServerMessageRetentionSettings = ({
    serverId,
}: ServerMessageRetentionSettingsProps) => {
    const { data: server, isLoading } = useServerDetails(serverId);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!server) return null;

    return (
        <ServerMessageRetentionSettingsForm
            key={server.id}
            server={server}
            serverId={serverId}
        />
    );
};
