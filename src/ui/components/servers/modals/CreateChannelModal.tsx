import React, { useState } from 'react';

import { serversApi } from '@/api/servers/servers.api';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
    categoryId?: string | null;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
    isOpen,
    onClose,
    serverId,
    categoryId,
}) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (): Promise<void> => {
        if (!name.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            await serversApi.createChannel(serverId, {
                name: name.trim(),
                categoryId,
                type: 'text',
            });
            onClose();
            setName('');
        } catch (err) {
            setError('Failed to create channel. Please try again.');
            console.error('Create channel error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Create Channel"
            onClose={() => {
                if (!isLoading) {
                    onClose();
                    setName('');
                    setError(null);
                }
            }}
        >
            <div className="space-y-6">
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
                        onChange={(e) =>
                            setName(
                                e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-'),
                            )
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && name.trim()) {
                                void handleCreate();
                            }
                        }}
                    />
                    {error && (
                        <Text size="xs" variant="danger">
                            {error}
                        </Text>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button
                        disabled={isLoading}
                        variant="ghost"
                        onClick={() => {
                            onClose();
                            setName('');
                            setError(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!name.trim() || isLoading}
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
