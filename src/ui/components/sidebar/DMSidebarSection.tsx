import React from 'react';

import type { User } from '@/api/users/users.types';
import { UserItem } from '@/ui/components/common/UserItem';

interface DMSidebarSectionProps {
    friend: User;
    me: User;
}

/**
 * @description Renders the participants in a Direct Message context.
 */
export const DMSidebarSection: React.FC<DMSidebarSectionProps> = ({
    friend,
    me,
}) => (
    <div className="min-w-0 space-y-4">
        <div className="text-foreground-muted truncate px-1 text-xs font-semibold tracking-wider uppercase">
            Direct Message
        </div>
        <div className="min-w-0 space-y-0">
            <UserItem noFetch initialData={friend} userId={friend._id} />
            <UserItem noFetch initialData={me} userId={me._id} />
        </div>
    </div>
);
