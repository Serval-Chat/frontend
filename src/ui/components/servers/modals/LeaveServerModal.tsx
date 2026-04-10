import React from 'react';

import { useLeaveServer } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface LeaveServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
    serverName: string;
}

export const LeaveServerModal: React.FC<LeaveServerModalProps> = ({
    isOpen,
    onClose,
    serverId,
    serverName,
}) => {
    const { mutate: leaveServer, isPending } = useLeaveServer();

    const handleLeave = (): void => {
        leaveServer(serverId, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            title={`Leave '${serverName}'`}
            onClose={onClose}
        >
            <div className="flex flex-col gap-4">
                <Text>
                    Are you sure you want to leave{' '}
                    <Text as="span" weight="bold">
                        {serverName}
                    </Text>
                    ? You won't be able to rejoin this server unless you are
                    re-invited.
                </Text>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        loading={isPending}
                        variant="danger"
                        onClick={handleLeave}
                    >
                        Leave Server
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
