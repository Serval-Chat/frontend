import { useFriends } from '@/api/friends/friends.queries';
import type { User } from '@/api/users/users.types';
import { UserItem } from '@/ui/components/common/UserItem';

interface DMSidebarSectionProps {
    friend: User;
    me: User;
}

/**
 * @description Renders the participants in a Direct Message context.
 */
export const DMSidebarSection = ({ friend, me }: DMSidebarSectionProps) => {
    const { data: friends } = useFriends();
    const friendData = friends?.find((f) => f.id === friend.id);
    const friendIsOnline: 'online' | 'offline' =
        friendData?.isOnline === true ? 'online' : 'offline';

    return (
        <div className="min-w-0 space-y-4">
            <div className="text-foreground-muted truncate px-1 text-xs font-semibold tracking-wider uppercase">
                Direct Message
            </div>
            <div className="min-w-0 space-y-0">
                <UserItem
                    noFetch
                    initialPresenceStatus={friendIsOnline}
                    user={friend}
                    userId={friend.id}
                />
                <UserItem noFetch user={me} userId={me.id} />
            </div>
        </div>
    );
};
