import React, { useState } from 'react';

import { Hash, Link } from 'lucide-react';

import { serversApi } from '@/api/servers/servers.api';
import type { ChannelType } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
    categoryId?: string | null;
}

const CHANNEL_TYPES: {
    type: ChannelType;
    label: string;
    description: string;
    Icon: React.ElementType;
}[] = [
    {
        type: 'text',
        label: 'Text',
        description: 'Send messages, images and other files',
        Icon: Hash,
    },
    {
        type: 'link',
        label: 'Link',
        description: 'A pseudochannel that acts as a clickable link',
        Icon: Link,
    },
];

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
    isOpen,
    onClose,
    serverId,
    categoryId,
}) => {
    const [name, setName] = useState('');
    const [channelType, setChannelType] = useState<ChannelType>('text');
    const [linkUrl, setLinkUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = (): void => {
        if (isLoading) return;
        onClose();
        setName('');
        setLinkUrl('');
        setChannelType('text');
        setError(null);
    };

    const handleCreate = async (): Promise<void> => {
        if (!name.trim()) return;

        if (channelType === 'link') {
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

        setIsLoading(true);
        setError(null);

        try {
            await serversApi.createChannel(serverId, {
                name: name.trim(),
                categoryId,
                type: channelType,
                ...(channelType === 'link' ? { link: linkUrl.trim() } : {}),
            });
            handleClose();
        } catch (err) {
            setError('Failed to create channel. Please try again.');
            console.error('Create channel error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} title="Create Channel" onClose={handleClose}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <Text
                        size="xs"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        Channel Type
                    </Text>
                    <div className="space-y-2">
                        {CHANNEL_TYPES.map(
                            ({ type, label, description, Icon }) => (
                                <button
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-3 rounded-md border transition-all text-left',
                                        channelType === type
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10',
                                    )}
                                    key={type}
                                    type="button"
                                    onClick={() => setChannelType(type)}
                                >
                                    <Icon
                                        className={cn(
                                            'w-5 h-5 shrink-0',
                                            channelType === type
                                                ? 'text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <Text size="sm" weight="medium">
                                            {label}
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            {description}
                                        </Text>
                                    </div>
                                    <div
                                        className={cn(
                                            'w-4 h-4 rounded-full border-2 shrink-0',
                                            channelType === type
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground',
                                        )}
                                    />
                                </button>
                            ),
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Text
                        size="xs"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        Channel Name
                    </Text>
                    <Input
                        placeholder="new-channel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && name.trim()) {
                                void handleCreate();
                            }
                        }}
                    />
                </div>

                {channelType === 'link' && (
                    <div className="space-y-2">
                        <Text
                            size="xs"
                            transform="uppercase"
                            variant="muted"
                            weight="bold"
                        >
                            Channel URL
                        </Text>
                        <Input
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    name.trim() &&
                                    linkUrl.trim()
                                ) {
                                    void handleCreate();
                                }
                            }}
                        />
                    </div>
                )}

                {error && (
                    <Text size="xs" variant="danger">
                        {error}
                    </Text>
                )}

                <div className="flex gap-3 justify-end pt-2">
                    <Button
                        disabled={isLoading}
                        variant="ghost"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={
                            !name.trim() ||
                            (channelType === 'link' && !linkUrl.trim()) ||
                            isLoading
                        }
                        loading={isLoading}
                        variant="primary"
                        onClick={() => void handleCreate()}
                    >
                        Create Channel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
