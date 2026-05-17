import React, { useState } from 'react';

import { useCreateServer } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToJoin?: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
    isOpen,
    onClose,
    onSwitchToJoin,
}) => {
    const [name, setName] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const { mutate: createServer, isPending } = useCreateServer();

    const handleActualSubmit = (): void => {
        createServer(
            { name },
            {
                onSuccess: () => {
                    setShowConfirm(false);
                    onClose();
                    setName('');
                },
            },
        );
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!name.trim()) return;
        setShowConfirm(true);
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !showConfirm}
                title="Create a Server"
                onClose={onClose}
            >
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

                    <div className="mt-4 flex justify-end gap-2">
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

            <Modal
                isOpen={isOpen && showConfirm}
                title="Create a Server?"
                onClose={() => setShowConfirm(false)}
            >
                <div className="flex flex-col gap-4">
                    <Text>
                        Are you sure you wanna create a server and not join?
                    </Text>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                        >
                            Cancel
                        </Button>
                        {onSwitchToJoin && (
                            <Button
                                variant="normal"
                                onClick={() => {
                                    setShowConfirm(false);
                                    onSwitchToJoin();
                                }}
                            >
                                Join Server instead
                            </Button>
                        )}
                        <Button
                            loading={isPending}
                            variant="primary"
                            onClick={handleActualSubmit}
                        >
                            Create Server
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
