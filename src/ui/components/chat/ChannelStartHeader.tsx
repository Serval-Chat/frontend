import React from 'react';

import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ChannelIcon } from '@/ui/components/servers/ChannelIcon';
import { resolveDisplayName } from '@/utils/displayName';

export interface ChannelStartHeaderProps {
    channel?: Channel;
    friendUser?: User;
}

export const ChannelStartHeader: React.FC<ChannelStartHeaderProps> = ({
    channel,
    friendUser,
}) => {
    if (friendUser) {
        const displayName =
            resolveDisplayName(
                undefined,
                friendUser.displayName,
                friendUser.username,
            ) || 'User';

        return (
            <Box className="flex flex-col items-start px-4 pt-8 pb-4 select-none">
                <Box className="mb-3">
                    <UserProfilePicture
                        noIndicator
                        size="xl"
                        src={friendUser.profilePicture}
                        username={friendUser.username}
                    />
                </Box>
                <Text className="text-2xl font-bold text-foreground md:text-3xl">
                    {displayName}
                </Text>
                <Text className="text-foreground-muted mt-1 text-sm">
                    This is the start of your direct message history with{' '}
                    <span className="font-semibold text-foreground">
                        {displayName}
                    </span>
                    .
                </Text>
                <hr className="mt-4 w-full border-neutral-600/50" />
            </Box>
        );
    }

    if (channel) {
        const prefix = channel.type === 'text' ? '#' : '';

        return (
            <Box className="flex flex-col items-start px-4 pt-8 pb-4 select-none">
                <Box className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs">
                    <ChannelIcon
                        className="h-8 w-8"
                        emoji={channel.emoji}
                        emojiType={channel.emojiType}
                        icon={channel.icon}
                        type={channel.type}
                    />
                </Box>
                <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    Welcome to {prefix}
                    {channel.name}!
                </Text>
                <Text className="text-foreground-muted mt-1 text-sm">
                    This is the start of the{' '}
                    <span className="font-semibold text-foreground">
                        {prefix}
                        {channel.name}
                    </span>{' '}
                    channel.
                </Text>
                {channel.description ? (
                    <Box className="max-w-2xl text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {channel.description}
                    </Box>
                ) : null}
                <hr className="mt-4 w-full border-neutral-600/50" />
            </Box>
        );
    }

    return null;
};
