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
    }

    const hasChanges =
        name !== originalName ||
        description !== originalDescription ||
        selectedIcon !== originalIcon;

    const handleSave = (): void => {
        updateChannel(
            {
                name,
                description,
                icon: selectedIcon || undefined,
            },
            {
                onSuccess: () => {
                    setOriginalName(name);
                    setOriginalDescription(description);
                    setOriginalIcon(selectedIcon);
                },
            },
        );
    };

    const handleReset = (): void => {
        setName(originalName);
        setDescription(originalDescription);
        setSelectedIcon(originalIcon);
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
                        className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
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
                        className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
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

                <div className="space-y-2">
                    <label
                        className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                        htmlFor="channel-icons"
                    >
                        Channel Icon
                    </label>
                    <div
                        className="grid grid-cols-6 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-3 border border-[var(--color-border-subtle)] rounded-md custom-scrollbar bg-[var(--color-bg-secondary)]"
                        id="channel-icons"
                    >
                        {Object.entries(ICON_MAP).map(
                            ([key, IconComponent]) => (
                                <Button
                                    className={cn(
                                        'p-2 h-auto text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] border transition-all',
                                        selectedIcon === key
                                            ? 'bg-[var(--color-primary-transparent)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary-transparent)]'
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
            <div className="pt-10 space-y-6">
                <div className="pb-4 border-b border-[var(--color-border-subtle)]">
                    <Heading
                        className="text-[var(--color-error)]"
                        level={2}
                        variant="section"
                    >
                        Danger Zone
                    </Heading>
                </div>

                <div className="rounded-lg border border-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-subtle)]">
                    <div className="p-4 flex items-center justify-between gap-4">
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
                            <Trash2 className="w-4 h-4 mr-2" />
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
                    <div className="p-4 bg-[var(--color-status-error-bg)] border border-[var(--color-status-error)] rounded-md text-[var(--color-status-error)] text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-bold">#{channel.name}</span>? This
                        action cannot be undone.
                    </div>
                    <div className="flex justify-end gap-3 pt-4 bg-[var(--color-bg-secondary)] -mx-6 -mb-6 p-6">
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
