import React, { useState } from 'react';

import { Clock, Download, Loader2, Trash2 } from 'lucide-react';

import {
    useDeleteChannel,
    useExportChannelState,
    useRequestExportChannel,
    useUpdateChannel,
} from '@/api/servers/servers.queries';
import { type Channel } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface ChannelOverviewSettingsProps {
    channel: Channel;
    onDeleted?: () => void;
}

export const ChannelOverviewSettings: React.FC<
    ChannelOverviewSettingsProps
> = ({ channel, onDeleted }) => {
    const [name, setName] = useState(channel.name);
    const [originalName, setOriginalName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || '');
    const [originalDescription, setOriginalDescription] = useState(
        channel.description || '',
    );
    const [selectedIcon, setSelectedIcon] = useState(channel.icon || '');
    const [originalIcon, setOriginalIcon] = useState(channel.icon || '');
    const [linkUrl, setLinkUrl] = useState(channel.link || '');
    const [originalLinkUrl, setOriginalLinkUrl] = useState(channel.link || '');
    const [slowMode, setSlowMode] = useState(channel.slowMode || 0);
    const [originalSlowMode, setOriginalSlowMode] = useState(
        channel.slowMode || 0,
    );
    const [error, setError] = useState<string | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { mutate: updateChannel, isPending: isUpdating } = useUpdateChannel(
        channel.serverId,
        channel._id,
    );
    const { mutate: deleteChannel, isPending: isDeleting } = useDeleteChannel(
        channel.serverId,
    );

    const { hasPermission } = usePermissions(channel.serverId, channel._id);
    const canExport = hasPermission('export_channel_messages');

    const { data: exportState, isLoading: isLoadingExportState } =
        useExportChannelState(channel.serverId, channel._id);
    const { mutate: requestExport, isPending: isRequestingExport } =
        useRequestExportChannel(channel.serverId, channel._id);

    const [prevChannelId, setPrevChannelId] = useState(channel._id);
    if (channel._id !== prevChannelId) {
        setPrevChannelId(channel._id);
        setName(channel.name);
        setOriginalName(channel.name);
        setDescription(channel.description || '');
        setOriginalDescription(channel.description || '');
        setSelectedIcon(channel.icon || '');
        setOriginalIcon(channel.icon || '');
        setLinkUrl(channel.link || '');
        setOriginalLinkUrl(channel.link || '');
        setSlowMode(channel.slowMode || 0);
        setOriginalSlowMode(channel.slowMode || 0);
    }

    const hasChanges =
        name !== originalName ||
        description !== originalDescription ||
        selectedIcon !== originalIcon ||
        linkUrl !== originalLinkUrl ||
        slowMode !== originalSlowMode;

    const handleSave = (): void => {
        setError(null);

        if (channel.type === 'link') {
            if (!linkUrl.trim()) {
                setError('URL is required for Link channels.');
                return;
            }
            try {
                new URL(linkUrl.trim());
            } catch {
                setError(
                    'Please enter a valid URL (e.g., https://example.com).',
                );
                return;
            }
        }

        updateChannel(
            {
                name,
                description,
                icon: selectedIcon || undefined,
                ...(channel.type === 'link'
                    ? { link: linkUrl || undefined }
                    : {}),
                slowMode,
            },
            {
                onSuccess: () => {
                    setOriginalName(name);
                    setOriginalDescription(description);
                    setOriginalIcon(selectedIcon);
                    if (channel.type === 'link') {
                        setOriginalLinkUrl(linkUrl);
                    }
                    setOriginalSlowMode(slowMode);
                },
            },
        );
    };

    const handleReset = (): void => {
        setName(originalName);
        setDescription(originalDescription);
        setSelectedIcon(originalIcon);
        setLinkUrl(originalLinkUrl);
        setSlowMode(originalSlowMode);
        setError(null);
    };

    const handleDelete = (): void => {
        deleteChannel(channel._id, {
            onSuccess: () => {
                onDeleted?.();
            },
        });
    };

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Channel Overview
                </Heading>
                <Text variant="muted">
                    Update your channel's name, description, and icon.
                </Text>
            </div>

            <div className="space-y-8">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="channel-name"
                    >
                        Channel Name
                    </label>
                    <Input
                        id="channel-name"
                        placeholder="new-channel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="channel-description"
                    >
                        Description
                    </label>
                    <Input
                        id="channel-description"
                        placeholder="What's this channel about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {channel.type === 'link' && (
                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="channel-link"
                        >
                            Channel URL
                        </label>
                        <Input
                            id="channel-link"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                        />
                        {error && (
                            <Text size="xs" variant="danger">
                                {error}
                            </Text>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="channel-icons"
                    >
                        Channel Icon
                    </label>
                    <div
                        className="custom-scrollbar grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-md border border-border-subtle bg-bg-secondary p-3 md:grid-cols-10"
                        id="channel-icons"
                    >
                        {Object.entries(ICON_MAP).map(
                            ([key, IconComponent]) => (
                                <Button
                                    className={cn(
                                        'h-auto border p-2 text-muted-foreground transition-all hover:text-foreground',
                                        selectedIcon === key
                                            ? 'border-primary bg-primary/20 text-primary shadow-[0_0_8px_var(--color-primary)]'
                                            : 'border-transparent',
                                    )}
                                    key={key}
                                    title={key}
                                    variant="ghost"
                                    onClick={() => setSelectedIcon(key)}
                                >
                                    <IconComponent size={20} />
                                </Button>
                            ),
                        )}
                    </div>
                </div>

                {channel.type === 'text' && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <label
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                                htmlFor="slow-mode"
                            >
                                Slow Mode
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-primary">
                                    {slowMode === 0
                                        ? 'Off'
                                        : slowMode < 60
                                          ? `${slowMode}s`
                                          : slowMode < 3600
                                            ? `${Math.floor(slowMode / 60)}m`
                                            : `${Math.floor(slowMode / 3600)}h`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        className="h-7 w-20 px-2 text-center text-xs"
                                        max={21600}
                                        min={0}
                                        placeholder="0"
                                        type="number"
                                        value={slowMode === 0 ? '' : slowMode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setSlowMode(0);
                                                return;
                                            }
                                            const num = Number(val);
                                            if (!isNaN(num)) {
                                                setSlowMode(
                                                    Math.min(
                                                        21600,
                                                        Math.max(0, num),
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        sec
                                    </span>
                                </div>
                            </div>
                        </div>
                        <input
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-bg-secondary accent-primary"
                            id="slow-mode"
                            max="21600"
                            min="0"
                            step={
                                slowMode < 60
                                    ? 5
                                    : slowMode < 600
                                      ? 10
                                      : slowMode < 3600
                                        ? 60
                                        : 3600
                            }
                            type="range"
                            value={slowMode}
                            onChange={(e) =>
                                setSlowMode(Number(e.target.value))
                            }
                        />
                        <Text className="text-[11px]" variant="muted">
                            Members will be restricted to sending one message
                            per this interval. This does not apply to users with
                            the Bypass Slow Mode permission.
                        </Text>
                    </div>
                )}
            </div>

            {/* Export Messages Section */}
            {canExport && channel.type === 'text' && (
                <div className="space-y-6 pt-10">
                    <div className="border-b border-border-subtle pb-4">
                        <Heading level={2} variant="section">
                            Channel Export
                        </Heading>
                        <Text variant="muted">
                            Export all messages from this channel to a JSON
                            file.
                        </Text>
                    </div>

                    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Download className="h-4 w-4 text-primary" />
                                    <Text weight="bold">
                                        Export channel messages
                                    </Text>
                                </div>
                                <Text size="xs" variant="muted">
                                    Only people with export permissions can
                                    trigger this. Exports are limited to one per
                                    channel every 7 days.
                                </Text>

                                {exportState?.state === 'cooling_down' &&
                                    exportState.nextExportAt && (
                                        <div className="bg-warning/10 text-warning mt-2 flex items-center gap-2 rounded-md p-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            <Text size="xs" weight="medium">
                                                Export cooling down. Next
                                                available:{' '}
                                                {new Date(
                                                    exportState.nextExportAt,
                                                ).toLocaleDateString()}
                                            </Text>
                                        </div>
                                    )}

                                {exportState?.state === 'in_progress' && (
                                    <div className="mt-2 flex items-center gap-2 rounded-md bg-primary/10 p-2 text-primary">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <Text size="xs" weight="medium">
                                            An export is currently in
                                            progress...
                                        </Text>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="min-w-[160px]"
                                disabled={
                                    exportState?.state !== 'available' ||
                                    isRequestingExport
                                }
                                loading={
                                    isRequestingExport || isLoadingExportState
                                }
                                onClick={() => requestExport()}
                            >
                                {exportState?.state === 'in_progress' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Exporting...
                                    </>
                                ) : exportState?.state === 'cooling_down' ? (
                                    <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Rate Limited
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Messages
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="space-y-6 pt-10">
                <div className="border-b border-border-subtle pb-4">
                    <Heading className="text-error" level={2} variant="section">
                        Danger Zone
                    </Heading>
                </div>

                <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="space-y-1">
                            <Text as="p" variant="danger" weight="bold">
                                Delete Channel
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Permanently delete this channel and all its
                                messages. This action is IRREVERSIBLE.
                            </Text>
                        </div>
                        <Button
                            className="min-w-[120px]"
                            variant="danger"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Channel
                        </Button>
                    </div>
                </div>
            </div>

            <SettingsFloatingBar
                isPending={isUpdating}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                className="max-w-md"
                isOpen={isDeleteConfirmOpen}
                title="Delete Channel"
                onClose={() => setIsDeleteConfirmOpen(false)}
            >
                <div className="space-y-6">
                    <div className="border-status-error bg-status-error-bg text-status-error rounded-md border p-4 text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-bold">#{channel.name}</span>? This
                        action cannot be undone.
                    </div>
                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={isDeleting}
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Delete Channel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
