import React, { useState } from 'react';

import { useMe } from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

import { StatusModal } from './StatusModal';

export const MiniProfile: React.FC = () => {
    const { data: user } = useMe();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const presence = useAppSelector(
        (state) => state.presence.users[user?._id || ''],
    );
    const presenceStatus = presence?.status || 'offline';

    const customStatus = user?.customStatus;
    const statusText = customStatus?.text || '';
    const statusEmoji = customStatus?.emoji || '';

    const handleStatusClick = (): void => {
        setIsStatusModalOpen(true);
    };

    const renderStatusEmoji = (): React.ReactNode => {
        if (!statusEmoji) return null;

        const isCustomEmoji = /^[0-9a-fA-F]{24}$/.test(statusEmoji);
        if (isCustomEmoji) {
            return (
                <ParsedEmoji className="mr-1 h-4 w-4" emojiId={statusEmoji} />
            );
        }

        return <ParsedUnicodeEmoji className="mr-1" content={statusEmoji} />;
    };

    if (!user) return null;

    return (
        <Box className="flex h-[60px] shrink-0 items-center justify-between border-t border-border-subtle bg-[var(--tertiary-bg)] px-2 py-2">
            <Box className="mr-2 flex min-w-0 flex-1 items-center">
                <UserProfilePicture
                    className="mr-2 shrink-0"
                    size="sm"
                    src={user.profilePicture}
                    status={presenceStatus}
                    username={user.username}
                />
                <Box className="flex min-w-0 flex-1 flex-col">
                    <StyledUserName
                        className="!text-header-primary text-sm leading-tight font-semibold"
                        disableCustomFonts={
                            user.settings?.disableCustomUsernameFonts
                        }
                        user={user}
                    >
                        {user.displayName || user.username}
                    </StyledUserName>
                    <Box
                        className="text-header-secondary flex cursor-pointer items-center truncate text-xs leading-tight opacity-70 transition-opacity hover:opacity-100"
                        onClick={handleStatusClick}
                    >
                        {statusEmoji || statusText ? (
                            <>
                                {renderStatusEmoji()}
                                <span className="truncate">{statusText}</span>
                            </>
                        ) : (
                            'Set specific status'
                        )}
                    </Box>
                </Box>
            </Box>

            <StatusModal
                initialEmoji={statusEmoji}
                initialText={statusText}
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
            />
        </Box>
    );
};
