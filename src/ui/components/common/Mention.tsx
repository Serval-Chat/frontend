import React, { useRef, useState } from 'react';

import { useUserById } from '@/api/users/users.queries';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';

interface MentionProps {
    userId: string;
}

/**
 * @description Beautifully renders a user mention.
 */
export const Mention: React.FC<MentionProps> = ({ userId }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const { data: user, isLoading } = useUserById(userId);

    const displayName = user
        ? user.displayName || user.username
        : isLoading
          ? '...'
          : 'unknown user';

    return (
        <>
            <Box
                as="span"
                className="inline-flex items-baseline px-1.5 py-[4px] rounded bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors cursor-pointer select-none"
                ref={triggerRef}
                onClick={() => setIsPopupOpen(true)}
            >
                <Text as="span" className="leading-none" size="sm">
                    @{displayName}
                </Text>
            </Box>

            <ProfilePopup
                isOpen={isPopupOpen}
                triggerRef={triggerRef}
                userId={userId}
                onClose={() => setIsPopupOpen(false)}
            />
        </>
    );
};
