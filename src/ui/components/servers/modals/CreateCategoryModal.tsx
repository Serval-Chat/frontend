import React, { useState } from 'react';

import { serversApi } from '@/api/servers/servers.api';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
    isOpen,
    onClose,
    serverId,
}) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = (): void => {
        if (isLoading) return;
        onClose();
        setName('');
        setError(null);
    };

    const handleCreate = async (): Promise<void> => {
        if (!name.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            await serversApi.createCategory(serverId, {
                name: name.trim(),
            });
            handleClose();
        } catch (err) {
            setError('Failed to create category. Please try again.');
            console.error('Create category error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} title="Create Category" onClose={handleClose}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <Text
                        size="xs"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        Category Name
                    </Text>
                    <Input
                        placeholder="New Category"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && name.trim()) {
                                void handleCreate();
                            }
                        }}
                    />
                </div>

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
                        disabled={!name.trim() || isLoading}
                        loading={isLoading}
                        variant="primary"
                        onClick={() => void handleCreate()}
                    >
                        Create Category
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
