import React from 'react';

import type { User } from '@/api/users/users.types';
import { UserItem } from '@/ui/components/common/UserItem';

interface DMSidebarSectionProps {
    friend: User;
    me: User;
    searchQuery?: string;
}

/**
 * @description Renders the participants in a Direct Message context.
 */
export const DMSidebarSection: React.FC<DMSidebarSectionProps> = ({
    friend,
    me,
    searchQuery,
}) => {
    const members = [friend, me];
    const filteredMembers = searchQuery
        ? members.filter(
              (m) =>
                  (m.displayName || '')
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                  (m.username || '')
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
          )
        : members;

    return (
        <div className="min-w-0 space-y-4">
            <div className="text-foreground-muted truncate px-1 text-xs font-semibold tracking-wider uppercase">
                Direct Message
            </div>
            <div className="min-w-0 space-y-0">
                {filteredMembers.map((m) => (
                    <UserItem
                        noFetch
                        initialData={m}
                        key={m._id}
                        userId={m._id}
                    />
                ))}
            </div>
        </div>
    );
};
