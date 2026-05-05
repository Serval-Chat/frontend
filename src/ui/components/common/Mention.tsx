import React, { useRef, useState } from 'react';

import { useUserById } from '@/api/users/users.queries';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';

interface MentionProps {
    userId: string;
    serverId?: string;
}

const isValidUserId = (id: string): boolean => /^[a-f\d]{24}$/i.test(id);

/**
 * @description Beautifully renders a user mention.
 */
export const Mention: React.FC<MentionProps> = ({ userId, serverId }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const { data: user, isLoading } = useUserById(userId);

    if (!isValidUserId(userId)) {
        return (
            <Box
                as="span"
                className="inline-flex cursor-default items-baseline rounded bg-primary/10 px-1.5 py-[4px] font-medium text-primary transition-colors select-none"
            >
                <Text as="span" className="leading-none" size="sm">
                    @unknown user
                </Text>
            </Box>
        );
    }

    const displayName = user
        ? user.displayName || user.username
        : isLoading
          ? '...'
          : 'unknown user';

    return (
        <>
            <Box
                as="span"
                className="inline-flex cursor-pointer items-baseline rounded bg-primary/10 px-1.5 py-[4px] font-medium text-primary transition-colors select-none hover:bg-primary/20"
                ref={triggerRef}
                onClick={() => setIsPopupOpen(true)}
            >
                <Text as="span" className="leading-none" size="sm">
                    @{displayName}
                </Text>
            </Box>

            <ProfilePopup
                isOpen={isPopupOpen}
                serverId={serverId}
                triggerRef={triggerRef}
                userId={userId}
                onClose={() => setIsPopupOpen(false)}
            />
        </>
    );
};
