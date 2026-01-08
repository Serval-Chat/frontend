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
    <div className="space-y-4">
        <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider px-1">
            Direct Message
        </div>
        <div className="space-y-0">
            <UserItem userId={friend._id} initialData={friend} noFetch />
            <UserItem userId={me._id} initialData={me} noFetch />
        </div>
    </div>
);
