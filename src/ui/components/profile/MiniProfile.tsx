import React, { useState } from 'react';

import { useMe } from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
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
                <ParsedEmoji className="mr-1 w-4 h-4" emojiId={statusEmoji} />
            );
        }

        return <ParsedUnicodeEmoji className="mr-1" content={statusEmoji} />;
    };

    if (!user) return null;

    return (
        <Box className="flex items-center justify-between px-2 py-2 bg-[var(--tertiary-bg)] border-t border-[var(--color-border-subtle)] h-[60px] shrink-0">
            <Box className="flex items-center min-w-0 mr-2 flex-1">
                <Box className="relative shrink-0 mr-2">
                    <UserProfilePicture
                        className="w-9 h-9"
                        size="sm"
                        src={user.profilePicture}
                        status={presenceStatus}
                        username={user.username}
                    />
                </Box>
                <Box className="min-w-0 flex flex-col flex-1">
                    <Text className="text-sm font-semibold text-[var(--color-header-primary)] truncate leading-tight">
                        {user.displayName || user.username}
                    </Text>
                    <Box
                        className="text-xs text-[var(--color-header-secondary)] truncate leading-tight opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex items-center"
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
