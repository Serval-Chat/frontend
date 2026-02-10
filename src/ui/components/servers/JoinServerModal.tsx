import React, { useState } from 'react';

import { useJoinServer } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';

interface JoinServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [inviteCode, setInviteCode] = useState('');
    const { mutate: joinServer, isPending } = useJoinServer();

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        // Extract code from URL if full URL is pasted
        const code = inviteCode.split('/').pop() || inviteCode;

        joinServer(code, {
            onSuccess: () => {
                onClose();
                setInviteCode('');
            },
        });
    };

    return (
        <Modal isOpen={isOpen} title="Join a Server" onClose={onClose}>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                    <label
                        className="text-sm font-medium text-[var(--color-text-subtle)]"
                        htmlFor="invite-code"
                    >
                        INVITE CODE
                    </label>
                    <Input
                        id="invite-code"
                        placeholder="cats (yes this is real, join this)"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Enter an invite code to join an existing server.
                    </p>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Back
                    </Button>
                    <Button
                        disabled={!inviteCode.trim() || isPending}
                        loading={isPending}
                        type="submit"
                        variant="primary"
                    >
                        Join Server
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
