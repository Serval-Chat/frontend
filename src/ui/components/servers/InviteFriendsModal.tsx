import { useMemo, useRef, useState } from 'react';

import { Search } from 'lucide-react';

import { useFriends } from '@/api/friends/friends.queries';
import { useCreateInvite } from '@/api/invites/invites.queries';
import type { ServerInvite } from '@/api/invites/invites.types';
import { useInviteActionStates } from '@/hooks/useInviteActionStates';
import { Input } from '@/ui/components/common/Input';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { wsMessages } from '@/ws/messages';

import { InviteActionButton } from './InviteActionButton';

interface InviteFriendsModalProps {
    serverId: string;
    serverName: string;
    isOpen: boolean;
    onClose: () => void;
}

export const InviteFriendsModal = ({
    serverId,
    serverName,
    isOpen,
    onClose,
}: InviteFriendsModalProps) => {
    const { data: friends = [], isLoading } = useFriends({
        enabled: isOpen,
    });
    const { mutateAsync: createInvite } = useCreateInvite(serverId);
    const { states, send, reset } = useInviteActionStates();

    const inviteRef = useRef<Promise<ServerInvite> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFriends = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return friends;
        return friends.filter(
            (friend) =>
                friend.username.toLowerCase().includes(query) ||
                friend.displayName?.toLowerCase().includes(query),
        );
    }, [friends, searchQuery]);

    const handleInvite = (friendId: string): Promise<void> =>
        send(friendId, async () => {
            if (!inviteRef.current) {
                inviteRef.current = createInvite({});
            }
            const activeInvite = await inviteRef.current.catch((error) => {
                inviteRef.current = null;
                throw error;
            });

            const url = `${globalThis.location.origin}/invite/${
                activeInvite.customPath || activeInvite.code
            }`;
            wsMessages.sendMessageDm(friendId, url);
        });

    const handleClose = (): void => {
        inviteRef.current = null;
        reset();
        setSearchQuery('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            title={`Invite Friends to ${serverName}`}
            onClose={handleClose}
        >
            <div className="space-y-3 py-2">
                {friends.length > 0 ? (
                    <Input
                        icon={<Search className="h-4 w-4" />}
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e): void => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                ) : null}

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : friends.length === 0 ? (
                    <Text as="p" size="sm" variant="muted">
                        You don't have any friends to invite yet.
                    </Text>
                ) : filteredFriends.length === 0 ? (
                    <Text as="p" size="sm" variant="muted">
                        No friends match "{searchQuery}".
                    </Text>
                ) : (
                    <div className="-mx-1 max-h-96 space-y-1 overflow-y-auto">
                        {filteredFriends.map((friend) => (
                            <div
                                className="flex items-center gap-2"
                                key={friend.id}
                            >
                                <div className="min-w-0 flex-1">
                                    <UserItem
                                        noFetch
                                        initialData={{
                                            username: friend.username,
                                            displayName: friend.displayName,
                                            profilePicture:
                                                friend.profilePicture,
                                            customStatus: friend.customStatus,
                                        }}
                                        userId={friend.id}
                                    />
                                </div>
                                <InviteActionButton
                                    state={states[friend.id] ?? 'idle'}
                                    onClick={(): void => {
                                        void handleInvite(friend.id);
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
