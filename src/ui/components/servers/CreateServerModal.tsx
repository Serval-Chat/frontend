import React, { useState } from 'react';

import { useCreateServer } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [name, setName] = useState('');
    const { mutate: createServer, isPending } = useCreateServer();

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!name.trim()) return;

        createServer(
            { name },
            {
                onSuccess: () => {
                    onClose();
                    setName('');
                },
            },
        );
    };

    return (
        <Modal isOpen={isOpen} title="Create a Server" onClose={onClose}>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                    <Text
                        as="label"
                        htmlFor="server-name"
                        size="sm"
                        transform="uppercase"
                        variant="subtle"
                        weight="medium"
                    >
                        Server Name
                    </Text>
                    <Input
                        id="server-name"
                        placeholder="My Awesome Server"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Text as="p" size="xs" variant="muted">
                        By creating a server, you agree to our Community
                        Guidelines.
                    </Text>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Back
                    </Button>
                    <Button
                        disabled={!name.trim() || isPending}
                        loading={isPending}
                        type="submit"
                        variant="primary"
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
