import React, { useState } from 'react';

import { Trash2 } from 'lucide-react';

import {
    useDeleteChannel,
    useUpdateChannel,
} from '@/api/servers/servers.queries';
import { type Channel } from '@/api/servers/servers.types';
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
    const [error, setError] = useState<string | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { mutate: updateChannel, isPending: isUpdating } = useUpdateChannel(
        channel.serverId,
        channel._id,
    );
    const { mutate: deleteChannel, isPending: isDeleting } = useDeleteChannel(
        channel.serverId,
    );

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
    }

    const hasChanges =
        name !== originalName ||
        description !== originalDescription ||
        selectedIcon !== originalIcon ||
        linkUrl !== originalLinkUrl;

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
            },
            {
                onSuccess: () => {
                    setOriginalName(name);
                    setOriginalDescription(description);
                    setOriginalIcon(selectedIcon);
                    if (channel.type === 'link') {
                        setOriginalLinkUrl(linkUrl);
                    }
                },
            },
        );
    };

    const handleReset = (): void => {
        setName(originalName);
        setDescription(originalDescription);
        setSelectedIcon(originalIcon);
        setLinkUrl(originalLinkUrl);
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
            </div>

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
