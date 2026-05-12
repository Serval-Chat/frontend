import React, { useState } from 'react';

import { Hash, Link, Volume2 } from 'lucide-react';

import { serversApi } from '@/api/servers/servers.api';
import type { ChannelType } from '@/api/servers/servers.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Popover } from '@/ui/components/common/Popover';
import { Text } from '@/ui/components/common/Text';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
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
        type: 'voice',
        label: 'Voice',
        description: 'Talk with voice (and video in the future)',
        Icon: Volume2,
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
    const [emoji, setEmoji] = useState('');
    const [emojiType, setEmojiType] = useState<
        'custom' | 'unicode' | undefined
    >(undefined);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiTriggerRef = React.useRef<HTMLButtonElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { customCategories } = useCustomEmojis();

    const handleClose = (): void => {
        if (isLoading) return;
        onClose();
        setName('');
        setLinkUrl('');
        setEmoji('');
        setEmojiType(undefined);
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
                emoji: emoji || undefined,
                emojiType,
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
                                        'flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-all',
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
                                            'h-5 w-5 shrink-0',
                                            channelType === type
                                                ? 'text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <Text size="sm" weight="medium">
                                            {label}
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            {description}
                                        </Text>
                                    </div>
                                    <div
                                        className={cn(
                                            'h-4 w-4 shrink-0 rounded-full border-2',
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

                <div className="space-y-2">
                    <Text
                        size="xs"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        Channel Emoji (Optional)
                    </Text>
                    <div className="flex items-center gap-4">
                        <Button
                            className="h-16 w-16 border border-dashed border-border-subtle bg-bg-secondary hover:bg-white/5"
                            ref={emojiTriggerRef}
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setIsEmojiPickerOpen(!isEmojiPickerOpen)
                            }
                        >
                            {emoji && emojiType ? (
                                <div className="h-10 w-10">
                                    {emojiType === 'custom' ? (
                                        <ParsedEmoji
                                            className="h-full w-full"
                                            emojiId={emoji}
                                        />
                                    ) : (
                                        <ParsedUnicodeEmoji
                                            className="h-full w-full text-2xl"
                                            content={emoji}
                                        />
                                    )}
                                </div>
                            ) : (
                                <Text size="xs" variant="muted">
                                    Select
                                </Text>
                            )}
                        </Button>
                        {emoji && (
                            <Button
                                size="sm"
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setEmoji('');
                                    setEmojiType(undefined);
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    <Popover
                        isOpen={isEmojiPickerOpen}
                        triggerRef={emojiTriggerRef}
                        onClose={() => setIsEmojiPickerOpen(false)}
                    >
                        <EmojiPicker
                            customCategories={customCategories}
                            onCustomEmojiSelect={(e) => {
                                setEmoji(e.id);
                                setEmojiType('custom');
                                setIsEmojiPickerOpen(false);
                            }}
                            onEmojiSelect={(e) => {
                                setEmoji(e);
                                setEmojiType('unicode');
                                setIsEmojiPickerOpen(false);
                            }}
                        />
                    </Popover>
                </div>

                {error && (
                    <Text size="xs" variant="danger">
                        {error}
                    </Text>
                )}

                <div className="flex justify-end gap-3 pt-2">
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
