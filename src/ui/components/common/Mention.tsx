import { useRef, useState } from 'react';

import { useMembers } from '@/api/servers/servers.queries';
import { useUserById } from '@/api/users/users.queries';
import { Text, type TextProps } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';

interface MentionProps {
    userId: string;
    serverId?: string;
    size?: TextProps['size'];
}

const isValidUserId = (id: string): boolean => /^[a-f\d]{24}$/i.test(id);

/**
 * @description Beautifully renders a user mention.
 */
export const Mention = ({ userId, serverId, size = 'sm' }: MentionProps) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const { data: user, isLoading: isUserLoading } = useUserById(userId);
    const { data: members } = useMembers(serverId || null, {
        enabled: !!serverId,
    });

    if (!isValidUserId(userId)) {
        return (
            <Box
                as="span"
                className="inline-flex cursor-default items-baseline rounded bg-[var(--mention-bg,var(--primary-muted))] px-1.5 py-[4px] font-medium text-[var(--mention-text,var(--primary))] transition-colors select-none"
            >
                <Text as="span" className="leading-none" size={size}>
                    @unknown user
                </Text>
            </Box>
        );
    }

    const member = members?.find((m): boolean => m.userId === userId);

    const displayName = member?.nickname
        ? member.nickname
        : user
          ? user.displayName || user.username
          : isUserLoading
            ? '...'
            : 'unknown user';

    return (
        <>
            <Box
                as="span"
                className="inline-flex cursor-pointer items-baseline rounded bg-[var(--mention-bg,var(--primary-muted))] px-1.5 py-[4px] font-medium text-[var(--mention-text,var(--primary))] transition-colors select-none hover:bg-[var(--mention-bg-hover,var(--primary-muted))]"
                ref={triggerRef}
                onClick={(): void => setIsPopupOpen(true)}
            >
                <Text as="span" className="leading-none" size={size}>
                    @{displayName}
                </Text>
            </Box>

            <ProfilePopup
                isOpen={isPopupOpen}
                serverId={serverId}
                triggerRef={triggerRef}
                userId={userId}
                onClose={(): void => setIsPopupOpen(false)}
            />
        </>
    );
};
