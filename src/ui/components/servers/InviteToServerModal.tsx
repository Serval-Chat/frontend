import { useMemo } from 'react';

import { invitesApi } from '@/api/invites/invites.api';
import { useServers } from '@/api/servers/servers.queries';
import { useInviteActionStates } from '@/hooks/useInviteActionStates';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { wsMessages } from '@/ws/messages';

import { InviteActionButton } from './InviteActionButton';
import { ServerIcon } from './ServerIcon';

interface InviteToServerModalProps {
    userId: string;
    username: string;
    isOpen: boolean;
    onClose: () => void;
}

export const InviteToServerModal = ({
    userId,
    username,
    isOpen,
    onClose,
}: InviteToServerModalProps) => {
    const { data: servers = [], isLoading } = useServers();
    const invitableServers = useMemo(
        () => servers.filter((server): boolean => !!server.canInvite),
        [servers],
    );
    const { states, send, reset } = useInviteActionStates();

    const handleInvite = (serverId: string): Promise<void> =>
        send(serverId, async () => {
            const invite = await invitesApi.createInvite(serverId, {});
            const url = `${window.location.origin}/invite/${
                invite.customPath || invite.code
            }`;
            wsMessages.sendMessageDm(userId, url);
        });

    const handleClose = (): void => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            title={`Invite ${username} to a Server`}
            onClose={handleClose}
        >
            <div className="space-y-1 py-2">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : invitableServers.length === 0 ? (
                    <Text as="p" size="sm" variant="muted">
                        You don't have permission to invite people to any of
                        your servers.
                    </Text>
                ) : (
                    <div className="-mx-1 max-h-96 space-y-1 overflow-y-auto">
                        {invitableServers.map((server) => (
                            <div
                                className="flex items-center gap-3 rounded-md px-2 py-1.5"
                                key={server.id}
                            >
                                <ServerIcon server={server} size="xs" />
                                <Text
                                    className="min-w-0 flex-1 truncate"
                                    size="sm"
                                    weight="medium"
                                >
                                    {server.name}
                                </Text>
                                <InviteActionButton
                                    state={states[server.id] ?? 'idle'}
                                    onClick={(): void => {
                                        void handleInvite(server.id);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
